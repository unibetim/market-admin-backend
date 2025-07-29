import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { Button } from '../components/UI/Button';
import { LoadingSpinner } from '../components/UI/LoadingSpinner';

// 🚀 性能优化：防抖Hook
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const Container = styled.div`
  max-width: 1800px;
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

const FilterSelect = styled.select`
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

const SearchInput = styled.input`
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  color: #e5e7eb;
  font-size: 0.9rem;
  min-width: 200px;

  &::placeholder {
    color: #9ca3af;
  }

  &:focus {
    outline: none;
    border-color: #3b82f6;
  }
`;

const MarketsTable = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  overflow: hidden;
`;

const TableHeader = styled.div`
  display: grid;
  grid-template-columns: 240px 1fr 140px 120px 100px 160px 180px 200px;
  gap: 1.5rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.1);
  font-weight: 600;
  color: #e5e7eb;
  font-size: 0.9rem;
`;

const TableRow = styled.div`
  display: grid;
  grid-template-columns: 240px 1fr 140px 120px 100px 160px 180px 200px;
  gap: 1.5rem;
  padding: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  color: #d1d5db;
  font-size: 0.9rem;
  transition: background-color 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
  }
`;

const StatusBadge = styled.span`
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  
  ${props => {
    switch(props.status) {
      case 'active':
        return `
          background: rgba(34, 197, 94, 0.2);
          color: #22c55e;
        `;
      case 'draft':
        return `
          background: rgba(245, 158, 11, 0.2);
          color: #f59e0b;
        `;
      case 'closed':
        return `
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
        `;
      default:
        return `
          background: rgba(156, 163, 175, 0.2);
          color: #9ca3af;
        `;
    }
  }}
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
`;

const ActionButton = styled.button`
  padding: 0.25rem 0.5rem;
  border: none;
  border-radius: 4px;
  font-size: 0.75rem;
  cursor: pointer;
  transition: background-color 0.2s;
  
  ${props => {
    switch(props.variant) {
      case 'edit':
        return `
          background: rgba(59, 130, 246, 0.2);
          color: #3b82f6;
          &:hover { background: rgba(59, 130, 246, 0.3); }
        `;
      case 'publish':
        return `
          background: rgba(34, 197, 94, 0.2);
          color: #22c55e;
          &:hover { background: rgba(34, 197, 94, 0.3); }
        `;
      case 'hotspot':
        return `
          background: rgba(245, 158, 11, 0.2);
          color: #f59e0b;
          &:hover { background: rgba(245, 158, 11, 0.3); }
        `;
      case 'hotspot-active':
        return `
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
          &:hover { background: rgba(239, 68, 68, 0.3); }
        `;
      case 'delete':
        return `
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
          &:hover { background: rgba(239, 68, 68, 0.3); }
        `;
      default:
        return `
          background: rgba(156, 163, 175, 0.2);
          color: #9ca3af;
          &:hover { background: rgba(156, 163, 175, 0.3); }
        `;
    }
  }}
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

const ErrorMessage = styled.div`
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 8px;
  padding: 1rem;
  color: #ef4444;
  margin-bottom: 1rem;
`;

const Pagination = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
`;

const PaginationInfo = styled.div`
  color: #9ca3af;
  font-size: 0.9rem;
