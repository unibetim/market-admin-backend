import React, { useState } from 'react';
import styled from 'styled-components';
import { User, Bell, Search, Wallet } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const Container = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  background: rgba(255, 255, 255, 0.02);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
`;

const Left = styled.div`
  flex: 1;
`;

const SearchBox = styled.div`
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  padding: 0.5rem 1rem;
  max-width: 400px;
  transition: all 0.2s ease;
  
  &:focus-within {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const SearchInput = styled.input`
  background: transparent;
  border: none;
  outline: none;
  color: #e5e7eb;
  margin-left: 0.5rem;
  font-size: 0.875rem;
  width: 100%;
  
  &::placeholder {
    color: #6b7280;
  }
`;

const Right = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const IconButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  color: #9ca3af;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #e5e7eb;
  }
  
  svg {
    width: 18px;
    height: 18px;
  }
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
`;

const Avatar = styled.div`
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 500;
  font-size: 0.875rem;
`;

const UserDetails = styled.div`
  display: flex;
  flex-direction: column;
`;

const UserName = styled.span`
  color: #e5e7eb;
  font-weight: 500;
  font-size: 0.875rem;
`;

const UserRole = styled.span`
  color: #9ca3af;
  font-size: 0.75rem;
`;

const WalletButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  height: 40px;
  padding: 0 1rem;
  min-width: 120px;
  background: ${props => props.connected ? 'rgba(16, 185, 129, 0.1)' : 'rgba(59, 130, 246, 0.1)'};
  border: 1px solid ${props => props.connected ? 'rgba(16, 185, 129, 0.2)' : 'rgba(59, 130, 246, 0.2)'};
  border-radius: 0.5rem;
  color: ${props => props.connected ? '#10b981' : '#3b82f6'};
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.8rem;
  font-weight: 500;
  white-space: nowrap;
  
  &:hover {
    background: ${props => props.connected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(59, 130, 246, 0.15)'};
    border-color: ${props => props.connected ? 'rgba(16, 185, 129, 0.3)' : 'rgba(59, 130, 246, 0.3)'};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  svg {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
  }
`;

const WalletAddress = styled.span`
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 0.7rem;
`;

const Header = () => {
  const { user } = useAuth();
  const [walletAddress, setWalletAddress] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const connectWallet = async () => {
    if (typeof window.ethereum === 'undefined') {
      toast.error('请安装 MetaMask 钱包');
      return;
    }

    try {
      setIsConnecting(true);
      
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (accounts.length > 0) {
        setWalletAddress(accounts[0]);
        setIsConnected(true);
        toast.success('钱包连接成功！');
      }
    } catch (error) {
      console.error('连接钱包失败:', error);
      
      if (error.code === 4001) {
        toast.error('用户拒绝连接钱包');
      } else {
        toast.error('连接钱包失败');
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setWalletAddress('');
    setIsConnected(false);
    toast.success('钱包已断开连接');
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 4)}...${address.substring(address.length - 4)}`;
  };

  return (
    <Container>
      <Left>
        <SearchBox>
          <Search size={16} color="#6b7280" />
          <SearchInput placeholder="搜索市场、资源..." />
        </SearchBox>
      </Left>
      
      <Right>
        <IconButton>
          <Bell />
        </IconButton>
        
        <WalletButton
          connected={isConnected}
          onClick={isConnected ? disconnectWallet : connectWallet}
          disabled={isConnecting}
        >
          <Wallet />
          {isConnecting ? (
            '连接中...'
          ) : isConnected ? (
            <WalletAddress>{formatAddress(walletAddress)}</WalletAddress>
          ) : (
            '连接钱包'
          )}
        </WalletButton>
        
        <UserInfo>
          <Avatar>
            {user?.username?.charAt(0)?.toUpperCase() || 'A'}
          </Avatar>
          <UserDetails>
            <UserName>{user?.username || 'Admin'}</UserName>
            <UserRole>系统管理员</UserRole>
          </UserDetails>
        </UserInfo>
      </Right>
    </Container>
  );
};

export default Header;