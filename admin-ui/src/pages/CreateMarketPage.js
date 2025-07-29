import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Plus, Activity, DollarSign, Vote, Cpu, Calendar } from 'lucide-react';
import Button from '../components/UI/Button';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled.div`
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  color: #e5e7eb;
  margin-bottom: 0.5rem;
`;

const Subtitle = styled.p`
  color: #9ca3af;
  font-size: 1rem;
`;

const CategoryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const CategoryCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 2rem;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;
  
  &:hover {
    background: rgba(255, 255, 255, 0.08);
    transform: translateY(-2px);
    border-color: rgba(59, 130, 246, 0.5);
  }
`;

const CategoryIcon = styled.div`
  width: 64px;
  height: 64px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${props => props.color || 'rgba(59, 130, 246, 0.2)'};
  margin: 0 auto 1rem;
  
  svg {
    width: 32px;
    height: 32px;
    color: ${props => props.iconColor || '#60a5fa'};
  }
`;

const CategoryTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: #e5e7eb;
  margin-bottom: 0.5rem;
`;

const CategoryDescription = styled.p`
  color: #9ca3af;
  font-size: 0.875rem;
  line-height: 1.5;
  margin-bottom: 1rem;
`;

const CategoryFeatures = styled.ul`
  list-style: none;
  color: #9ca3af;
  font-size: 0.75rem;
  text-align: left;
  
  li {
    padding: 0.25rem 0;
    
    &:before {
      content: "•";
      color: #60a5fa;
      margin-right: 0.5rem;
    }
  }
`;

const CreateMarketPage = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState(null);

  const categories = [
    {
      id: 'sports',
      title: '🏀 体育赛事',
      description: '创建足球、篮球等体育比赛预测市场',
      icon: Activity,
      color: 'rgba(16, 185, 129, 0.2)',
      iconColor: '#10b981',
      features: [
        '足球：英超、德甲、西甲、意甲、世界杯、欧洲杯、欧冠',
        '篮球：NBA、CBA等联赛',
        '支持让球盘（足球）和胜负盘',
        '自动加载球队logo'
      ]
    },
    {
      id: 'finance',  
      title: '💰 财经市场',
      description: '创建加密货币、股票等财经预测市场',
      icon: DollarSign,
      color: 'rgba(245, 158, 11, 0.2)',
      iconColor: '#f59e0b',
      features: [
        '加密货币价格预测（BTC、ETH、BNB等）',
        '股票指数预测',
        '灵活的价格区间设置',
        '多种时间周期选择'
      ]
    },
    {
      id: 'politics',
      title: '🗳️ 政治事件',
      description: '创建选举、政策等政治事件预测市场',
      icon: Vote,
      color: 'rgba(139, 92, 246, 0.2)',
      iconColor: '#8b5cf6',
      features: [
        '选举结果预测',
        '政策通过预测',
        '国际关系事件',
        '政治人物动向'
      ]
    },
    {
      id: 'technology',
      title: '🔬 科技发展',
      description: '创建产品发布、技术突破等科技预测市场',
      icon: Cpu,
      color: 'rgba(59, 130, 246, 0.2)',
      iconColor: '#60a5fa',
      features: [
        '产品发布时间预测',
        '技术突破预测',
        '公司业绩预测',
        '科技趋势预测'
      ]
    },
    {
      id: 'entertainment',
      title: '🎬 娱乐事件',
      description: '创建电影、音乐、颁奖典礼等娱乐预测市场',
      icon: Calendar,
      color: 'rgba(236, 72, 153, 0.2)',
      iconColor: '#ec4899',
      features: [
        '电影票房预测',
        '音乐榜单预测',
        '颁奖典礼结果',
        '娱乐圈事件'
      ]
    },
    {
      id: 'other',
      title: '📋 其他事件',
      description: '创建天气、社会热点等其他类型预测市场',
      icon: Plus,
      color: 'rgba(156, 163, 175, 0.2)',
      iconColor: '#9ca3af',
      features: [
        '天气预测',
        '自然灾害',
        '社会热点事件',
        '自定义预测市场'
      ]
    }
  ];

  const handleCategorySelect = (categoryId) => {
    switch (categoryId) {
      case 'sports':
        navigate('/create-market/sports');
        break;
      case 'finance':
        navigate('/create-market/finance');
        break;
      case 'politics':
        navigate('/create-market/politics');
        break;
      case 'technology':
        navigate('/create-market/technology');
        break;
      case 'entertainment':
        navigate('/create-market/entertainment');
        break;
      case 'other':
        navigate('/create-market/other');
        break;
      default:
        alert('未知的市场类型');
    }
  };

  return (
    <Container>
      <Header>
        <Title>创建预测市场</Title>
        <Subtitle>选择市场类型开始创建新的预测市场</Subtitle>
      </Header>

      <CategoryGrid>
        {categories.map((category) => (
          <CategoryCard 
            key={category.id}
            onClick={() => handleCategorySelect(category.id)}
          >
            <CategoryIcon color={category.color} iconColor={category.iconColor}>
              <category.icon />
            </CategoryIcon>
            <CategoryTitle>{category.title}</CategoryTitle>
            <CategoryDescription>{category.description}</CategoryDescription>
            <CategoryFeatures>
              {category.features.map((feature, index) => (
                <li key={index}>{feature}</li>
              ))}
            </CategoryFeatures>
          </CategoryCard>
        ))}
      </CategoryGrid>
    </Container>
  );
};

export default CreateMarketPage;