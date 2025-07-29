import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Button } from '../components/UI/Button';
import { LoadingSpinner } from '../components/UI/LoadingSpinner';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  color: #e5e7eb;
  margin: 0;
`;

const Controls = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
`;

const RefreshButton = styled(Button)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
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
  text-align: center;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.2);
  }
`;

const StatIcon = styled.div`
  font-size: 2rem;
  margin-bottom: 1rem;
`;

const StatValue = styled.h3`
  color: #e5e7eb;
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
`;

const StatLabel = styled.p`
  color: #9ca3af;
  font-size: 0.9rem;
  margin: 0;
`;

const ChartsSection = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 2rem;
  margin-bottom: 2rem;
`;

const ChartCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1.5rem;
`;

const ChartTitle = styled.h3`
  color: #e5e7eb;
  font-size: 1.2rem;
  font-weight: 600;
  margin: 0 0 1rem 0;
`;

const ChartContent = styled.div`
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
`;

const SimpleChart = styled.div`
  width: 100%;
`;

const ChartBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  
  &:last-child {
    border-bottom: none;
  }
`;

const ChartLabel = styled.span`
  color: #e5e7eb;
  font-size: 0.9rem;
`;

const ChartValue = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ChartBarFill = styled.div`
  height: 6px;
  background: ${props => props.color || '#3b82f6'};
  border-radius: 3px;
  width: ${props => props.width}%;
  max-width: 100px;
`;

const ChartNumber = styled.span`
  color: #d1d5db;
  font-weight: 600;
  min-width: 30px;
  text-align: right;
`;

const ActivitySection = styled.div`
  margin-bottom: 2rem;
`;

const SectionTitle = styled.h2`
  color: #e5e7eb;
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0 0 1rem 0;
`;

const ActivityList = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  overflow: hidden;
`;

const ActivityItem = styled.div`
  padding: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  
  &:last-child {
    border-bottom: none;
  }
`;

const ActivityContent = styled.div`
  flex: 1;
`;

const ActivityType = styled.div`
  color: #3b82f6;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  margin-bottom: 0.25rem;
`;

const ActivityDescription = styled.div`
  color: #e5e7eb;
  font-size: 0.9rem;
  margin-bottom: 0.25rem;
`;

const ActivityMeta = styled.div`
  color: #9ca3af;
  font-size: 0.8rem;
`;

const ActivityTime = styled.div`
  color: #9ca3af;
  font-size: 0.8rem;
  white-space: nowrap;
  margin-left: 1rem;
`;

const PerformanceSection = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const PerformanceCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1.5rem;
`;

const PerformanceTitle = styled.h4`
  color: #e5e7eb;
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 1rem 0;
`;

const PerformanceList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const PerformanceItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9rem;
`;

const PerformanceLabel = styled.span`
  color: #9ca3af;
`;

const PerformanceValue = styled.span`
  color: #e5e7eb;
  font-weight: 500;
`;

const ErrorMessage = styled.div`
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 8px;
  padding: 1rem;
  color: #ef4444;
  margin-bottom: 1rem;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 4rem;
  color: #9ca3af;
  
  h3 {
    font-size: 1.2rem;
    margin-bottom: 0.5rem;
    color: #d1d5db;
  }
`;

const ExportSection = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
`;

const ExportTitle = styled.h3`
  color: #e5e7eb;
  font-size: 1.2rem;
  font-weight: 600;
  margin: 0 0 1rem 0;
`;

const ExportControls = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
`;

const Select = styled.select`
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  color: #e5e7eb;
  font-size: 0.9rem;
  
  option {
    background: #1f2937;
    color: #e5e7eb;
  }

  &:focus {
    outline: none;
    border-color: #3b82f6;
  }
