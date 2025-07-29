import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { ArrowLeft, Calendar, Clock, User, Save, Send, AlertCircle } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { ethers } from 'ethers';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';
import LoadingSpinner from '../components/UI/LoadingSpinner';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.5rem;
  color: #9ca3af;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.15);
    color: #e5e7eb;
  }
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  color: #e5e7eb;
`;

const FormContainer = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2rem;
  
  @media (max-width: 968px) {
    grid-template-columns: 1fr;
  }
`;

const MainForm = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 2rem;
`;

const Sidebar = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  color: #e5e7eb;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 1.5rem;
`;

const TeamSelector = styled.div`
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 1rem;
  align-items: end;
  margin-bottom: 1.5rem;
`;

const VSIndicator = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 40px;
  background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%);
  border-radius: 8px;
  color: white;
  font-weight: 600;
  font-size: 0.875rem;
`;

const TeamCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const TeamLogoPreview = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  
  img {
    width: 40px;
    height: 40px;
    object-fit: contain;
  }
`;

const HandicapGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.5rem;
  margin-bottom: 1.5rem;
`;

const HandicapButton = styled.button`
  padding: 0.75rem;
  background: ${props => props.selected ? 'rgba(59, 130, 246, 0.3)' : 'rgba(255, 255, 255, 0.05)'};
  border: 1px solid ${props => props.selected ? '#3b82f6' : 'rgba(255, 255, 255, 0.1)'};
  border-radius: 8px;
  color: ${props => props.selected ? '#60a5fa' : '#9ca3af'};
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
  font-weight: 500;
  
  &:hover {
    background: rgba(59, 130, 246, 0.1);
    color: #e5e7eb;
  }
`;

const PreviewCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1.5rem;
`;

const PreviewHeader = styled.div`
  display: flex;
  justify-content: between;
  align-items: center;
  margin-bottom: 1rem;
`;

const PreviewBadge = styled.span`
  background: rgba(59, 130, 246, 0.2);
  color: #60a5fa;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
`;

const PreviewTitle = styled.h3`
  color: #e5e7eb;
  font-size: 1rem;
  font-weight: 600;
  margin: 1rem 0;
  line-height: 1.4;
`;

const PreviewOptions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const PreviewOption = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  font-size: 0.875rem;
  color: #e5e7eb;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
  
  @media (max-width: 640px) {
    flex-direction: column;
  }
