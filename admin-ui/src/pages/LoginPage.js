import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';

const Container = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%);
  padding: 2rem;
`;

const LoginCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 3rem;
  backdrop-filter: blur(10px);
  width: 100%;
  max-width: 400px;
  animation: slideUp 0.5s ease-out;

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const Logo = styled.div`
  text-align: center;
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 0.5rem;
`;

const Subtitle = styled.p`
  color: #9ca3af;
  font-size: 0.875rem;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const ErrorMessage = styled.div`
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 8px;
  padding: 0.75rem 1rem;
  color: #ef4444;
  font-size: 0.875rem;
  text-align: center;
`;

const DefaultInfo = styled.div`
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 8px;
  padding: 0.75rem 1rem;
  color: #60a5fa;
  font-size: 0.875rem;
  text-align: center;
  margin-bottom: 1rem;
`;

const LoginPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(formData.username, formData.password);
      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.message || '登录失败');
      }
    } catch (err) {
      setError('登录过程中发生错误');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <Container>
      <LoginCard>
        <Logo>
          <Title>OddsMarket</Title>
          <Subtitle>管理后台</Subtitle>
        </Logo>

        <DefaultInfo>
          <div>🔐 默认登录信息</div>
          <div>用户名: admin | 密码: admin123</div>
        </DefaultInfo>

        <Form onSubmit={handleSubmit}>
          {error && <ErrorMessage>{error}</ErrorMessage>}
          
          <Input
            label="用户名"
            name="username"
            type="text"
            value={formData.username}
            onChange={handleInputChange}
            placeholder="请输入用户名"
            required
          />

          <Input
            label="密码"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleInputChange}
            placeholder="请输入密码"
            required
          />

          <Button
            type="submit"
            variant="primary"
            fullWidth
            loading={loading}
            disabled={!formData.username || !formData.password}
          >
            登录
          </Button>
        </Form>
      </LoginCard>
    </Container>
  );
};

export default LoginPage;