`;

const StatsPage = () => {
  const [stats, setStats] = useState(null);
  const [distribution, setDistribution] = useState(null);
  const [performance, setPerformance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // 获取JWT token
  const getAuthToken = () => {
    return localStorage.getItem('admin_token') || sessionStorage.getItem('admin_token');
  };

  // 获取统计数据
  const fetchStats = async () => {
    try {
      const token = getAuthToken();
      const response = await fetch('/api/stats', {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setStats(data.data);
      } else {
        throw new Error(data.message || '获取统计数据失败');
      }
    } catch (err) {
      setError(err.message);
      console.error('获取统计数据失败:', err);
    }
  };

  // 获取分布数据
  const fetchDistribution = async () => {
    try {
      const token = getAuthToken();
      const response = await fetch('/api/stats/market-distribution', {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setDistribution(data.data);
        }
      }
    } catch (err) {
      console.error('获取分布数据失败:', err);
    }
  };

  // 获取性能数据
  const fetchPerformance = async () => {
    try {
      const token = getAuthToken();
      const response = await fetch('/api/stats/performance', {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setPerformance(data.data);
        }
      }
    } catch (err) {
      console.error('获取性能数据失败:', err);
    }
  };

  // 刷新所有数据
  const handleRefresh = async () => {
    setRefreshing(true);
    setError(null);
    
    await Promise.all([
      fetchStats(),
      fetchDistribution(),
      fetchPerformance()
    ]);
    
    setRefreshing(false);
  };

  // 导出数据
  const handleExport = (type, format) => {
    const token = getAuthToken();
    const url = `/api/stats/export?type=${type}&format=${format}`;
    
    const link = document.createElement('a');
    link.href = url;
    link.style.display = 'none';
    
    // 添加认证头
    fetch(url, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : ''
      }
    }).then(response => response.blob())
      .then(blob => {
        const downloadUrl = window.URL.createObjectURL(blob);
        link.href = downloadUrl;
        link.download = `stats_${type}_${Date.now()}.${format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
      })
      .catch(err => {
        alert('导出失败: ' + err.message);
      });
  };

  // 获取最大值用于计算百分比
  const getMaxValue = (data, key) => {
    if (!data || data.length === 0) return 1;
    return Math.max(...data.map(item => item[key]));
  };

  // 初始化加载
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchStats(),
        fetchDistribution(),
        fetchPerformance()
      ]);
      setLoading(false);
    };
    
    loadData();
  }, []);

  if (loading) {
    return (
      <Container>
        <Title>统计分析</Title>
        <LoadingSpinner />
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Title>统计分析</Title>
        <Controls>
          <RefreshButton 
            onClick={handleRefresh} 
            disabled={refreshing}
          >
            {refreshing ? '刷新中...' : '🔄 刷新'}
          </RefreshButton>
        </Controls>
      </Header>

      {error && (
        <ErrorMessage>
          ❌ {error}
        </ErrorMessage>
      )}

      {/* 基础统计 */}
      {stats && (
        <StatsGrid>
          <StatCard>
            <StatIcon>📊</StatIcon>
            <StatValue>{stats.basic.totalMarkets}</StatValue>
            <StatLabel>总市场数</StatLabel>
          </StatCard>
          <StatCard>
            <StatIcon>✅</StatIcon>
            <StatValue>{stats.basic.activeMarkets}</StatValue>
            <StatLabel>活跃市场</StatLabel>
          </StatCard>
          <StatCard>
            <StatIcon>📝</StatIcon>
            <StatValue>{stats.basic.draftMarkets}</StatValue>
            <StatLabel>草稿市场</StatLabel>
          </StatCard>
          <StatCard>
            <StatIcon>🔥</StatIcon>
            <StatValue>{stats.summary.successRate}%</StatValue>
            <StatLabel>成功率</StatLabel>
          </StatCard>
          <StatCard>
            <StatIcon>🏆</StatIcon>
            <StatValue>{stats.basic.totalTemplates}</StatValue>
            <StatLabel>模板数</StatLabel>
          </StatCard>
          <StatCard>
            <StatIcon>🖼️</StatIcon>
            <StatValue>{stats.basic.totalResources}</StatValue>
            <StatLabel>资源数</StatLabel>
          </StatCard>
        </StatsGrid>
      )}

      {/* 图表分析 */}
      <ChartsSection>
        {/* 市场类型分布 */}
        {distribution && distribution.byType && (
          <ChartCard>
            <ChartTitle>🏀 市场类型分布</ChartTitle>
            <SimpleChart>
              {distribution.byType.map((item, index) => {
                const maxValue = getMaxValue(distribution.byType, 'count');
                const percentage = maxValue > 0 ? (item.count / maxValue) * 100 : 0;
                return (
                  <ChartBar key={index}>
                    <ChartLabel>{item.type}/{item.category}</ChartLabel>
                    <ChartValue>
                      <ChartBarFill 
                        width={percentage} 
                        color={index % 2 === 0 ? '#3b82f6' : '#22c55e'}
                      />
                      <ChartNumber>{item.count}</ChartNumber>
                    </ChartValue>
                  </ChartBar>
                );
              })}
            </SimpleChart>
          </ChartCard>
        )}

        {/* 市场状态分布 */}
        {distribution && distribution.byStatus && (
          <ChartCard>
            <ChartTitle>📊 市场状态分布</ChartTitle>
            <SimpleChart>
              {distribution.byStatus.map((item, index) => {
                const maxValue = getMaxValue(distribution.byStatus, 'count');
                const percentage = maxValue > 0 ? (item.count / maxValue) * 100 : 0;
                const colors = {
                  'active': '#22c55e',
                  'draft': '#f59e0b',
                  'closed': '#ef4444',
                  'resolved': '#8b5cf6'
                };
                return (
                  <ChartBar key={index}>
                    <ChartLabel>{item.status}</ChartLabel>
                    <ChartValue>
                      <ChartBarFill 
                        width={percentage} 
                        color={colors[item.status] || '#9ca3af'}
                      />
                      <ChartNumber>{item.count}</ChartNumber>
                    </ChartValue>
                  </ChartBar>
                );
              })}
            </SimpleChart>
          </ChartCard>
        )}

        {/* 热门模板 */}
        {stats && stats.popularTemplates && (
          <ChartCard>
            <ChartTitle>🎆 热门模板</ChartTitle>
            {stats.popularTemplates.length > 0 ? (
              <SimpleChart>
                {stats.popularTemplates.map((template, index) => {
                  const maxValue = getMaxValue(stats.popularTemplates, 'usage_count');
                  const percentage = maxValue > 0 ? (template.usage_count / maxValue) * 100 : 0;
                  return (
                    <ChartBar key={index}>
                      <ChartLabel>{template.name}</ChartLabel>
                      <ChartValue>
                        <ChartBarFill 
                          width={percentage} 
                          color='#8b5cf6'
                        />
                        <ChartNumber>{template.usage_count}</ChartNumber>
                      </ChartValue>
                    </ChartBar>
                  );
                })}
              </SimpleChart>
            ) : (
              <EmptyState>
                <p>暂无模板使用数据</p>
              </EmptyState>
            )}
          </ChartCard>
        )}

        {/* 每日创建趋势 */}
        {stats && stats.dailyCreation && (
          <ChartCard>
            <ChartTitle>📅 每日创建趋势 (最近7天)</ChartTitle>
            {stats.dailyCreation.length > 0 ? (
              <SimpleChart>
                {stats.dailyCreation.map((day, index) => {
                  const maxValue = getMaxValue(stats.dailyCreation, 'count');
                  const percentage = maxValue > 0 ? (day.count / maxValue) * 100 : 0;
                  return (
                    <ChartBar key={index}>
                      <ChartLabel>{day.date}</ChartLabel>
                      <ChartValue>
                        <ChartBarFill 
                          width={percentage} 
                          color='#06b6d4'
                        />
                        <ChartNumber>{day.count}</ChartNumber>
                      </ChartValue>
                    </ChartBar>
                  );
                })}
              </SimpleChart>
            ) : (
              <EmptyState>
                <p>暂无创建数据</p>
              </EmptyState>
            )}
          </ChartCard>
        )}
      </ChartsSection>

      {/* 最近活动 */}
      {stats && stats.recentActivity && (
        <ActivitySection>
          <SectionTitle>🕰️ 最近活动</SectionTitle>
          <ActivityList>
            {stats.recentActivity.length > 0 ? (
              stats.recentActivity.map((activity, index) => (
                <ActivityItem key={index}>
                  <ActivityContent>
                    <ActivityType>{activity.operation_type}</ActivityType>
                    <ActivityDescription>{activity.description}</ActivityDescription>
                    <ActivityMeta>
                      {activity.target_type} ID: {activity.target_id} | 用户: {activity.user_id}
                    </ActivityMeta>
                  </ActivityContent>
                  <ActivityTime>{activity.created_at_formatted}</ActivityTime>
                </ActivityItem>
              ))
            ) : (
              <EmptyState>
                <p>暂无活动记录</p>
              </EmptyState>
            )}
          </ActivityList>
        </ActivitySection>
      )}

      {/* 系统性能 */}
      {performance && (
        <PerformanceSection>
          <PerformanceCard>
            <PerformanceTitle>💻 系统信息</PerformanceTitle>
            <PerformanceList>
              <PerformanceItem>
                <PerformanceLabel>运行时间</PerformanceLabel>
                <PerformanceValue>{performance.system.uptimeFormatted}</PerformanceValue>
              </PerformanceItem>
              <PerformanceItem>
                <PerformanceLabel>Node 版本</PerformanceLabel>
                <PerformanceValue>{performance.system.nodeVersion}</PerformanceValue>
              </PerformanceItem>
              <PerformanceItem>
                <PerformanceLabel>平台</PerformanceLabel>
                <PerformanceValue>{performance.system.platform} ({performance.system.arch})</PerformanceValue>
              </PerformanceItem>
            </PerformanceList>
          </PerformanceCard>

          <PerformanceCard>
            <PerformanceTitle>💾 内存使用</PerformanceTitle>
            <PerformanceList>
              <PerformanceItem>
                <PerformanceLabel>RSS 内存</PerformanceLabel>
                <PerformanceValue>{performance.memory.rss} MB</PerformanceValue>
              </PerformanceItem>
              <PerformanceItem>
                <PerformanceLabel>堆总大小</PerformanceLabel>
                <PerformanceValue>{performance.memory.heapTotal} MB</PerformanceValue>
              </PerformanceItem>
              <PerformanceItem>
                <PerformanceLabel>堆已用</PerformanceLabel>
                <PerformanceValue>{performance.memory.heapUsed} MB</PerformanceValue>
              </PerformanceItem>
              <PerformanceItem>
                <PerformanceLabel>外部内存</PerformanceLabel>
                <PerformanceValue>{performance.memory.external} MB</PerformanceValue>
              </PerformanceItem>
            </PerformanceList>
          </PerformanceCard>

          <PerformanceCard>
            <PerformanceTitle>📦 数据库状态</PerformanceTitle>
            <PerformanceList>
              <PerformanceItem>
                <PerformanceLabel>连接状态</PerformanceLabel>
                <PerformanceValue>{performance.database.connected ? '✅ 已连接' : '❌ 未连接'}</PerformanceValue>
              </PerformanceItem>
              <PerformanceItem>
                <PerformanceLabel>表数量</PerformanceLabel>
                <PerformanceValue>{performance.database.tablesCount}</PerformanceValue>
              </PerformanceItem>
            </PerformanceList>
          </PerformanceCard>

          {performance.blockchain && (
            <PerformanceCard>
              <PerformanceTitle>⛓️ 区块链状态</PerformanceTitle>
              <PerformanceList>
                <PerformanceItem>
                  <PerformanceLabel>网络 ID</PerformanceLabel>
                  <PerformanceValue>{performance.blockchain.networkId}</PerformanceValue>
                </PerformanceItem>
                <PerformanceItem>
                  <PerformanceLabel>连接状态</PerformanceLabel>
                  <PerformanceValue>{performance.blockchain.connected ? '✅ 已连接' : '❌ 未连接'}</PerformanceValue>
                </PerformanceItem>
                {performance.blockchain.blockNumber && (
                  <PerformanceItem>
                    <PerformanceLabel>最新区块</PerformanceLabel>
                    <PerformanceValue>{performance.blockchain.blockNumber}</PerformanceValue>
                  </PerformanceItem>
                )}
              </PerformanceList>
            </PerformanceCard>
          )}
        </PerformanceSection>
      )}

      {/* 数据导出 */}
      <ExportSection>
        <ExportTitle>📤 数据导出</ExportTitle>
        <ExportControls>
          <Select id="export-type">
            <option value="basic">基础统计</option>
            <option value="markets">市场数据</option>
            <option value="logs">操作日志</option>
          </Select>
          
          <Select id="export-format">
            <option value="json">JSON 格式</option>
            <option value="csv">CSV 格式</option>
          </Select>
          
          <Button onClick={() => {
            const type = document.getElementById('export-type').value;
            const format = document.getElementById('export-format').value;
            handleExport(type, format);
          }}>
            导出数据
          </Button>
        </ExportControls>
      </ExportSection>
    </Container>
  );
};

export default StatsPage;