import React, { useState, useEffect } from 'react';
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

const TabsContainer = styled.div`
  display: flex;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 2rem;
`;

const Tab = styled.button`
  padding: 1rem 1.5rem;
  background: none;
  border: none;
  color: ${props => props.active ? '#3b82f6' : '#9ca3af'};
  border-bottom: 2px solid ${props => props.active ? '#3b82f6' : 'transparent'};
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  transition: all 0.2s;

  &:hover {
    color: #e5e7eb;
  }
`;

const SettingsSection = styled.div`
  margin-bottom: 2rem;
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const SectionTitle = styled.h2`
  color: #e5e7eb;
  font-size: 1.2rem;
  font-weight: 600;
  margin: 0;
`;

const SettingsList = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  overflow: hidden;
`;

const SettingItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  
  &:last-child {
    border-bottom: none;
  }
`;

const SettingInfo = styled.div`
  flex: 1;
`;

const SettingKey = styled.div`
  color: #e5e7eb;
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
`;

const SettingDescription = styled.div`
  color: #9ca3af;
  font-size: 0.8rem;
  margin-bottom: 0.5rem;
`;

const SettingValue = styled.div`
  color: #d1d5db;
  font-size: 0.85rem;
  font-family: 'Courier New', monospace;
  background: rgba(0, 0, 0, 0.2);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const SettingActions = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-left: 1rem;
`;

const ActionButton = styled.button`
  padding: 0.25rem 0.75rem;
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
      default:
        return `
          background: rgba(156, 163, 175, 0.2);
          color: #9ca3af;
          &:hover { background: rgba(156, 163, 175, 0.3); }
        `;
    }
  }}
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
  max-width: 600px;
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

const Select = styled.select`
  width: 100%;
  padding: 0.75rem;
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

const TextArea = styled.textarea`
  width: 100%;
  min-height: 100px;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  color: #e5e7eb;
  font-size: 0.9rem;
  font-family: 'Courier New', monospace;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: #3b82f6;
  }
`;

const Checkbox = styled.input`
  margin-right: 0.5rem;
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

const SuccessMessage = styled.div`
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.3);
  border-radius: 8px;
  padding: 1rem;
  color: #22c55e;
  margin-bottom: 1rem;
`;

const SystemStatusCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
`;

const StatusGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
`;

const StatusItem = styled.div`
  text-align: center;
`;

const StatusValue = styled.div`
  color: #e5e7eb;
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
`;

const StatusLabel = styled.div`
  color: #9ca3af;
  font-size: 0.8rem;
`;

const BackupSection = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
`;

const BackupHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const BackupTitle = styled.h3`
  color: #e5e7eb;
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
`;

const BackupList = styled.div`
  max-height: 300px;
  overflow-y: auto;
`;

const BackupItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  
  &:last-child {
    border-bottom: none;
  }
`;

const BackupInfo = styled.div`
  flex: 1;
`;

const BackupId = styled.div`
  color: #e5e7eb;
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
`;

