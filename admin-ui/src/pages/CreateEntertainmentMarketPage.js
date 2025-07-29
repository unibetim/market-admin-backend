import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { ArrowLeft, Calendar, Clock, User, Save, Send, AlertCircle, Calendar as CalendarIcon } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { ethers } from 'ethers';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';

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
  background: rgba(236, 72, 153, 0.2);
  color: #ec4899;
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

const CreateEntertainmentMarketPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    optionA: '',
    optionB: '',
    resolutionDate: '',
    resolutionTime: '',
    oracle: '',
    autoPublish: false
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    const errors = [];
    
    if (!formData.title) errors.push('请输入市场标题');
    if (!formData.description) errors.push('请输入市场描述');
    if (!formData.optionA) errors.push('请输入选项A');
    if (!formData.optionB) errors.push('请输入选项B');
    if (!formData.resolutionDate) errors.push('请选择结算日期');
    if (!formData.resolutionTime) errors.push('请选择结算时间');
    if (!formData.oracle) errors.push('请输入预言机地址');

    return errors;
  };

  const generateMarketData = () => {
    // 验证日期时间
    if (!formData.resolutionDate || !formData.resolutionTime) {
      throw new Error('请选择结算日期和时间');
    }
    
    const resolutionDateTime = new Date(`${formData.resolutionDate}T${formData.resolutionTime}`);
    
    // 验证时间是否有效
    if (isNaN(resolutionDateTime.getTime())) {
      throw new Error('结算时间格式不正确');
    }
    
    return {
      type: 'entertainment',
      category: 'entertainment',
      title: formData.title,
      description: formData.description,
      optionA: formData.optionA,
      optionB: formData.optionB,
      resolutionTime: resolutionDateTime.toISOString(),
      oracle: formData.oracle,
      metadata: {
        category: 'entertainment',
        subcategory: 'entertainment',
        resolutionDateTime: resolutionDateTime.toISOString()
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

      console.log('🎬 Submit - MarketData:', marketData);

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
        toast.error(error.response?.data?.message || '创庺市场失败');
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

  return (
    <Container>
      <Header>
        <BackButton onClick={() => navigate('/create-market')}>
          <ArrowLeft size={16} />
          返回
        </BackButton>
        <Title>创建娱乐事件市场</Title>
      </Header>

      <FormContainer>
        <MainForm>
          <SectionTitle>
            <CalendarIcon size={20} />
            基本信息
          </SectionTitle>

          <Input
            label="市场标题"
            required
            type="text"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            placeholder="例如：电影《阿凡达3》首周末票房是否会超过3亿美元？"
          />

          <Input
            label="市场描述"
            required
            type="textarea"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="详细描述预测事件和判断标准"
            rows={4}
          />

          <FormGrid>
            <Input
              label="选项A (YES)"
              required
              type="text"
              value={formData.optionA}
              onChange={(e) => handleInputChange('optionA', e.target.value)}
              placeholder="例如：会超过3亿美元"
            />
            <Input
              label="选项B (NO)"
              required
              type="text"
              value={formData.optionB}
              onChange={(e) => handleInputChange('optionB', e.target.value)}
              placeholder="例如：不会超过3亿美元"
            />
          </FormGrid>

          <SectionTitle>
            <Calendar size={20} />
            结算时间
          </SectionTitle>
          <FormGrid>
            <Input
              label="结算日期"
              required
              type="date"
              value={formData.resolutionDate}
              onChange={(e) => handleInputChange('resolutionDate', e.target.value)}
            />
            <Input
              label="结算时间"
              required
              type="time"
              value={formData.resolutionTime}
              onChange={(e) => handleInputChange('resolutionTime', e.target.value)}
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
            helpText="负责在结算时间后提供结果的地址"
          />
        </MainForm>

        <Sidebar>
          <PreviewCard>
            <SectionTitle>📋 市场预览</SectionTitle>
            <PreviewHeader>
              <PreviewBadge>🎬 娱乐事件</PreviewBadge>
            </PreviewHeader>
            
            <PreviewTitle>
              {formData.title || '请输入市场标题...'}
            </PreviewTitle>

            <PreviewOptions>
              <PreviewOption>
                <span style={{ color: '#10b981' }}>✅</span>
                {formData.optionA || '选项A'}
              </PreviewOption>
              <PreviewOption>
                <span style={{ color: '#ef4444' }}>❌</span>
                {formData.optionB || '选项B'}
              </PreviewOption>
            </PreviewOptions>

            {formData.resolutionDate && formData.resolutionTime && (
              <div style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
                <Clock size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
                {new Date(`${formData.resolutionDate}T${formData.resolutionTime}`).toLocaleString('zh-CN')}
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
              <p style={{ marginBottom: '0.5rem' }}>• 作为预言机需要在结算时间后提供结果</p>
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
          disabled={!formData.title || !formData.optionA || !formData.optionB}
        >
          <Save size={20} />
          保存草稿
        </Button>
        
        <Button
          variant="primary"
          size="lg"
          onClick={() => handleSubmit(true)}
          loading={loading}
          disabled={!formData.title || !formData.optionA || !formData.optionB}
        >
          <Send size={20} />
          创建并发布
        </Button>
      </ActionButtons>
    </Container>
  );
};

export default CreateEntertainmentMarketPage;