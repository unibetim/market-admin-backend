import React from 'react';
import styled from 'styled-components';
import { Heart, Github, Globe } from 'lucide-react';

const Container = styled.footer`
  background: linear-gradient(180deg, rgba(15, 15, 15, 0.95) 0%, rgba(10, 10, 10, 0.98) 100%);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  padding: 2rem 0;
  margin-top: auto;
`;

const Content = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1.5rem;
    text-align: center;
  }
`;

const Left = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Copyright = styled.p`
  color: #6b7280;
  font-size: 0.875rem;
  margin: 0;
  letter-spacing: 0.025em;
`;

const MadeWith = styled.p`
  color: #4b5563;
  font-size: 0.75rem;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  
  svg {
    width: 14px;
    height: 14px;
    color: #dc2626;
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
  
  @keyframes pulse {
    0%, 100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.1);
    }
  }
`;

const Right = styled.div`
  display: flex;
  gap: 1rem;
`;

const Link = styled.a`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, rgba(55, 65, 81, 0.3) 0%, rgba(75, 85, 99, 0.2) 100%);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 0.5rem;
  color: #6b7280;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  text-decoration: none;
  
  &:hover {
    color: #e5e7eb;
    background: linear-gradient(135deg, rgba(75, 85, 99, 0.4) 0%, rgba(107, 114, 128, 0.3) 100%);
    border-color: rgba(255, 255, 255, 0.1);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }
  
  svg {
    width: 18px;
    height: 18px;
  }
`;

const Version = styled.span`
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background: linear-gradient(135deg, rgba(55, 65, 81, 0.3) 0%, rgba(75, 85, 99, 0.2) 100%);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 9999px;
  color: #6b7280;
  font-size: 0.75rem;
  font-weight: 500;
  letter-spacing: 0.05em;
  margin-left: 1rem;
`;

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <Container>
      <Content>
        <Left>
          <Copyright>
            © {currentYear} OddsMarket. All rights reserved.
            <Version>v1.0.0</Version>
          </Copyright>
          <MadeWith>
            Made with <Heart /> by OddsMarket Team
          </MadeWith>
        </Left>
        
        <Right>
          <Link href="https://github.com" target="_blank" rel="noopener noreferrer">
            <Github />
          </Link>
          <Link href="https://oddsmarket.com" target="_blank" rel="noopener noreferrer">
            <Globe />
          </Link>
        </Right>
      </Content>
    </Container>
  );
};

export default Footer;