`;

const CreateSportsMarketPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [leagues, setLeagues] = useState([]);
  const [teams, setTeams] = useState([]);
  const [handicaps, setHandicaps] = useState([]);
  
  const [formData, setFormData] = useState({
    sport: 'football', // football or basketball
    league: '',
    teamA: '',
    teamB: '',
    handicap: null,
    matchDate: '',
    matchTime: '',
    oracle: '',
    autoPublish: false
  });

  const [teamLogos, setTeamLogos] = useState({
    teamA: null,
    teamB: null
  });

  // 获取基础数据
  useEffect(() => {
    fetchLeagues();
    fetchHandicaps();
  }, [formData.sport]);

  // 获取球队列表
  useEffect(() => {
    if (formData.league) {
      fetchTeams();
    }
  }, [formData.sport, formData.league]);

  // 更新球队logo
  useEffect(() => {
    updateTeamLogos();
  }, [formData.teamA, formData.teamB, teams]);

  const fetchLeagues = async () => {
    try {
      const response = await axios.get(`/resources/leagues?sport=${formData.sport}`);
      if (response.data.success) {
        setLeagues(response.data.data);
      }
    } catch (error) {
      console.error('获取联赛失败:', error);
    }
  };

  const fetchTeams = async () => {
    try {
      const response = await axios.get(`/resources/teams?sport=${formData.sport}&league=${formData.league}`);
      if (response.data.success) {
        setTeams(response.data.data);
      }
    } catch (error) {
      console.error('获取球队失败:', error);
    }
  };

  const fetchHandicaps = async () => {
    try {
      const url = formData.sport 
        ? `/resources/handicaps?sport=${formData.sport}`
        : '/resources/handicaps';
      
      const response = await axios.get(url);
      if (response.data.success) {
        setHandicaps(response.data.data);
      }
    } catch (error) {
      console.error('获取让球选项失败:', error);
    }
  };

  const updateTeamLogos = () => {
    const teamAData = teams.find(t => t.id === formData.teamA);
    const teamBData = teams.find(t => t.id === formData.teamB);
    
    console.log('🏈 UpdateTeamLogos - Teams:', teams);
    console.log('🏈 UpdateTeamLogos - FormData:', formData.teamA, formData.teamB);
    console.log('🏈 UpdateTeamLogos - TeamAData:', teamAData);
    console.log('🏈 UpdateTeamLogos - TeamBData:', teamBData);
    
    const newTeamLogos = {
      teamA: teamAData?.logoUrl || null,
      teamB: teamBData?.logoUrl || null
    };
    
    console.log('🏈 UpdateTeamLogos - New logos:', newTeamLogos);
    setTeamLogos(newTeamLogos);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSportChange = (sport) => {
    // 切换运动类型时重置相关字段
    setFormData(prev => ({
      ...prev,
      sport,
      league: '',
      teamA: '',
      teamB: '',
      handicap: sport === 'basketball' ? null : prev.handicap // 篮球没有让球
    }));
    setTeams([]);
    setTeamLogos({ teamA: null, teamB: null });
  };

  const validateForm = () => {
    const errors = [];
    
    if (!formData.league) errors.push('请选择联赛');
    if (!formData.teamA) errors.push('请选择主队');
    if (!formData.teamB) errors.push('请选择客队');
    if (formData.teamA === formData.teamB) errors.push('主队和客队不能相同');
    if (!formData.matchDate) errors.push('请选择比赛日期');
    if (!formData.matchTime) errors.push('请选择比赛时间');
    if (!formData.oracle) errors.push('请输入预言机地址');
    
    // 足球需要选择让球
    if (formData.sport === 'football' && formData.handicap === null) {
      errors.push('请选择让球数');
    }

    return errors;
  };

  const generateMarketData = () => {
    const teamAData = teams.find(t => t.id === formData.teamA);
    const teamBData = teams.find(t => t.id === formData.teamB);
    const leagueData = leagues.find(l => l.id === formData.league);
    
    // 验证日期时间
    if (!formData.matchDate || !formData.matchTime) {
      throw new Error('请选择比赛日期和时间');
    }
    
    const matchDateTime = new Date(`${formData.matchDate}T${formData.matchTime}`);
    
    // 验证时间是否有效
    if (isNaN(matchDateTime.getTime())) {
      throw new Error('比赛时间格式不正确');
    }
    
    let title, optionA, optionB;
    
    if (formData.sport === 'football') {
      const handicapText = formData.handicap > 0 ? `+${formData.handicap}` : formData.handicap;
      title = `${teamAData?.displayName} vs ${teamBData?.displayName} (让球${handicapText})`;
      optionA = `上盘（${teamAData?.displayName}让${Math.abs(formData.handicap)}球获胜）`;
      optionB = `下盘（${teamBData?.displayName}受让${Math.abs(formData.handicap)}球获胜）`;
    } else {
      title = `${teamAData?.displayName} vs ${teamBData?.displayName}`;
      optionA = `${teamAData?.displayName}获胜`;
      optionB = `${teamBData?.displayName}获胜`;
    }

    return {
      type: 'sports',
      category: formData.sport,
      title,
      description: `${leagueData?.displayName}：${title}。预测获胜方。比赛时间：${matchDateTime.toLocaleString('zh-CN')}。`,
      optionA,
      optionB,
      resolutionTime: matchDateTime.toISOString(),
      oracle: formData.oracle,
      metadata: {
        sport: formData.sport,
        league: formData.league,
        teamA: formData.teamA,
        teamB: formData.teamB,
        handicap: formData.handicap,
        matchDateTime: matchDateTime.toISOString(),
        teamLogos: teamLogos,
        subcategory: formData.sport
      },
      autoPublish: formData.autoPublish
    };
  };

  const handleSubmit = async (autoPublish = false) => {
    const errors = validateForm();
    if (errors.length > 0) {
      toast.error(errors[0]);
      return;
    }

    // 如果要发布到链上，需要检查钱包连接
    if (autoPublish) {
      if (!window.ethereum) {
        toast.error('发布到链上需要连接 MetaMask 钱包');
        return;
      }

      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (!accounts.length) {
          toast.error('请先连接钱包再发布市场');
          return;
        }
      } catch (error) {
        toast.error('无法获取钱包信息');
        return;
      }
    }

    try {
      setLoading(true);
      
      let marketData;
      try {
        marketData = {
          ...generateMarketData(),
          autoPublish
        };
      } catch (generateError) {
        toast.error(generateError.message);
        return;
      }

      console.log('🏈 Submit - TeamLogos state:', teamLogos);
      console.log('🏈 Submit - MarketData:', marketData);

      // 所有市场创建都通过API，让后端决定是否需要钱包签名
      const response = await axios.post('/markets', marketData);
      
      if (response.data.success) {
        const action = autoPublish ? '创建并发布' : '创建';
        toast.success(`🎉 市场${action}成功！`);
        
        setTimeout(() => {
          navigate('/markets');
        }, 2000);
      } else {
        toast.error(response.data.message || '创建失败');
      }
    } catch (error) {
      console.error('创建市场失败:', error);
      
      // 检查是否需要钱包签名
      if (error.response?.data?.requireWalletSignature) {
        console.log('🔗 需要钱包签名，开始钱包签名流程');
        const backendMarketData = error.response.data.marketData;
        
        // 调用钱包签名创建市场
        try {
          await handleWalletCreateMarket(backendMarketData);
        } catch (walletError) {
          console.error('钱包签名失败:', walletError);
          // handleWalletCreateMarket内部已处理错误提示
        }
      } else {
        toast.error(error.response?.data?.message || '创建市场失败');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleWalletCreateMarket = async (marketData) => {
    try {
      // 获取钱包地址
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      const signerAddress = accounts[0];

      console.log('🔗 准备使用钱包创建市场:', signerAddress);

      // 第一步：准备交易数据
      const prepareResponse = await axios.post('/wallet-markets/prepare-create', {
        marketData,
        signerAddress
      });

      if (!prepareResponse.data.success) {
        throw new Error(prepareResponse.data.message || '准备交易失败');
      }

      const { transactionData } = prepareResponse.data;
      console.log('📋 交易数据已准备:', transactionData);

      // 第二步：钱包签名交易
      console.log('🔐 准备钱包签名，交易数据:', transactionData);
      toast.loading('请在钱包中确认交易...', { id: 'wallet-sign' });
      
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      
      console.log('🔐 即将调用signer.sendTransaction，应该弹出钱包');
      const tx = await signer.sendTransaction(transactionData);
      console.log('✅ 钱包签名完成，交易已发送');
      
      toast.success('交易已提交到区块链', { id: 'wallet-sign' });
      console.log('📤 交易已发送:', tx.hash);

      // 第三步：提交交易哈希给后端处理
      toast.loading('等待交易确认...', { id: 'tx-confirm' });
      
      const submitResponse = await axios.post('/wallet-markets/submit-create', {
        txHash: tx.hash,
        marketData,
        signerAddress
      });

      if (submitResponse.data.success) {
        toast.success('🎉 市场创建并发布成功！', { id: 'tx-confirm' });
        console.log('✅ 市场已成功创建:', submitResponse.data);
        
        setTimeout(() => {
          navigate('/markets');
        }, 2000);
      } else {
        throw new Error(submitResponse.data.message || '提交交易失败');
      }

    } catch (error) {
      console.error('钱包创建市场失败:', error);
      toast.dismiss();
      
      if (error.code === 4001) {
        toast.error('用户取消了交易');
      } else if (error.message?.includes('insufficient funds')) {
        toast.error('余额不足，请确保有足够的BNB支付gas费');
      } else {
        toast.error(error.message || '钱包签名失败');
      }
      throw error;
    }
  };

  const getPreviewTitle = () => {
    if (!formData.teamA || !formData.teamB) return '请选择对阵球队...';
    
    const teamAData = teams.find(t => t.id === formData.teamA);
    const teamBData = teams.find(t => t.id === formData.teamB);
    
    if (formData.sport === 'football' && formData.handicap !== null) {
      const handicapText = formData.handicap > 0 ? `+${formData.handicap}` : formData.handicap;
      return `${teamAData?.displayName} vs ${teamBData?.displayName} (让球${handicapText})`;
    }
    
    return `${teamAData?.displayName} vs ${teamBData?.displayName}`;
  };

  if (!leagues.length && formData.sport) {
    return <LoadingSpinner text="加载联赛数据..." />;
  }

  return (
    <Container>
      <Header>
        <BackButton onClick={() => navigate('/create-market')}>
          <ArrowLeft size={16} />
          返回
        </BackButton>
        <Title>创建体育赛事市场</Title>
      </Header>

      <FormContainer>
        <MainForm>
          <SectionTitle>
            🏀 基本信息
          </SectionTitle>

          {/* 运动类型选择 */}
          <FormGrid>
            <div>
              <label style={{ color: '#e5e7eb', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>
                运动类型 <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <HandicapButton
                  type="button"
                  selected={formData.sport === 'football'}
                  onClick={() => handleSportChange('football')}
                >
                  ⚽ 足球
                </HandicapButton>
                <HandicapButton
                  type="button"
                  selected={formData.sport === 'basketball'}
                  onClick={() => handleSportChange('basketball')}
                >
                  🏀 篮球
                </HandicapButton>
              </div>
            </div>

            <Input
              label="联赛"
              required
              type="select"
              value={formData.league}
              onChange={(e) => handleInputChange('league', e.target.value)}
              options={[
                { value: '', label: '选择联赛' },
                ...leagues.map(league => ({
                  value: league.id,
                  label: league.displayName
                }))
              ]}
            />
          </FormGrid>

          {/* 球队选择 */}
          <SectionTitle>⚽ 对阵球队</SectionTitle>
          <TeamSelector>
            <TeamCard>
              <Input
                label="主队"
                required
                type="select"
                value={formData.teamA}
                onChange={(e) => handleInputChange('teamA', e.target.value)}
                options={[
                  { value: '', label: '选择主队' },
                  ...teams.filter(team => team.id !== formData.teamB).map(team => ({
                    value: team.id,
                    label: team.displayName
                  }))
                ]}
              />
              {teamLogos.teamA && (
                <TeamLogoPreview>
                  <img src={`http://localhost:3001${teamLogos.teamA}`} alt="主队" />
                </TeamLogoPreview>
              )}
            </TeamCard>

            <VSIndicator>VS</VSIndicator>

            <TeamCard>
              <Input
                label="客队"
                required
                type="select"
                value={formData.teamB}
                onChange={(e) => handleInputChange('teamB', e.target.value)}
                options={[
                  { value: '', label: '选择客队' },
                  ...teams.filter(team => team.id !== formData.teamA).map(team => ({
                    value: team.id,
                    label: team.displayName
                  }))
                ]}
              />
              {teamLogos.teamB && (
                <TeamLogoPreview>
                  <img src={`http://localhost:3001${teamLogos.teamB}`} alt="客队" />
                </TeamLogoPreview>
              )}
            </TeamCard>
          </TeamSelector>

          {/* 让球选择 - 只有足球显示 */}
          {formData.sport === 'football' && (
            <>
              <SectionTitle>🎯 让球设置</SectionTitle>
              <HandicapGrid>
                {handicaps.map((handicap) => (
                  <HandicapButton
                    key={handicap.id}
                    type="button"
                    selected={formData.handicap === handicap.value}
                    onClick={() => handleInputChange('handicap', handicap.value)}
                  >
                    {handicap.displayName}
                  </HandicapButton>
                ))}
              </HandicapGrid>
            </>
          )}

          {/* 时间设置 */}
          <SectionTitle>
            <Calendar size={20} />
            时间设置
          </SectionTitle>
          <FormGrid>
            <Input
              label="比赛日期"
              required
              type="date"
              value={formData.matchDate}
              onChange={(e) => handleInputChange('matchDate', e.target.value)}
            />
            <Input
              label="比赛时间"
              required
              type="time"
              value={formData.matchTime}
              onChange={(e) => handleInputChange('matchTime', e.target.value)}
            />
          </FormGrid>

          <SectionTitle>
            <User size={20} />
            预言机设置
          </SectionTitle>
          <Input
            label="预言机地址"
            required
            type="text"
            value={formData.oracle}
            onChange={(e) => handleInputChange('oracle', e.target.value)}
            placeholder="0x..."
            helpText="负责在比赛结束后提供结果的地址"
          />
        </MainForm>

        <Sidebar>
          <PreviewCard>
            <SectionTitle>📋 市场预览</SectionTitle>
            <PreviewHeader>
              <PreviewBadge>
                {formData.sport === 'football' ? '⚽ 足球' : '🏀 篮球'}
              </PreviewBadge>
            </PreviewHeader>
            
            <PreviewTitle>
              {getPreviewTitle()}
            </PreviewTitle>

            <PreviewOptions>
              <PreviewOption>
                <span style={{ color: '#10b981' }}>✅</span>
                {formData.sport === 'football' && formData.handicap !== null
                  ? `上盘（主队让${Math.abs(formData.handicap)}球获胜）`
                  : '主队获胜'
                }
              </PreviewOption>
              <PreviewOption>
                <span style={{ color: '#ef4444' }}>❌</span>
                {formData.sport === 'football' && formData.handicap !== null
                  ? `下盘（客队受让${Math.abs(formData.handicap)}球获胜）`
                  : '客队获胜'
                }
              </PreviewOption>
            </PreviewOptions>

            {formData.matchDate && formData.matchTime && (
              <div style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
                <Clock size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
                {new Date(`${formData.matchDate}T${formData.matchTime}`).toLocaleString('zh-CN')}
              </div>
            )}
          </PreviewCard>

          <PreviewCard>
            <SectionTitle>
              <AlertCircle size={20} />
              创建须知
            </SectionTitle>
            <div style={{ color: '#9ca3af', fontSize: '0.875rem', lineHeight: '1.5' }}>
              <p style={{ marginBottom: '0.5rem' }}>• 创建市场需要支付少量Gas费用</p>
              <p style={{ marginBottom: '0.5rem' }}>• 作为预言机需要在比赛结束后提供结果</p>
              <p style={{ marginBottom: '0.5rem' }}>• 市场信息创建后无法修改</p>
              <p>• 需要添加流动性后才能开始交易</p>
            </div>
          </PreviewCard>
        </Sidebar>
      </FormContainer>

      <ActionButtons>
        <Button
          variant="secondary"
          size="lg"
          onClick={() => handleSubmit(false)}
          loading={loading}
          disabled={!formData.teamA || !formData.teamB}
        >
          <Save size={20} />
          保存草稿
        </Button>
        
        <Button
          variant="primary"
          size="lg"
          onClick={() => handleSubmit(true)}
          loading={loading}
          disabled={!formData.teamA || !formData.teamB}
        >
          <Send size={20} />
          创建并发布
        </Button>
      </ActionButtons>
    </Container>
  );
};

export default CreateSportsMarketPage;