const BackupMeta = styled.div`
  color: #9ca3af;
  font-size: 0.8rem;
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

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('config');
  const [settings, setSettings] = useState({});
  const [systemStatus, setSystemStatus] = useState(null);
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [search, setSearch] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSetting, setEditingSetting] = useState(null);
  const [formData, setFormData] = useState({
    key: '',
    value: '',
    category: 'general',
    description: '',
    type: 'string',
    isSensitive: false
  });

  // 获取JWT token
  const getAuthToken = () => {
    return localStorage.getItem('admin_token') || sessionStorage.getItem('admin_token');
  };

  // 获取系统配置
  const fetchSettings = async () => {
    try {
      const token = getAuthToken();
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      
      const response = await fetch(`/api/settings/config?${params}`, {
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
        setSettings(data.data.grouped);
      } else {
        throw new Error(data.message || '获取系统配置失败');
      }
    } catch (err) {
      setError(err.message);
      console.error('获取系统配置失败:', err);
    }
  };

  // 获取系统状态
  const fetchSystemStatus = async () => {
    try {
      const token = getAuthToken();
      const response = await fetch('/api/settings/status', {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSystemStatus(data.data);
        }
      }
    } catch (err) {
      console.error('获取系统状态失败:', err);
    }
  };

  // 获取备份列表
  const fetchBackups = async () => {
    try {
      const token = getAuthToken();
      const response = await fetch('/api/settings/backups?limit=10', {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setBackups(data.data);
        }
      }
    } catch (err) {
      console.error('获取备份列表失败:', err);
    }
  };

  // 更新配置项
  const updateSetting = async (key, value, description) => {
    try {
      const token = getAuthToken();
      const response = await fetch(`/api/settings/config/${key}`, {
        method: 'PUT',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ value, description })
      });

      const data = await response.json();
      
      if (data.success) {
        setShowEditModal(false);
        setEditingSetting(null);
        fetchSettings();
        setSuccess('配置更新成功！');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        throw new Error(data.message || '更新失败');
      }
    } catch (err) {
      setError(`更新失败: ${err.message}`);
      setTimeout(() => setError(null), 5000);
    }
  };

  // 创建配置项
  const createSetting = async () => {
    try {
      const token = getAuthToken();
      const response = await fetch('/api/settings/config', {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      
      if (data.success) {
        setShowCreateModal(false);
        setFormData({
          key: '',
          value: '',
          category: 'general',
          description: '',
          type: 'string',
          isSensitive: false
        });
        fetchSettings();
        setSuccess('配置项创建成功！');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        throw new Error(data.message || '创建失败');
      }
    } catch (err) {
      setError(`创建失败: ${err.message}`);
      setTimeout(() => setError(null), 5000);
    }
  };

  // 删除配置项
  const deleteSetting = async (key) => {
    if (!window.confirm(`确定要删除配置项 "${key}" 吗？`)) return;

    try {
      const token = getAuthToken();
      const response = await fetch(`/api/settings/config/${key}`, {
        method: 'DELETE',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (data.success) {
        fetchSettings();
        setSuccess('配置项删除成功！');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        throw new Error(data.message || '删除失败');
      }
    } catch (err) {
      setError(`删除失败: ${err.message}`);
      setTimeout(() => setError(null), 5000);
    }
  };

  // 创建备份
  const createBackup = async () => {
    try {
      const token = getAuthToken();
      const response = await fetch('/api/settings/backup', {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          includeData: true,
          includeLogs: true,
          format: 'json'
        })
      });

      const data = await response.json();
      
      if (data.success) {
        fetchBackups();
        setSuccess('系统备份创建成功！');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        throw new Error(data.message || '创建备份失败');
      }
    } catch (err) {
      setError(`创建备份失败: ${err.message}`);
      setTimeout(() => setError(null), 5000);
    }
  };

  // 下载备份
  const downloadBackup = (backupId) => {
    const token = getAuthToken();
    const url = `/api/settings/backup/${backupId}/download`;
    
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
        link.download = `backup_${backupId}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
      })
      .catch(err => {
        setError('下载失败: ' + err.message);
        setTimeout(() => setError(null), 5000);
      });
  };

  // 打开编辑模态框
  const openEditModal = (setting) => {
    setEditingSetting(setting);
    setFormData({
      key: setting.key,
      value: typeof setting.value === 'object' ? JSON.stringify(setting.value, null, 2) : setting.value,
      category: setting.category,
      description: setting.description,
      type: setting.type,
      isSensitive: setting.is_sensitive
    });
    setShowEditModal(true);
  };

  // 处理搜索
  const handleSearch = () => {
    fetchSettings();
  };

  // 格式化运行时间
  const formatUptime = (seconds) => {
    const days = Math.floor(seconds / (24 * 60 * 60));
    const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((seconds % (60 * 60)) / 60);
    
    if (days > 0) {
      return `${days}天 ${hours}小时`;
    } else if (hours > 0) {
      return `${hours}小时 ${minutes}分钟`;
    } else {
      return `${minutes}分钟`;
    }
  };

  // 格式化文件大小
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 初始化加载
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchSettings(),
        fetchSystemStatus(),
        fetchBackups()
      ]);
      setLoading(false);
    };
    
    loadData();
  }, []);

  // 处理搜索变化
  useEffect(() => {
    if (activeTab === 'config') {
      const debounce = setTimeout(() => {
        fetchSettings();
      }, 300);
      return () => clearTimeout(debounce);
    }
  }, [search, activeTab]);

  if (loading) {
    return (
      <Container>
        <Title>系统设置</Title>
        <LoadingSpinner />
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Title>系统设置</Title>
        <Controls>
          {activeTab === 'config' && (
            <SearchInput
              type="text"
              placeholder="搜索配置项..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          )}
          <Button onClick={() => {
            if (activeTab === 'config') {
              setShowCreateModal(true);
            } else if (activeTab === 'backup') {
              createBackup();
            }
          }}>
            {activeTab === 'config' ? '新建配置' : '创建备份'}
          </Button>
        </Controls>
      </Header>

      {error && (
        <ErrorMessage>
          ❌ {error}
        </ErrorMessage>
      )}

      {success && (
        <SuccessMessage>
          ✅ {success}
        </SuccessMessage>
      )}

      {/* 标签页 */}
      <TabsContainer>
        <Tab 
          active={activeTab === 'config'} 
          onClick={() => setActiveTab('config')}
        >
          配置管理
        </Tab>
        <Tab 
          active={activeTab === 'status'} 
          onClick={() => setActiveTab('status')}
        >
          系统状态
        </Tab>
        <Tab 
          active={activeTab === 'backup'} 
          onClick={() => setActiveTab('backup')}
        >
          备份管理
        </Tab>
      </TabsContainer>

      {/* 配置管理 */}
      {activeTab === 'config' && (
        <>
          {Object.keys(settings).length === 0 ? (
            <EmptyState>
              <h3>暂无配置项</h3>
              <p>点击"新建配置"创建第一个配置项</p>
            </EmptyState>
          ) : (
            Object.entries(settings).map(([category, categorySettings]) => (
              <SettingsSection key={category}>
                <SectionHeader>
                  <SectionTitle>
                    📁 {category.toUpperCase()} ({categorySettings.length})
                  </SectionTitle>
                </SectionHeader>
                <SettingsList>
                  {categorySettings.map((setting) => (
                    <SettingItem key={setting.key}>
                      <SettingInfo>
                        <SettingKey>{setting.key}</SettingKey>
                        <SettingDescription>{setting.description}</SettingDescription>
                        <SettingValue>
                          {setting.is_sensitive && setting.value === '***' 
                            ? '***' 
                            : (typeof setting.value === 'object' 
                                ? JSON.stringify(setting.value) 
                                : String(setting.value)
                              )
                          }
                        </SettingValue>
                      </SettingInfo>
                      <SettingActions>
                        <ActionButton
                          variant="edit"
                          onClick={() => openEditModal(setting)}
                        >
                          编辑
                        </ActionButton>
                        <ActionButton
                          variant="delete"
                          onClick={() => deleteSetting(setting.key)}
                        >
                          删除
                        </ActionButton>
                      </SettingActions>
                    </SettingItem>
                  ))}
                </SettingsList>
              </SettingsSection>
            ))
          )}
        </>
      )}

      {/* 系统状态 */}
      {activeTab === 'status' && systemStatus && (
        <>
          <SystemStatusCard>
            <SectionTitle>💻 系统信息</SectionTitle>
            <StatusGrid>
              <StatusItem>
                <StatusValue>{formatUptime(systemStatus.system.uptime)}</StatusValue>
                <StatusLabel>运行时间</StatusLabel>
              </StatusItem>
              <StatusItem>
                <StatusValue>{systemStatus.system.nodeVersion}</StatusValue>
                <StatusLabel>Node 版本</StatusLabel>
              </StatusItem>
              <StatusItem>
                <StatusValue>{systemStatus.system.platform}</StatusValue>
                <StatusLabel>平台</StatusLabel>
              </StatusItem>
              <StatusItem>
                <StatusValue>{systemStatus.system.environment}</StatusValue>
                <StatusLabel>环境</StatusLabel>
              </StatusItem>
              <StatusItem>
                <StatusValue>{Math.round(systemStatus.system.memoryUsage.rss / 1024 / 1024)} MB</StatusValue>
                <StatusLabel>内存使用</StatusLabel>
              </StatusItem>
              <StatusItem>
                <StatusValue>{systemStatus.database.totalTables}</StatusValue>
                <StatusLabel>数据库表数</StatusLabel>
              </StatusItem>
            </StatusGrid>
          </SystemStatusCard>

          {systemStatus.health && (
            <SystemStatusCard>
              <SectionTitle>🔍 健康检查</SectionTitle>
              <SettingsList>
                {systemStatus.health.checks.map((check) => (
                  <SettingItem key={check.name}>
                    <SettingInfo>
                      <SettingKey>
                        {check.status === 'healthy' ? '✅' : check.status === 'warning' ? '⚠️' : '❌'} 
                        {' '}{check.name}
                      </SettingKey>
                      <SettingDescription>{check.message}</SettingDescription>
                    </SettingInfo>
                  </SettingItem>
                ))}
              </SettingsList>
            </SystemStatusCard>
          )}

          {systemStatus.database.tables && (
            <SystemStatusCard>
              <SectionTitle>📊 数据库表统计</SectionTitle>
              <SettingsList>
                {systemStatus.database.tables.map((table) => (
                  <SettingItem key={table.name}>
                    <SettingInfo>
                      <SettingKey>{table.name}</SettingKey>
                      <SettingDescription>{table.rowCount} 条记录</SettingDescription>
                    </SettingInfo>
                  </SettingItem>
                ))}
              </SettingsList>
            </SystemStatusCard>
          )}
        </>
      )}

      {/* 备份管理 */}
      {activeTab === 'backup' && (
        <BackupSection>
          <BackupHeader>
            <BackupTitle>📦 系统备份列表</BackupTitle>
          </BackupHeader>
          {backups.length === 0 ? (
            <EmptyState>
              <h3>暂无备份</h3>
              <p>点击"创建备份"创建第一个系统备份</p>
            </EmptyState>
          ) : (
            <BackupList>
              {backups.map((backup) => (
                <BackupItem key={backup.backup_id}>
                  <BackupInfo>
                    <BackupId>{backup.backup_id}</BackupId>
                    <BackupMeta>
                      大小: {formatFileSize(backup.size)} | 
                      创建时间: {backup.createdAtFormatted} | 
                      格式: {backup.format.toUpperCase()} |
                      {backup.fileExists ? ' ✅ 文件存在' : ' ❌ 文件缺失'}
                    </BackupMeta>
                  </BackupInfo>
                  <SettingActions>
                    {backup.fileExists && (
                      <ActionButton
                        onClick={() => downloadBackup(backup.backup_id)}
                      >
                        下载
                      </ActionButton>
                    )}
                  </SettingActions>
                </BackupItem>
              ))}
            </BackupList>
          )}
        </BackupSection>
      )}

      {/* 编辑配置模态框 */}
      {showEditModal && editingSetting && (
        <Modal onClick={(e) => e.target === e.currentTarget && setShowEditModal(false)}>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>编辑配置项</ModalTitle>
              <CloseButton onClick={() => setShowEditModal(false)}>×</CloseButton>
            </ModalHeader>

            <FormGroup>
              <Label>配置键</Label>
              <Input
                type="text"
                value={formData.key}
                disabled
              />
            </FormGroup>

            <FormGroup>
              <Label>配置值</Label>
              {formData.type === 'json' ? (
                <TextArea
                  value={formData.value}
                  onChange={(e) => setFormData({...formData, value: e.target.value})}
                  placeholder="输入JSON格式的配置值"
                />
              ) : (
                <Input
                  type={formData.type === 'number' ? 'number' : 'text'}
                  value={formData.value}
                  onChange={(e) => setFormData({...formData, value: e.target.value})}
                  placeholder="输入配置值"
                />
              )}
            </FormGroup>

            <FormGroup>
              <Label>描述</Label>
              <Input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="输入配置描述"
              />
            </FormGroup>

            <ModalActions>
              <Button 
                variant="secondary" 
                onClick={() => setShowEditModal(false)}
              >
                取消
              </Button>
              <Button onClick={() => updateSetting(formData.key, formData.value, formData.description)}>
                保存
              </Button>
            </ModalActions>
          </ModalContent>
        </Modal>
      )}

      {/* 创建配置模态框 */}
      {showCreateModal && (
        <Modal onClick={(e) => e.target === e.currentTarget && setShowCreateModal(false)}>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>创建配置项</ModalTitle>
              <CloseButton onClick={() => setShowCreateModal(false)}>×</CloseButton>
            </ModalHeader>

            <FormGroup>
              <Label>配置键</Label>
              <Input
                type="text"
                value={formData.key}
                onChange={(e) => setFormData({...formData, key: e.target.value})}
                placeholder="输入配置键名"
              />
            </FormGroup>

            <FormGroup>
              <Label>分类</Label>
              <Select
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
              >
                <option value="general">通用</option>
                <option value="database">数据库</option>
                <option value="security">安全</option>
                <option value="api">API</option>
                <option value="ui">界面</option>
              </Select>
            </FormGroup>

            <FormGroup>
              <Label>类型</Label>
              <Select
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
              >
                <option value="string">字符串</option>
                <option value="number">数字</option>
                <option value="boolean">布尔值</option>
                <option value="json">JSON</option>
              </Select>
            </FormGroup>

            <FormGroup>
              <Label>配置值</Label>
              {formData.type === 'json' ? (
                <TextArea
                  value={formData.value}
                  onChange={(e) => setFormData({...formData, value: e.target.value})}
                  placeholder="输入JSON格式的配置值"
                />
              ) : (
                <Input
                  type={formData.type === 'number' ? 'number' : 'text'}
                  value={formData.value}
                  onChange={(e) => setFormData({...formData, value: e.target.value})}
                  placeholder="输入配置值"
                />
              )}
            </FormGroup>

            <FormGroup>
              <Label>描述</Label>
              <Input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="输入配置描述"
              />
            </FormGroup>

            <FormGroup>
              <Label>
                <Checkbox
                  type="checkbox"
                  checked={formData.isSensitive}
                  onChange={(e) => setFormData({...formData, isSensitive: e.target.checked})}
                />
                敏感信息
              </Label>
            </FormGroup>

            <ModalActions>
              <Button 
                variant="secondary" 
                onClick={() => setShowCreateModal(false)}
              >
                取消
              </Button>
              <Button onClick={createSetting}>
                创建
              </Button>
            </ModalActions>
          </ModalContent>
        </Modal>
      )}
    </Container>
  );
};

export default SettingsPage;