`;

const PaginationButtons = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const PaginationButton = styled.button`
  padding: 0.5rem 1rem;
  background: ${props => props.active ? '#3b82f6' : 'rgba(255, 255, 255, 0.1)'};
  border: 1px solid ${props => props.active ? '#3b82f6' : 'rgba(255, 255, 255, 0.2)'};
  border-radius: 6px;
  color: ${props => props.active ? '#ffffff' : '#e5e7eb'};
  cursor: pointer;
  font-size: 0.9rem;
  
  &:hover {
    background: ${props => props.active ? '#2563eb' : 'rgba(255, 255, 255, 0.2)'};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const HotspotBadge = styled.span`
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  
  ${props => props.isHotspot ? `
    background: rgba(245, 158, 11, 0.2);
    color: #f59e0b;
  ` : `
    background: rgba(156, 163, 175, 0.2);
    color: #9ca3af;
  `}
`;

const MarketIdText = styled.div`
  font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
  font-size: 0.8rem;
  color: #9ca3af;
  word-break: break-all;
  line-height: 1.4;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  transition: all 0.2s;
  
  &:hover {
    color: #3b82f6;
    background: rgba(59, 130, 246, 0.1);
  }
  
  &:active {
    color: #1d4ed8;
    background: rgba(59, 130, 246, 0.2);
  }
`;

const MarketsPage = () => {
  const [markets, setMarkets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  // 🚀 性能优化：防抖搜索，减少API调用
  const debouncedSearch = useDebounce(search, 300);

  // 获取JWT token
  const getAuthToken = () => {
    return localStorage.getItem('admin_token') || sessionStorage.getItem('admin_token');
  };

  // API调用
  const fetchMarkets = async (page = 1, filters = {}) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        ...filters
      });

      const token = getAuthToken();
      const response = await fetch(`/api/markets?${params}`, {
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
        setMarkets(data.data);
        setPagination(prev => ({
          ...prev,
          ...data.pagination
        }));
      } else {
        throw new Error(data.message || '获取市场列表失败');
      }
    } catch (err) {
      setError(err.message);
      console.error('获取市场列表失败:', err);
    } finally {
      setLoading(false);
    }
  };

  // 发布市场
  const publishMarket = async (marketId) => {
    try {
      const token = getAuthToken();
      const response = await fetch(`/api/markets/${marketId}/publish`, {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          chainId: 97 // BSC测试网
        })
      });

      const data = await response.json();
      
      if (data.success) {
        // 刷新列表
        fetchMarkets(pagination.page, getFilters());
        alert('市场发布成功！');
      } else {
        throw new Error(data.message || '发布失败');
      }
    } catch (err) {
      alert(`发布失败: ${err.message}`);
    }
  };

  // 删除市场
  const deleteMarket = async (marketId) => {
    if (!window.confirm('确定要删除这个市场吗？')) return;

    try {
      const token = getAuthToken();
      const response = await fetch(`/api/markets/${marketId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (data.success) {
        // 刷新列表
        fetchMarkets(pagination.page, getFilters());
        alert('市场删除成功！');
      } else {
        throw new Error(data.message || '删除失败');
      }
    } catch (err) {
      alert(`删除失败: ${err.message}`);
    }
  };

  // 切换热点状态
  const toggleHotspot = async (marketId, isCurrentlyHotspot) => {
    try {
      const token = getAuthToken();
      const response = await fetch(`/api/hotspots/${marketId}/toggle`, {
        method: 'PUT',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (data.success) {
        // 刷新列表
        fetchMarkets(pagination.page, getFilters());
        alert(isCurrentlyHotspot ? '已取消热点状态！' : '已设置为热点！');
      } else {
        throw new Error(data.message || '操作失败');
      }
    } catch (err) {
      alert(`操作失败: ${err.message}`);
    }
  };

  // 复制链上ID到剪贴板
  const copyMarketId = async (chainMarketId) => {
    try {
      await navigator.clipboard.writeText(chainMarketId.toString());
      alert('链上ID已复制到剪贴板！');
    } catch (err) {
      // 备用方案
      const textArea = document.createElement('textarea');
      textArea.value = chainMarketId.toString();
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('链上ID已复制到剪贴板！');
    }
  };

  // 获取当前筛选条件
  const getFilters = () => {
    const filters = {};
    if (filter !== 'all') filters.status = filter;
    if (search.trim()) filters.search = search.trim();
    return filters;
  };

  // 处理搜索
  const handleSearch = () => {
    fetchMarkets(1, getFilters());
  };

  // 处理筛选
  const handleFilter = (newFilter) => {
    setFilter(newFilter);
    fetchMarkets(1, { ...getFilters(), status: newFilter !== 'all' ? newFilter : undefined });
  };

  // 分页处理
  const handlePageChange = (newPage) => {
    fetchMarkets(newPage, getFilters());
  };

  // 初始化加载
  useEffect(() => {
    fetchMarkets();
  }, []);

  // 🚀 性能优化：防抖搜索效果
  useEffect(() => {
    if (debouncedSearch !== search || debouncedSearch) {
      fetchMarkets(1, { ...getFilters(), search: debouncedSearch });
    }
  }, [debouncedSearch]);

  // 格式化时间
  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && markets.length === 0) {
    return (
      <Container>
        <Title>市场管理</Title>
        <LoadingSpinner />
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Title>市场管理</Title>
        <Controls>
          <FilterSelect value={filter} onChange={(e) => handleFilter(e.target.value)}>
            <option value="all">全部状态</option>
            <option value="draft">草稿</option>
            <option value="active">活跃</option>
            <option value="closed">已关闭</option>
            <option value="resolved">已结算</option>
          </FilterSelect>
          
          <SearchInput
            type="text"
            placeholder="搜索链上ID或标题... (自动搜索)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </Controls>
      </Header>

      {error && (
        <ErrorMessage>
          ❌ {error}
        </ErrorMessage>
      )}

      <MarketsTable>
        <TableHeader>
          <div>链上ID</div>
          <div>市场标题</div>
          <div>类型</div>
          <div>状态</div>
          <div>热点</div>
          <div>创建时间</div>
          <div>结算时间</div>
          <div>操作</div>
        </TableHeader>

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <LoadingSpinner />
          </div>
        ) : markets.length === 0 ? (
          <EmptyState>
            <h3>暂无市场数据</h3>
            <p>没有找到符合条件的市场</p>
          </EmptyState>
        ) : (
          markets.map(market => (
            <TableRow key={market.market_id}>
              <div>
                {market.chain_market_id ? (
                  <MarketIdText 
                    title="点击复制链上ID"
                    onClick={() => copyMarketId(market.chain_market_id)}
                  >
                    #{market.chain_market_id}
                  </MarketIdText>
                ) : (
                  <MarketIdText 
                    style={{ 
                      color: '#6b7280', 
                      fontStyle: 'italic',
                      cursor: 'default' 
                    }}
                    title="市场尚未发布到区块链"
                  >
                    未发布
                  </MarketIdText>
                )}
              </div>
              <div title={market.description}>{market.title}</div>
              <div>{market.type}</div>
              <div>
                <StatusBadge status={market.status}>
                  {market.status}
                </StatusBadge>
              </div>
              <div>
                <HotspotBadge isHotspot={market.is_hotspot}>
                  {market.is_hotspot ? '🔥 热点' : '普通'}
                </HotspotBadge>
              </div>
              <div>{formatDate(market.created_at)}</div>
              <div>{formatDate(market.resolution_time)}</div>
              <div>
                <ActionButtons>
                  <ActionButton variant="edit" title="编辑">
                    编辑
                  </ActionButton>
                  {market.status === 'draft' && (
                    <ActionButton 
                      variant="publish" 
                      title="发布到区块链"
                      onClick={() => publishMarket(market.market_id)}
                    >
                      发布
                    </ActionButton>
                  )}
                  <ActionButton 
                    variant={market.is_hotspot ? "hotspot-active" : "hotspot"} 
                    title={market.is_hotspot ? "取消热点" : "设为热点"}
                    onClick={() => toggleHotspot(market.market_id, market.is_hotspot)}
                  >
                    {market.is_hotspot ? '取消热点' : '设为热点'}
                  </ActionButton>
                  <ActionButton 
                    variant="delete" 
                    title="删除"
                    onClick={() => deleteMarket(market.market_id)}
                  >
                    删除
                  </ActionButton>
                </ActionButtons>
              </div>
            </TableRow>
          ))
        )}

        {markets.length > 0 && (
          <Pagination>
            <PaginationInfo>
              显示 {(pagination.page - 1) * pagination.limit + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} 
              {' '}共 {pagination.total} 条记录
            </PaginationInfo>
            
            <PaginationButtons>
              <PaginationButton 
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={!pagination.hasPreviousPage || loading}
              >
                上一页
              </PaginationButton>
              
              {[...Array(Math.min(5, pagination.totalPages))].map((_, i) => {
                const page = i + 1;
                return (
                  <PaginationButton
                    key={page}
                    active={page === pagination.page}
                    onClick={() => handlePageChange(page)}
                    disabled={loading}
                  >
                    {page}
                  </PaginationButton>
                );
              })}
              
              <PaginationButton 
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={!pagination.hasNextPage || loading}
              >
                下一页
              </PaginationButton>
            </PaginationButtons>
          </Pagination>
        )}
      </MarketsTable>
    </Container>
  );
};

export default MarketsPage;