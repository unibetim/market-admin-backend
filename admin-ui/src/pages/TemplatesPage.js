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

const TemplatesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const TemplateCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1.5rem;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.2);
  }
`;

const TemplateHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
`;

const TemplateName = styled.h3`
  color: #e5e7eb;
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
`;

const TemplateType = styled.span`
  background: rgba(59, 130, 246, 0.2);
  color: #3b82f6;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
`;

const TemplateStats = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  font-size: 0.85rem;
  color: #9ca3af;
`;

const TemplateStat = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const TemplatePreview = styled.div`
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
  font-size: 0.9rem;
  color: #d1d5db;
  max-height: 100px;
  overflow: hidden;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 20px;
    background: linear-gradient(transparent, rgba(0, 0, 0, 0.2));
  }
`;

const TemplateActions = styled.div`
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
`;

const ActionButton = styled.button`
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  font-size: 0.85rem;
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
      case 'use':
        return `
          background: rgba(34, 197, 94, 0.2);
          color: #22c55e;
          &:hover { background: rgba(34, 197, 94, 0.3); }
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

const TextArea = styled.textarea`
  width: 100%;
  min-height: 200px;
  padding: 1rem;
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

const TemplatesPage = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [showUseModal, setShowUseModal] = useState(false);
  const [usingTemplate, setUsingTemplate] = useState(null);
  const [templateParameters, setTemplateParameters] = useState({});
  const [formData, setFormData] = useState({
    name: '',
    type: 'sports',
    category: 'football',
    template_data: ''
  });

  // 获取JWT token
  const getAuthToken = () => {
    return localStorage.getItem('admin_token') || sessionStorage.getItem('admin_token');
  };

  // 获取模板列表
  const fetchTemplates = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filter !== 'all') params.append('type', filter);

      const token = getAuthToken();
      const response = await fetch(`/api/templates?${params}`, {
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
        setTemplates(data.data);
      } else {
        throw new Error(data.message || '获取模板列表失败');
      }
    } catch (err) {
      setError(err.message);
      console.error('获取模板列表失败:', err);
    } finally {
      setLoading(false);
    }
  };

  // 保存模板
  const saveTemplate = async () => {
    try {
      const token = getAuthToken();
      const url = editingTemplate 
        ? `/api/templates/${editingTemplate.id}` 
        : '/api/templates';
      
      const method = editingTemplate ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      
      if (data.success) {
        setShowModal(false);
        setEditingTemplate(null);
        fetchTemplates();
        alert(editingTemplate ? '模板更新成功！' : '模板创建成功！');
      } else {
        throw new Error(data.message || '保存失败');
      }
    } catch (err) {
      alert(`保存失败: ${err.message}`);
    }
  };

  // 删除模板
  const deleteTemplate = async (templateId) => {
    if (!window.confirm('确定要删除这个模板吗？')) return;

    try {
      const token = getAuthToken();
      const response = await fetch(`/api/templates/${templateId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (data.success) {
        fetchTemplates();
        alert('模板删除成功！');
      } else {
        throw new Error(data.message || '删除失败');
      }
    } catch (err) {
      alert(`删除失败: ${err.message}`);
    }
  };

  // 打开编辑模态框
  const openEditModal = (template = null) => {
    if (template) {
      setEditingTemplate(template);
      setFormData({
        name: template.name,
        type: template.type,
        category: template.category,
        template_data: JSON.stringify(template.template_data, null, 2)
      });
    } else {
      setEditingTemplate(null);
      setFormData({
        name: '',
        type: 'sports',
        category: 'football',
        template_data: JSON.stringify({
          type: 'sports',
          category: 'football',
          title_template: '{teamA} vs {teamB}',
          description_template: '{league}：{teamA} vs {teamB}。预测获胜方。',
          options: {
            optionA: '{teamA}获胜',
            optionB: '{teamB}获胜'
          }
        }, null, 2)
      });
    }
    setShowModal(true);
  };

  // 关闭模态框
  const closeModal = () => {
    setShowModal(false);
    setEditingTemplate(null);
  };

  // 使用模板
  const handleUseTemplate = (template) => {
    setUsingTemplate(template);
    setTemplateParameters({});
    setShowUseModal(true);
  };

  // 从模板数据中提取所有变量
  const extractTemplateVariables = (templateData) => {
    const variables = new Set();
    const text = JSON.stringify(templateData);
    const matches = text.match(/\{([^}]+)\}/g);
    if (matches) {
      matches.forEach(match => {
        const variable = match.slice(1, -1); // 移除大括号
        variables.add(variable);
      });
    }
    return Array.from(variables);
  };

  // 应用模板创建市场
  const applyTemplate = async () => {
    try {
      const token = getAuthToken();
      const response = await fetch(`/api/templates/${usingTemplate.id}/apply`, {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          parameters: templateParameters,
          customizations: {
            resolutionTime: Math.floor(Date.now() / 1000) + 86400 * 7, // 默认7天后
            oracle: '0x6D9419dd2B0D44d77A082D3847B88a90DB45fC7b' // 默认预言机地址
          }
        })
      });

      const data = await response.json();
      
      if (data.success) {
        alert(`模板应用成功！生成的市场数据：\n${JSON.stringify(data.data.marketData, null, 2)}`);
        setShowUseModal(false);
        setUsingTemplate(null);
        setTemplateParameters({});
      } else {
        throw new Error(data.message || '应用模板失败');
      }
    } catch (err) {
      alert(`应用模板失败: ${err.message}`);
    }
  };

  // 初始化加载
  useEffect(() => {
    fetchTemplates();
  }, []);

  // 处理筛选
  const handleFilter = (newFilter) => {
    setFilter(newFilter);
    // 重新获取数据将在下次useEffect中处理
  };

  useEffect(() => {
    fetchTemplates();
  }, [filter]);

  if (loading && templates.length === 0) {
    return (
      <Container>
        <Title>模板管理</Title>
        <LoadingSpinner />
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Title>模板管理</Title>
        <Controls>
          <FilterSelect value={filter} onChange={(e) => handleFilter(e.target.value)}>
            <option value="all">全部类型</option>
            <option value="sports">体育</option>
            <option value="politics">政治</option>
            <option value="crypto">加密货币</option>
          </FilterSelect>
          
          <Button onClick={() => openEditModal()}>
            创建模板
          </Button>
        </Controls>
      </Header>

      {error && (
        <ErrorMessage>
          ❌ {error}
        </ErrorMessage>
      )}

      {loading ? (
        <LoadingSpinner />
      ) : templates.length === 0 ? (
        <EmptyState>
          <h3>暂无模板</h3>
          <p>点击"创建模板"开始创建第一个模板</p>
        </EmptyState>
      ) : (
        <TemplatesGrid>
          {templates.map(template => (
            <TemplateCard key={template.id}>
              <TemplateHeader>
                <div>
                  <TemplateName>{template.name}</TemplateName>
                  <TemplateType>{template.type}</TemplateType>
                </div>
              </TemplateHeader>

              <TemplateStats>
                <TemplateStat>
                  <span>📊</span>
                  <span>使用 {template.usage_count || template.metadata?.usage_count || 0} 次</span>
                </TemplateStat>
                <TemplateStat>
                  <span>📁</span>
                  <span>{template.category}</span>
                </TemplateStat>
              </TemplateStats>

              <TemplatePreview>
                {typeof template.template_data === 'object' 
                  ? JSON.stringify(template.template_data, null, 2)
                  : template.template_data || '{}'}
              </TemplatePreview>

              <TemplateActions>
                <ActionButton 
                  variant="use" 
                  title="使用模板创建市场"
                  onClick={() => handleUseTemplate(template)}
                >
                  使用
                </ActionButton>
                <ActionButton 
                  variant="edit" 
                  title="编辑模板"
                  onClick={() => openEditModal(template)}
                >
                  编辑
                </ActionButton>
                <ActionButton 
                  variant="delete" 
                  title="删除模板"
                  onClick={() => deleteTemplate(template.id)}
                >
                  删除
                </ActionButton>
              </TemplateActions>
            </TemplateCard>
          ))}
        </TemplatesGrid>
      )}

      {showModal && (
        <Modal onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>
                {editingTemplate ? '编辑模板' : '创建模板'}
              </ModalTitle>
              <CloseButton onClick={closeModal}>×</CloseButton>
            </ModalHeader>

            <FormGroup>
              <Label>模板名称</Label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="输入模板名称"
              />
            </FormGroup>

            <FormGroup>
              <Label>类型</Label>
              <FilterSelect 
                value={formData.type} 
                onChange={(e) => setFormData({...formData, type: e.target.value})}
              >
                <option value="sports">体育</option>
                <option value="politics">政治</option>
                <option value="crypto">加密货币</option>
              </FilterSelect>
            </FormGroup>

            <FormGroup>
              <Label>分类</Label>
              <Input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                placeholder="输入分类名称"
              />
            </FormGroup>

            <FormGroup>
              <Label>模板数据 (JSON格式)</Label>
              <TextArea
                value={formData.template_data}
                onChange={(e) => setFormData({...formData, template_data: e.target.value})}
                placeholder="输入JSON格式的模板数据"
              />
            </FormGroup>

            <ModalActions>
              <Button variant="secondary" onClick={closeModal}>
                取消
              </Button>
              <Button onClick={saveTemplate}>
                {editingTemplate ? '更新' : '创建'}
              </Button>
            </ModalActions>
          </ModalContent>
        </Modal>
      )}

      {showUseModal && usingTemplate && (
        <Modal onClick={(e) => e.target === e.currentTarget && setShowUseModal(false)}>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>使用模板: {usingTemplate.name}</ModalTitle>
              <CloseButton onClick={() => setShowUseModal(false)}>×</CloseButton>
            </ModalHeader>

            <FormGroup>
              <Label>模板预览</Label>
              <TemplatePreview style={{ marginBottom: '1rem' }}>
                {typeof usingTemplate.template_data === 'object' 
                  ? JSON.stringify(usingTemplate.template_data, null, 2)
                  : usingTemplate.template_data || '{}'}
              </TemplatePreview>
            </FormGroup>

            <FormGroup>
              <Label>填写模板参数</Label>
              {extractTemplateVariables(usingTemplate.template_data).map(variable => (
                <div key={variable} style={{ marginBottom: '1rem' }}>
                  <Label style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
                    {variable} {variable.includes('team') ? '(球队名称)' : 
                     variable.includes('league') ? '(联赛名称)' : 
                     variable.includes('price') ? '(价格)' : ''}
                  </Label>
                  <Input
                    type="text"
                    value={templateParameters[variable] || ''}
                    onChange={(e) => setTemplateParameters({
                      ...templateParameters,
                      [variable]: e.target.value
                    })}
                    placeholder={`输入 ${variable} 的值`}
                  />
                </div>
              ))}
            </FormGroup>

            <FormGroup>
              <Label>预览生成结果</Label>
              <TemplatePreview>
                {(() => {
                  try {
                    const templateData = usingTemplate.template_data;
                    let preview = JSON.stringify(templateData, null, 2);
                    
                    // 替换变量
                    Object.keys(templateParameters).forEach(key => {
                      const value = templateParameters[key];
                      if (value) {
                        preview = preview.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
                      }
                    });
                    
                    return preview;
                  } catch {
                    return '预览失败';
                  }
                })()}
              </TemplatePreview>
            </FormGroup>

            <ModalActions>
              <Button variant="secondary" onClick={() => setShowUseModal(false)}>
                取消
              </Button>
              <Button 
                onClick={applyTemplate}
                disabled={extractTemplateVariables(usingTemplate.template_data).some(
                  variable => !templateParameters[variable]
                )}
              >
                应用模板
              </Button>
            </ModalActions>
          </ModalContent>
        </Modal>
      )}
    </Container>
  );
};

export default TemplatesPage;