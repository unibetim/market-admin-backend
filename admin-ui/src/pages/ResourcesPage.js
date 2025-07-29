import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { Button } from '../components/UI/Button';
import { Input } from '../components/UI/Input';
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

const UploadSection = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 2px dashed rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 2rem;
  margin-bottom: 2rem;
  text-align: center;
  transition: all 0.2s;
  
  &.drag-over {
    border-color: #3b82f6;
    background: rgba(59, 130, 246, 0.1);
  }
`;

const UploadText = styled.div`
  color: #9ca3af;
  margin-bottom: 1rem;
  
  h3 {
    color: #e5e7eb;
    margin-bottom: 0.5rem;
  }
`;

const FileInput = styled.input`
  display: none;
`;

const UploadButton = styled(Button)`
  margin-right: 1rem;
`;

const UploadInfo = styled.div`
  display: flex;
  gap: 2rem;
  margin-top: 1rem;
  justify-content: center;
  font-size: 0.8rem;
  color: #6b7280;
`;

const ResourcesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const ResourceCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1rem;
  transition: all 0.2s;
  position: relative;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.2);
  }
`;

const ResourcePreview = styled.div`
  width: 100%;
  height: 150px;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  
  img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }
`;

const ResourceInfo = styled.div`
  color: #e5e7eb;
`;

const ResourceName = styled.h4`
  font-size: 0.9rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
  word-break: break-word;
`;

const ResourceMeta = styled.div`
  font-size: 0.75rem;
  color: #9ca3af;
  margin-bottom: 0.5rem;
  
  span {
    margin-right: 1rem;
  }
`;

const ResourceTags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  margin-bottom: 1rem;
`;

const Tag = styled.span`
  background: rgba(59, 130, 246, 0.2);
  color: #3b82f6;
  padding: 0.15rem 0.5rem;
  border-radius: 8px;
  font-size: 0.7rem;
  font-weight: 500;
`;

const ResourceActions = styled.div`
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
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
      case 'delete':
        return `
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
          &:hover { background: rgba(239, 68, 68, 0.3); }
        `;
      case 'download':
        return `
          background: rgba(34, 197, 94, 0.2);
          color: #22c55e;
          &:hover { background: rgba(34, 197, 94, 0.3); }
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

const SelectionInfo = styled.div`
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #3b82f6;
`;

const Checkbox = styled.input`
  position: absolute;
  top: 0.5rem;
  left: 0.5rem;
  width: 1rem;
  height: 1rem;
  cursor: pointer;
