import {
  BarChart3,
  FileText,
  Image,
  LayoutDashboard,
  LogOut,
  Plus,
  Settings,
  Target
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../../contexts/AuthContext';

const Container = styled.aside`
  width: 280px;
  background: linear-gradient(180deg, rgba(20, 20, 20, 0.95) 0%, rgba(15, 15, 15, 0.98) 100%);
  border-right: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.3);

  @media (max-width: 768px) {
    width: 240px;
  }
`;

const Logo = styled.div`
  padding: 2rem 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(0, 0, 0, 0.3);
`;

const LogoText = styled.h1`
  font-size: 1.75rem;
  font-weight: 800;
  background: linear-gradient(135deg, #4a5568 0%, #718096 50%, #a0aec0 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0;
  letter-spacing: -0.5px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const LogoSubtext = styled.p`
  color: #6b7280;
  font-size: 0.75rem;
  margin: 0.25rem 0 0 0;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  opacity: 0.8;
`;

const Nav = styled.nav`
  flex: 1;
  padding: 1.5rem 0;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.02);
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
  }
`;

const NavItem = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.875rem;
  padding: 0.875rem 1.5rem;
  margin: 0 0.75rem 0.25rem 0.75rem;
  color: ${props => props.$active ? '#e5e7eb' : '#6b7280'};
  text-decoration: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 0.5rem;
  position: relative;
  background: ${props => props.$active ? 'linear-gradient(135deg, rgba(55, 65, 81, 0.3) 0%, rgba(75, 85, 99, 0.2) 100%)' : 'transparent'};

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 3px;
    height: ${props => props.$active ? '70%' : '0'};
    background: linear-gradient(180deg, #4b5563 0%, #6b7280 100%);
    border-radius: 0 2px 2px 0;
    transition: height 0.3s ease;
  }

  &:hover {
    color: #e5e7eb;
    background: linear-gradient(135deg, rgba(55, 65, 81, 0.2) 0%, rgba(75, 85, 99, 0.1) 100%);
    transform: translateX(2px);
  }

  svg {
    width: 20px;
    height: 20px;
    opacity: ${props => props.$active ? '1' : '0.7'};
  }
`;

const NavText = styled.span`
  font-weight: ${props => props.$active ? '600' : '500'};
  font-size: 0.875rem;
  letter-spacing: 0.025em;
`;

const Footer = styled.div`
  padding: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  background: linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.3) 100%);
`;

const LogoutButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.875rem 1rem;
  background: linear-gradient(135deg, rgba(30, 30, 30, 0.5) 0%, rgba(20, 20, 20, 0.5) 100%);
  color: #6b7280;
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 0.875rem;
  font-weight: 500;
  letter-spacing: 0.025em;

  &:hover {
    color: #dc2626;
    background: linear-gradient(135deg, rgba(127, 29, 29, 0.2) 0%, rgba(153, 27, 27, 0.15) 100%);
    border-color: rgba(220, 38, 38, 0.3);
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(220, 38, 38, 0.15);
  }

  svg {
    width: 18px;
    height: 18px;
    opacity: 0.8;
  }
`;

const Sidebar = () => {
  const location = useLocation();
  const { logout } = useAuth();

  const isActive = (path) => {
    return location.pathname === path;
  };

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: '仪表盘' },
    { path: '/markets', icon: Target, label: '市场管理' },
    { path: '/create-market', icon: Plus, label: '创建市场' },
    { path: '/resources', icon: Image, label: '资源管理' },
    { path: '/templates', icon: FileText, label: '模板管理' },
    { path: '/stats', icon: BarChart3, label: '统计分析' },
    { path: '/settings', icon: Settings, label: '系统设置' }
  ];

  return (
    <Container>
      <Logo>
        <LogoText>OddsMarket</LogoText>
        <LogoSubtext>管理后台 v1.0</LogoSubtext>
      </Logo>

      <Nav>
        {navItems.map((item) => (
          <NavItem
            key={item.path}
            to={item.path}
            $active={isActive(item.path)}
          >
            <item.icon />
            <NavText $active={isActive(item.path)}>{item.label}</NavText>
          </NavItem>
        ))}
      </Nav>

      <Footer>
        <LogoutButton onClick={logout}>
          <LogOut />
          退出登录
        </LogoutButton>
      </Footer>
    </Container>
  );
};

export default Sidebar;
