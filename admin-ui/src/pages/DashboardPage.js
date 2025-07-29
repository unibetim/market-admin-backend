import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { TrendingUp, Target, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import axios from 'axios';

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

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const StatCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1.5rem;
  backdrop-filter: blur(10px);
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.08);
    transform: translateY(-2px);
  }
`;

const StatHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
`;

const StatIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${props => props.color || 'rgba(59, 130, 246, 0.2)'};
  
  svg {
    width: 24px;
    height: 24px;
    color: ${props => props.iconColor || '#60a5fa'};
  }
`;

const StatValue = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: #e5e7eb;
  margin-bottom: 0.25rem;
`;

const StatLabel = styled.div`
  color: #9ca3af;
  font-size: 0.875rem;
  font-weight: 500;
`;

const StatTrend = styled.div`
  color: ${props => props.positive ? '#10b981' : '#ef4444'};
  font-size: 0.75rem;
  font-weight: 500;
`;

const ActivitySection = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1.5rem;
  
  @media (max-width: 968px) {
    grid-template-columns: 1fr;
  }
`;

const ActivityCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1.5rem;
  backdrop-filter: blur(10px);
`;

const SectionTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  color: #e5e7eb;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ActivityList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const ActivityItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  border-left: 3px solid ${props => props.color || '#3b82f6'};
`;

const ActivityIcon = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${props => props.color || 'rgba(59, 130, 246, 0.2)'};
  flex-shrink: 0;
  
  svg {
    width: 16px;
    height: 16px;
    color: ${props => props.iconColor || '#60a5fa'};
  }
`;

const ActivityContent = styled.div`
  flex: 1;
`;

const ActivityTitle = styled.div`
  color: #e5e7eb;
  font-weight: 500;
  font-size: 0.875rem;
  margin-bottom: 0.25rem;
`;

const ActivityTime = styled.div`
  color: #9ca3af;
  font-size: 0.75rem;
`;

const QuickActions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: #e5e7eb;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
  font-weight: 500;
  text-align: left;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(59, 130, 246, 0.5);
  }
  
  svg {
    width: 20px;
    height: 20px;
    color: #60a5fa;
  }
`;

const DashboardPage = () => {
  const [stats, setStats] = useState({
    totalMarkets: 0,
    activeMarkets: 0,
    draftMarkets: 0,
    successRate: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get('/stats');
      if (response.data.success) {
        setStats(response.data.data.summary);
      }
    } catch (error) {
      console.error('获取统计数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const recentActivities = [
    {
      type: 'create_market',
      title: '创建了新的足球市场',
      time: '2分钟前',
      color: '#10b981',
      icon: Target
    },
    {
      type: 'publish_market',
      title: '发布市场到区块链',
      time: '5分钟前',
      color: '#3b82f6',
      icon: CheckCircle
    },
    {
      type: 'upload_resource',
      title: '上传了新的球队logo',
      time: '10分钟前',
      color: '#f59e0b',
      icon: TrendingUp
    }
  ];

  return (
    <Container>
      <Header>
        <Title>仪表盘</Title>
        <Subtitle>OddsMarket管理后台概览</Subtitle>
      </Header>

      <StatsGrid>
        <StatCard>
          <StatHeader>
            <div>
              <StatValue>{loading ? '-' : stats.totalMarkets}</StatValue>
              <StatLabel>总市场数</StatLabel>
            </div>
            <StatIcon color="rgba(59, 130, 246, 0.2)" iconColor="#60a5fa">
              <Target />
            </StatIcon>
          </StatHeader>
          <StatTrend positive>+12% 本周</StatTrend>
        </StatCard>

        <StatCard>
          <StatHeader>
            <div>
              <StatValue>{loading ? '-' : stats.activeMarkets}</StatValue>
              <StatLabel>活跃市场</StatLabel>
            </div>
            <StatIcon color="rgba(16, 185, 129, 0.2)" iconColor="#10b981">
              <CheckCircle />
            </StatIcon>
          </StatHeader>
          <StatTrend positive>+8% 本周</StatTrend>
        </StatCard>

        <StatCard>
          <StatHeader>
            <div>
              <StatValue>{loading ? '-' : stats.draftMarkets}</StatValue>
              <StatLabel>草稿市场</StatLabel>
            </div>
            <StatIcon color="rgba(245, 158, 11, 0.2)" iconColor="#f59e0b">
              <Clock />
            </StatIcon>
          </StatHeader>
          <StatTrend>待发布</StatTrend>
        </StatCard>

        <StatCard>
          <StatHeader>
            <div>
              <StatValue>{loading ? '-' : stats.successRate}%</StatValue>
              <StatLabel>发布成功率</StatLabel>
            </div>
            <StatIcon color="rgba(139, 92, 246, 0.2)" iconColor="#8b5cf6">
              <TrendingUp />
            </StatIcon>
          </StatHeader>
          <StatTrend positive>+5% 本周</StatTrend>
        </StatCard>
      </StatsGrid>

      <ActivitySection>
        <ActivityCard>
          <SectionTitle>
            <AlertCircle size={20} />
            最近活动
          </SectionTitle>
          <ActivityList>
            {recentActivities.map((activity, index) => (
              <ActivityItem key={index} color={activity.color}>
                <ActivityIcon color={`${activity.color}33`} iconColor={activity.color}>
                  <activity.icon />
                </ActivityIcon>
                <ActivityContent>
                  <ActivityTitle>{activity.title}</ActivityTitle>
                  <ActivityTime>{activity.time}</ActivityTime>
                </ActivityContent>
              </ActivityItem>
            ))}
          </ActivityList>
        </ActivityCard>

        <ActivityCard>
          <SectionTitle>
            <TrendingUp size={20} />
            快速操作
          </SectionTitle>
          <QuickActions>
            <ActionButton onClick={() => window.open('/create-market', '_self')}>
              <Target />
              创建新市场
            </ActionButton>
            <ActionButton onClick={() => window.open('/resources', '_self')}>
              <TrendingUp />
              管理资源
            </ActionButton>
            <ActionButton onClick={() => window.open('/stats', '_self')}>
              <TrendingUp />
              查看统计
            </ActionButton>
          </QuickActions>
        </ActivityCard>
      </ActivitySection>
    </Container>
  );
};

export default DashboardPage;