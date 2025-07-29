import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { toast } from 'react-hot-toast';

const WalletContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 8px;
  margin-bottom: 16px;
`;

const WalletButton = styled.button`
  padding: 8px 16px;
  background: ${props => props.connected ? '#10b981' : '#3b82f6'};
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${props => props.connected ? '#059669' : '#2563eb'};
  }

  &:disabled {
    background: #6b7280;
    cursor: not-allowed;
  }
`;

const WalletInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const WalletAddress = styled.div`
  font-size: 13px;
  color: #374151;
  font-family: 'Monaco', 'Menlo', monospace;
`;

const WalletStatus = styled.div`
  font-size: 12px;
  color: #6b7280;
`;

const StatusDot = styled.span`
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${props => props.connected ? '#10b981' : '#ef4444'};
  margin-right: 6px;
`;

const WalletConnect = ({ onWalletConnect, onWalletDisconnect, required = false }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  // 检查是否已连接钱包
  useEffect(() => {
    checkWalletConnection();
  }, []);

  const checkWalletConnection = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ 
          method: 'eth_accounts' 
        });
        
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
          setIsConnected(true);
          onWalletConnect?.(accounts[0]);
        }
      } catch (error) {
        console.error('检查钱包连接失败:', error);
      }
    }
  };

  const connectWallet = async () => {
    if (typeof window.ethereum === 'undefined') {
      toast.error('请安装 MetaMask 钱包');
      return;
    }

    try {
      setIsConnecting(true);
      
      // 请求连接钱包
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (accounts.length > 0) {
        setWalletAddress(accounts[0]);
        setIsConnected(true);
        onWalletConnect?.(accounts[0]);
        toast.success('钱包连接成功！');
      }
    } catch (error) {
      console.error('连接钱包失败:', error);
      
      if (error.code === 4001) {
        toast.error('用户拒绝连接钱包');
      } else {
        toast.error('连接钱包失败: ' + error.message);
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setWalletAddress('');
    setIsConnected(false);
    onWalletDisconnect?.();
    toast.success('钱包已断开连接');
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <WalletContainer>
      <WalletInfo>
        {isConnected ? (
          <>
            <WalletAddress>
              <StatusDot connected={true} />
              已连接: {formatAddress(walletAddress)}
            </WalletAddress>
            <WalletStatus>BSC测试网 | MetaMask</WalletStatus>
          </>
        ) : (
          <>
            <WalletStatus>
              <StatusDot connected={false} />
              {required ? '需要连接钱包以发布市场' : '未连接钱包'}
            </WalletStatus>
          </>
        )}
      </WalletInfo>

      <WalletButton
        connected={isConnected}
        onClick={isConnected ? disconnectWallet : connectWallet}
        disabled={isConnecting}
      >
        {isConnecting ? '连接中...' : isConnected ? '断开连接' : '连接钱包'}
      </WalletButton>
    </WalletContainer>
  );
};

export default WalletConnect;