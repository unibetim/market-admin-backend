import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { ArrowLeft, Calendar, Clock, User, Save, Send, AlertCircle, TrendingUp } from 'lucide-react';
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

const AssetSelector = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  align-items: end;
  margin-bottom: 1.5rem;
`;

const AssetCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const AssetIconPreview = styled.div`
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

const PriceRangeGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
  margin-bottom: 1.5rem;
`;

const PriceRangeButton = styled.button`
  padding: 0.75rem;
  background: ${props => props.selected ? 'rgba(245, 158, 11, 0.3)' : 'rgba(255, 255, 255, 0.05)'};
  border: 1px solid ${props => props.selected ? '#f59e0b' : 'rgba(255, 255, 255, 0.1)'};
  border-radius: 8px;
  color: ${props => props.selected ? '#f59e0b' : '#9ca3af'};
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
  font-weight: 500;
  
  &:hover {
    background: rgba(245, 158, 11, 0.1);
    color: #e5e7eb;
  }
`;

const TimeFrameGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
  margin-bottom: 1.5rem;
`;

const TimeFrameButton = styled.button`
  padding: 0.75rem;
  background: ${props => props.selected ? 'rgba(245, 158, 11, 0.3)' : 'rgba(255, 255, 255, 0.05)'};
  border: 1px solid ${props => props.selected ? '#f59e0b' : 'rgba(255, 255, 255, 0.1)'};
  border-radius: 8px;
  color: ${props => props.selected ? '#f59e0b' : '#9ca3af'};
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
  font-weight: 500;
  
  &:hover {
    background: rgba(245, 158, 11, 0.1);
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
  background: rgba(245, 158, 11, 0.2);
  color: #f59e0b;
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

const CreateFinanceMarketPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    category: 'crypto', // crypto, stocks, forex, commodities
    asset: 'bitcoin',
    priceTarget: '',
    timeframe: '1day',
    resolutionDate: '',
    resolutionTime: '',
    oracle: '',
    autoPublish: false
  });

  // 资产数据
  const assets = {
    crypto: [
      { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC', displayName: '比特币' },
      { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', displayName: '以太坊' },
      { id: 'binancecoin', name: 'BNB', symbol: 'BNB', displayName: '币安币' }
    ],
    stocks: [
      { id: 'aapl', name: 'Apple', symbol: 'AAPL', displayName: '苹果' },
      { id: 'goog', name: 'Google', symbol: 'GOOGL', displayName: '谷歌' },
      { id: 'msft', name: 'Microsoft', symbol: 'MSFT', displayName: '微软' }
    ],
    forex: [
      { id: 'eurusd', name: 'EUR/USD', symbol: 'EURUSD', displayName: '欧元/美元' },
      { id: 'gbpusd', name: 'GBP/USD', symbol: 'GBPUSD', displayName: '英镑/美元' },
      { id: 'usdjpy', name: 'USD/JPY', symbol: 'USDJPY', displayName: '美元/日元' }
    ],
    commodities: [
      { id: 'gold', name: 'Gold', symbol: 'XAU', displayName: '黄金' },
      { id: 'oil', name: 'Oil', symbol: 'CL', displayName: '原油' },
      { id: 'silver', name: 'Silver', symbol: 'XAG', displayName: '白银' }
    ]
  };

  // 价格范围数据
  const priceRanges = {
    bitcoin: ['50000', '60000', '70000', '80000', '100000', '120000'],
    ethereum: ['2000', '3000', '4000', '5000', '6000', '8000'],
    binancecoin: ['300', '400', '500', '600', '800', '1000'],
    aapl: ['150', '175', '200', '225', '250', '300'],
    goog: ['2500', '2750', '3000', '3250', '3500', '4000'],
    msft: ['300', '350', '400', '450', '500', '600'],
    eurusd: ['1.10', '1.15', '1.20', '1.25', '1.30', '1.35'],
    gbpusd: ['1.25', '1.30', '1.35', '1.40', '1.45', '1.50'],
    usdjpy: ['110', '120', '130', '140', '150', '160'],
    gold: ['1900', '2000', '2100', '2200', '2300', '2500'],
    oil: ['70', '80', '90', '100', '110', '120'],
    silver: ['22', '24', '26', '28', '30', '35']
  };

  // 时间范围数据
  const timeframes = [
    { id: '1day', name: '24小时内', display: '24小时' },
    { id: '1week', name: '1周内', display: '1周' },
    { id: '1month', name: '1个月内', display: '1个月' },
    { id: '3months', name: '3个月内', display: '3个月' },
    { id: '1year', name: '1年内', display: '1年' }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCategoryChange = (category) => {
    // 切换资产类型时重置相关字段
    setFormData(prev => ({
      ...prev,
      category,
      asset: assets[category][0]?.id || '',
      priceTarget: ''
    }));
  };

  const validateForm = () => {
    const errors = [];
    
    if (!formData.asset) errors.push('请选择资产');
    if (!formData.priceTarget) errors.push('请选择或输入价格目标');
    if (!formData.timeframe) errors.push('请选择时间范围');
    if (!formData.resolutionDate) errors.push('请选择结算日期');
    if (!formData.resolutionTime) errors.push('请选择结算时间');
    if (!formData.oracle) errors.push('请输入预言机地址');

    return errors;
  };

  const generateMarketData = () => {
    const assetData = assets[formData.category].find(a => a.id === formData.asset);
    const resolutionDateTime = new Date(`${formData.resolutionDate}T${formData.resolutionTime}`);
    
    const title = `${assetData?.displayName}价格预测 - ${timeframes.find(t => t.id === formData.timeframe)?.display}`;
    const description = `${assetData?.displayName}(${assetData?.symbol})在${timeframes.find(t => t.id === formData.timeframe)?.display}是否会达到${formData.priceTarget}${formData.category === 'forex' ? '' : '美元'}？`;
    
    const optionA = `达到目标价格(${formData.priceTarget}${formData.category === 'forex' ? '' : '美元'})`;
    const optionB = `未达到目标价格(${formData.priceTarget}${formData.category === 'forex' ? '' : '美元'})`;

    return {
      type: 'finance',
      category: formData.category,
      title,
      description,
      optionA,
      optionB,
      resolutionTime: resolutionDateTime.toISOString(),
      oracle: formData.oracle,
      metadata: {
        category: formData.category,
        asset: formData.asset,
        assetName: assetData?.displayName,
        assetSymbol: assetData?.symbol,
        priceTarget: formData.priceTarget,
        timeframe: formData.timeframe,
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

    try {
      setLoading(true);
      
      const marketData = {
        ...generateMarketData(),
        autoPublish
      };

      const response = await axios.post('/markets', marketData);
      
      if (response.data.success) {
        const action = autoPublish ? '创建并发布' : '创建';
        toast.success(`🎉 市场${action}成功！`);
        
        // 跳转到市场管理页面
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
      // 检查钱包连接
      if (!window.ethereum) {
        toast.error('请安装 MetaMask 钱包');
        return;
      }

      // 获取钱包地址
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (!accounts.length) {
        toast.error('请先连接钱包');
        return;
      }
      const signerAddress = accounts[0];

      console.log('🔗 使用钱包创建市场:', signerAddress);

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
      toast.loading('请在钱包中确认交易...', { id: 'wallet-sign' });
      
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      
      const tx = await signer.sendTransaction(transactionData);
      
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
    if (!formData.asset) return '请选择资产...';
    
    const assetData = assets[formData.category].find(a => a.id === formData.asset);
    const timeframeData = timeframes.find(t => t.id === formData.timeframe);
    
    return `${assetData?.displayName}价格预测 - ${timeframeData?.display}`;
  };

  const getPreviewOptions = () => {
    if (!formData.priceTarget) return { optionA: '选项A', optionB: '选项B' };
    
    const optionA = `达到目标价格(${formData.priceTarget}${formData.category === 'forex' ? '' : '美元'})`;
    const optionB = `未达到目标价格(${formData.priceTarget}${formData.category === 'forex' ? '' : '美元'})`;
    
    return { optionA, optionB };
  };

  return (
    <Container>
      <Header>
        <BackButton onClick={() => navigate('/create-market')}>
          <ArrowLeft size={16} />
          返回
        </BackButton>
        <Title>创建财经市场</Title>
      </Header>

      <FormContainer>
        <MainForm>
          <SectionTitle>
            <TrendingUp size={20} />
            基本信息
          </SectionTitle>

          {/* 资产类型选择 */}
          <FormGrid>
            <div>
              <label style={{ color: '#e5e7eb', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>
                资产类型 <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <PriceRangeButton
                  type="button"
                  selected={formData.category === 'crypto'}
                  onClick={() => handleCategoryChange('crypto')}
                >
                  💰 加密货币
                </PriceRangeButton>
                <PriceRangeButton
                  type="button"
                  selected={formData.category === 'stocks'}
                  onClick={() => handleCategoryChange('stocks')}
                >
                  📈 股票
                </PriceRangeButton>
                <PriceRangeButton
                  type="button"
                  selected={formData.category === 'forex'}
                  onClick={() => handleCategoryChange('forex')}
                >
                  💱 外汇
                </PriceRangeButton>
                <PriceRangeButton
                  type="button"
                  selected={formData.category === 'commodities'}
                  onClick={() => handleCategoryChange('commodities')}
                >
                  🛢️ 大宗商品
                </PriceRangeButton>
              </div>
            </div>

            <Input
              label="资产"
              required
              type="select"
              value={formData.asset}
              onChange={(e) => handleInputChange('asset', e.target.value)}
              options={[
                { value: '', label: '选择资产' },
                ...assets[formData.category].map(asset => ({
                  value: asset.id,
                  label: `${asset.displayName} (${asset.symbol})`
                }))
              ]}
            />
          </FormGrid>

          {/* 价格目标 */}
          <SectionTitle>🎯 价格目标</SectionTitle>
          <FormGrid>
            <div>
              <label style={{ color: '#e5e7eb', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>
                价格目标 <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <PriceRangeGrid>
                {priceRanges[formData.asset]?.map((price, index) => (
                  <PriceRangeButton
                    key={index}
                    type="button"
                    selected={formData.priceTarget === price}
                    onClick={() => handleInputChange('priceTarget', price)}
                  >
                    ${price}
                  </PriceRangeButton>
                ))}
              </PriceRangeGrid>
            </div>
            
            <Input
              label="自定义价格"
              type="text"
              value={formData.priceTarget}
              onChange={(e) => handleInputChange('priceTarget', e.target.value)}
              placeholder="输入自定义价格"
            />
          </FormGrid>

          {/* 时间范围 */}
          <SectionTitle>⏰ 时间范围</SectionTitle>
          <div>
            <label style={{ color: '#e5e7eb', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>
              预测周期 <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <TimeFrameGrid>
              {timeframes.map((timeframe) => (
                <TimeFrameButton
                  key={timeframe.id}
                  type="button"
                  selected={formData.timeframe === timeframe.id}
                  onClick={() => handleInputChange('timeframe', timeframe.id)}
                >
                  {timeframe.display}
                </TimeFrameButton>
              ))}
            </TimeFrameGrid>
          </div>

          {/* 结算时间 */}
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
              <PreviewBadge>
                {formData.category === 'crypto' ? '💰 加密货币' : 
                 formData.category === 'stocks' ? '📈 股票' :
                 formData.category === 'forex' ? '💱 外汇' : '🛢️ 大宗商品'}
              </PreviewBadge>
            </PreviewHeader>
            
            <PreviewTitle>
              {getPreviewTitle()}
            </PreviewTitle>

            <PreviewOptions>
              <PreviewOption>
                <span style={{ color: '#10b981' }}>✅</span>
                {getPreviewOptions().optionA}
              </PreviewOption>
              <PreviewOption>
                <span style={{ color: '#ef4444' }}>❌</span>
                {getPreviewOptions().optionB}
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
          disabled={!formData.asset || !formData.priceTarget}
        >
          <Save size={20} />
          保存草稿
        </Button>
        
        <Button
          variant="primary"
          size="lg"
          onClick={() => handleSubmit(true)}
          loading={loading}
          disabled={!formData.asset || !formData.priceTarget}
        >
          <Send size={20} />
          创建并发布
        </Button>
      </ActionButtons>
    </Container>
  );
};

export default CreateFinanceMarketPage;