`;

const StatsBar = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const StatCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 1rem;
  text-align: center;
  
  h3 {
    color: #e5e7eb;
    font-size: 1.5rem;
    font-weight: 700;
    margin: 0 0 0.5rem 0;
  }
  
  p {
    color: #9ca3af;
    font-size: 0.9rem;
    margin: 0;
  }
`;

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: #1f2937;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 2rem;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
`;

const ModalTitle = styled.h2`
  color: #e5e7eb;
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #9ca3af;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.5rem;
  
  &:hover {
    color: #e5e7eb;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: block;
  color: #e5e7eb;
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
`;

const ModalActions = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
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

const ResourcesPage = () => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState({ type: 'all', category: 'all' });
  const [search, setSearch] = useState('');
  const [selectedResources, setSelectedResources] = useState(new Set());
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingResource, setEditingResource] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [stats, setStats] = useState(null);
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    displayName: '',
    tags: '',
    category: ''
  });

  // 获取JWT token
  const getAuthToken = () => {
    return localStorage.getItem('admin_token') || sessionStorage.getItem('admin_token');
  };

  // 获取资源列表
  const fetchResources = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filter.type !== 'all') params.append('type', filter.type);
      if (filter.category !== 'all') params.append('category', filter.category);
      if (search.trim()) params.append('search', search.trim());
      params.append('limit', '50');
      params.append('offset', '0');

      const token = getAuthToken();
      const response = await fetch(`/api/resources?${params}`, {
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
        setResources(data.data);
      } else {
        throw new Error(data.message || '获取资源列表失败');
      }
    } catch (err) {
      setError(err.message);
      console.error('获取资源列表失败:', err);
    } finally {
      setLoading(false);
    }
  };

  // 获取统计信息
  const fetchStats = async () => {
    try {
      const token = getAuthToken();
      const response = await fetch('/api/resources/stats/overview', {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setStats(data.data);
        }
      }
    } catch (err) {
      console.error('获取统计信息失败:', err);
    }
  };

  // 文件上传
  const handleFileUpload = async (files, uploadType = 'single') => {
    try {
      setUploading(true);
      const formData = new FormData();
      
      if (uploadType === 'single') {
        formData.append('file', files[0]);
      } else {
        for (let i = 0; i < files.length; i++) {
          formData.append('files', files[i]);
        }
      }
      
      formData.append('type', 'sports');
      formData.append('category', 'logo');
      formData.append('tags', 'team,logo');

      const token = getAuthToken();
      const endpoint = uploadType === 'single' ? '/api/resources/upload' : '/api/resources/upload/batch';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: formData
      });

      const data = await response.json();
      
      if (data.success) {
        alert(data.message);
        fetchResources();
        fetchStats();
      } else {
        throw new Error(data.message || '上传失败');
      }
    } catch (err) {
      alert(`上传失败: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  // 删除资源
  const deleteResource = async (resourceId) => {
    if (!window.confirm('确定要删除这个资源吗？')) return;

    try {
      const token = getAuthToken();
      const response = await fetch(`/api/resources/${resourceId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (data.success) {
        fetchResources();
        fetchStats();
        alert('资源删除成功！');
      } else {
        throw new Error(data.message || '删除失败');
      }
    } catch (err) {
      alert(`删除失败: ${err.message}`);
    }
  };

  // 批量删除
  const batchDeleteResources = async () => {
    if (selectedResources.size === 0) {
      alert('请选择要删除的资源');
      return;
    }

    if (!window.confirm(`确定要删除 ${selectedResources.size} 个资源吗？`)) return;

    try {
      const token = getAuthToken();
      const response = await fetch('/api/resources/batch/delete', {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          resourceIds: Array.from(selectedResources)
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setSelectedResources(new Set());
        fetchResources();
        fetchStats();
        alert(data.message);
      } else {
        throw new Error(data.message || '批量删除失败');
      }
    } catch (err) {
      alert(`批量删除失败: ${err.message}`);
    }
  };

  // 编辑资源
  const openEditModal = (resource) => {
    setEditingResource(resource);
    setFormData({
      displayName: resource.display_name,
      tags: resource.tags || '',
      category: resource.category
    });
    setShowEditModal(true);
  };

  const saveResource = async () => {
    try {
      const token = getAuthToken();
      const response = await fetch(`/api/resources/${editingResource.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      
      if (data.success) {
        setShowEditModal(false);
        setEditingResource(null);
        fetchResources();
        alert('资源更新成功！');
      } else {
        throw new Error(data.message || '更新失败');
      }
    } catch (err) {
      alert(`更新失败: ${err.message}`);
    }
  };

  // 处理文件选择
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      handleFileUpload(files, files.length > 1 ? 'batch' : 'single');
    }
  };

  // 处理拖拽上传
  const handleDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files, files.length > 1 ? 'batch' : 'single');
    }
  };

  // 选择/取消选择资源
  const toggleResourceSelection = (resourceId) => {
    const newSelection = new Set(selectedResources);
    if (newSelection.has(resourceId)) {
      newSelection.delete(resourceId);
    } else {
      newSelection.add(resourceId);
    }
    setSelectedResources(newSelection);
  };

  // 格式化文件大小
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 处理搜索
  const handleSearch = () => {
    fetchResources();
  };

  // 初始化加载
  useEffect(() => {
    fetchResources();
    fetchStats();
  }, []);

  // 处理筛选变化
  useEffect(() => {
    fetchResources();
  }, [filter]);

  if (loading && resources.length === 0) {
    return (
      <Container>
        <Title>资源管理</Title>
        <LoadingSpinner />
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Title>资源管理</Title>
        <Controls>
          <FilterSelect 
            value={filter.type} 
            onChange={(e) => setFilter({...filter, type: e.target.value})}
          >
            <option value="all">全部类型</option>
            <option value="sports">体育</option>
            <option value="politics">政治</option>
            <option value="crypto">加密货币</option>
          </FilterSelect>
          
          <FilterSelect 
            value={filter.category} 
            onChange={(e) => setFilter({...filter, category: e.target.value})}
          >
            <option value="all">全部分类</option>
            <option value="logo">Logo</option>
            <option value="banner">横幅</option>
            <option value="icon">图标</option>
          </FilterSelect>
          
          <SearchInput
            type="text"
            placeholder="搜索资源..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          
          <Button onClick={handleSearch} disabled={loading}>
            搜索
          </Button>
        </Controls>
      </Header>

      {error && (
        <ErrorMessage>
          ❌ {error}
        </ErrorMessage>
      )}

      {/* 统计信息 */}
      {stats && (
        <StatsBar>
          <StatCard>
            <h3>{stats.overview.totalResources}</h3>
            <p>总资源数</p>
          </StatCard>
          <StatCard>
            <h3>{formatFileSize(stats.overview.totalSize)}</h3>
            <p>总存储大小</p>
          </StatCard>
          <StatCard>
            <h3>{stats.byType.length}</h3>
            <p>资源类型</p>
          </StatCard>
          <StatCard>
            <h3>{stats.byCategory.length}</h3>
            <p>资源分类</p>
          </StatCard>
        </StatsBar>
      )}

      {/* 文件上传区域 */}
      <UploadSection
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <UploadText>
          <h3>📁 上传资源文件</h3>
          <p>拖拽文件到此处，或点击按钮选择文件</p>
        </UploadText>
        
        <div>
          <UploadButton 
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? '上传中...' : '选择文件'}
          </UploadButton>
          
          <FileInput
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
          />
        </div>
        
        <UploadInfo>
          <span>支持格式：JPG, PNG, SVG, WebP</span>
          <span>最大大小：5MB</span>
          <span>支持批量上传</span>
        </UploadInfo>
      </UploadSection>

      {/* 批量操作信息 */}
      {selectedResources.size > 0 && (
        <SelectionInfo>
          <span>已选择 {selectedResources.size} 个资源</span>
          <div>
            <Button 
              variant="secondary" 
              onClick={() => setSelectedResources(new Set())}
              style={{ marginRight: '1rem' }}
            >
              取消选择
            </Button>
            <Button 
              variant="danger" 
              onClick={batchDeleteResources}
            >
              批量删除
            </Button>
          </div>
        </SelectionInfo>
      )}

      {/* 资源网格 */}
      {loading ? (
        <LoadingSpinner />
      ) : resources.length === 0 ? (
        <EmptyState>
          <h3>暂无资源</h3>
          <p>上传您的第一个资源文件开始管理</p>
        </EmptyState>
      ) : (
        <ResourcesGrid>
          {resources.map(resource => (
            <ResourceCard key={resource.id}>
              <Checkbox
                type="checkbox"
                checked={selectedResources.has(resource.id)}
                onChange={() => toggleResourceSelection(resource.id)}
              />
              
              <ResourcePreview>
                {resource.mime_type.startsWith('image/') ? (
                  <img 
                    src={`${window.location.origin}${resource.file_path}`}
                    alt={resource.display_name}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'block';
                    }}
                  />
                ) : (
                  <div style={{ color: '#9ca3af', fontSize: '2rem' }}>📄</div>
                )}
                <div style={{ display: 'none', color: '#9ca3af' }}>预览不可用</div>
              </ResourcePreview>
              
              <ResourceInfo>
                <ResourceName title={resource.name}>
                  {resource.display_name}
                </ResourceName>
                
                <ResourceMeta>
                  <span>{resource.type}/{resource.category}</span>
                  <span>{formatFileSize(resource.file_size)}</span>
                </ResourceMeta>
                
                {resource.tags && (
                  <ResourceTags>
                    {resource.tags.split(',').map((tag, index) => (
                      <Tag key={index}>{tag.trim()}</Tag>
                    ))}
                  </ResourceTags>
                )}
                
                <ResourceActions>
                  <ActionButton
                    variant="download"
                    title="下载"
                    onClick={() => window.open(`${window.location.origin}${resource.file_path}`, '_blank')}
                  >
                    下载
                  </ActionButton>
                  <ActionButton
                    variant="edit"
                    title="编辑"
                    onClick={() => openEditModal(resource)}
                  >
                    编辑
                  </ActionButton>
                  <ActionButton
                    variant="delete"
                    title="删除"
                    onClick={() => deleteResource(resource.id)}
                  >
                    删除
                  </ActionButton>
                </ResourceActions>
              </ResourceInfo>
            </ResourceCard>
          ))}
        </ResourcesGrid>
      )}

      {/* 编辑模态框 */}
      {showEditModal && editingResource && (
        <Modal onClick={(e) => e.target === e.currentTarget && setShowEditModal(false)}>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>编辑资源</ModalTitle>
              <CloseButton onClick={() => setShowEditModal(false)}>×</CloseButton>
            </ModalHeader>

            <FormGroup>
              <Label>显示名称</Label>
              <Input
                type="text"
                value={formData.displayName}
                onChange={(e) => setFormData({...formData, displayName: e.target.value})}
                placeholder="输入显示名称"
              />
            </FormGroup>

            <FormGroup>
              <Label>分类</Label>
              <Input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                placeholder="输入分类"
              />
            </FormGroup>

            <FormGroup>
              <Label>标签 (用逗号分隔)</Label>
              <Input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({...formData, tags: e.target.value})}
                placeholder="输入标签，用逗号分隔"
              />
            </FormGroup>

            <ModalActions>
              <Button 
                variant="secondary" 
                onClick={() => setShowEditModal(false)}
              >
                取消
              </Button>
              <Button onClick={saveResource}>
                保存
              </Button>
            </ModalActions>
          </ModalContent>
        </Modal>
      )}
    </Container>
  );
};

export default ResourcesPage;