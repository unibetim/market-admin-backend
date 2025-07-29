const { ethers } = require('ethers');
const OddsMarketV1SimplifiedABI = require('../abi/OddsMarketV1Simplified.json');

/**
 * Web3管理器 - 与前端保持一致的区块链交互
 */
class Web3Manager {
  constructor() {
    this.providers = new Map();
    this.contracts = new Map();
    this.networkConfigs = {
      56: {
        name: 'BSC Mainnet',
        rpcUrls: [
          'https://bsc-dataseed1.binance.org/',
          'https://bsc-dataseed2.binance.org/',
          'https://bsc-dataseed3.binance.org/'
        ],
        chainId: 56,
        symbol: 'BNB'
      },
      97: {
        name: 'BSC Testnet',
        rpcUrls: [
          'https://data-seed-prebsc-1-s1.binance.org:8545/',
          'https://data-seed-prebsc-2-s1.binance.org:8545/'
        ],
        chainId: 97,
        symbol: 'tBNB'
      }
    };

    // 合约配置 - 与前端保持一致
    this.contractConfigs = {
      97: {
        address: process.env.ODDSMARKET_CONTRACT_ADDRESS || '0x43D802f4E2057E49F425A3266E9DE66FB5ae29b9',
        abi: OddsMarketV1SimplifiedABI
      },
      56: {
        address: process.env.ODDSMARKET_CONTRACT_ADDRESS_MAINNET || '',
        abi: OddsMarketV1SimplifiedABI
      }
    };

    this.init();
  }

  async init() {
    try {
      // 初始化默认网络 (BSC Testnet)
      await this.initNetwork(97);
      console.log('✅ Web3Manager初始化成功');
    } catch (error) {
      console.warn('⚠️ Web3Manager初始化失败，但应用将继续运行:', error.message);
      // 不抛出错误，让应用继续运行
    }
  }

  async initNetwork(chainId) {
    const config = this.networkConfigs[chainId];
    if (!config) {
      throw new Error(`不支持的网络: ${chainId}`);
    }

    // 创建provider (支持多个RPC重试)
    let provider = null;
    for (const rpcUrl of config.rpcUrls) {
      try {
        provider = new ethers.providers.JsonRpcProvider(rpcUrl);
        await provider.getNetwork(); // 测试连接
        break;
      } catch (error) {
        console.warn(`RPC ${rpcUrl} 连接失败:`, error.message);
        continue;
      }
    }

    if (!provider) {
      throw new Error(`无法连接到网络 ${chainId}`);
    }

    this.providers.set(chainId, provider);

    // 初始化只读合约实例 (不再使用私钥)
    if (this.contractConfigs[chainId]) {
      const contractConfig = this.contractConfigs[chainId];
      const contract = new ethers.Contract(
        contractConfig.address,
        contractConfig.abi,
        provider // 只用provider，不再需要wallet
      );
      this.contracts.set(chainId, contract);
      console.log(`📋 只读合约已初始化: ${contractConfig.address}`);
    }

    console.log(`🌐 网络 ${config.name} (${chainId}) 初始化成功`);
  }

  /**
   * 准备创建市场的交易数据 - 供前端钱包签名
   */
  async prepareCreateMarketTransaction(chainId, marketData, signerAddress) {
    try {
      const contract = this.contracts.get(chainId);
      const provider = this.providers.get(chainId);
      
      if (!contract || !provider) {
        throw new Error(`网络 ${chainId} 未初始化`);
      }

      // 解构市场数据
      const {
        description,
        closingTime,
        oracle = signerAddress // 默认使用签名者作为预言机
      } = marketData;

      // 计算duration (相对于当前时间的秒数)
      const currentTime = Math.floor(Date.now() / 1000);
      const duration = closingTime - currentTime;

      console.log('⏰ 时间验证:', {
        closingTime,
        closingTimeDate: new Date(closingTime * 1000).toLocaleString(),
        currentTime,
        currentTimeDate: new Date(currentTime * 1000).toLocaleString(),
        duration,
        durationHours: Math.floor(duration / 3600)
      });

      if (duration <= 0) {
        throw new Error(`市场结束时间必须在未来。当前时间: ${new Date(currentTime * 1000).toLocaleString()}, 市场结束时间: ${new Date(closingTime * 1000).toLocaleString()}`);
      }

      console.log('📋 准备创建市场交易数据...', {
        description: description.substring(0, 50) + '...',
        duration: `${Math.floor(duration / 3600)}小时`,
        closingTime: new Date(closingTime * 1000).toLocaleString(),
        oracle,
        signer: signerAddress
      });

      // 编码交易数据
      const txData = contract.interface.encodeFunctionData('createMarket', [
        description,
        duration,
        oracle
      ]);

      // 估算Gas
      let gasEstimate;
      try {
        gasEstimate = await contract.estimateGas.createMarket(
          description,
          duration,
          oracle,
          { from: signerAddress }
        );
      } catch (error) {
        console.warn('Gas估算失败，使用默认值:', error.message);
        gasEstimate = ethers.BigNumber.from('300000');
      }

      // 获取gas price和nonce
      const [gasPrice, nonce] = await Promise.all([
        provider.getGasPrice(),
        provider.getTransactionCount(signerAddress, 'latest')
      ]);

      const transactionData = {
        to: contract.address,
        data: txData,
        value: '0',
        gasLimit: gasEstimate.mul(120).div(100).toHexString(),
        gasPrice: gasPrice.toHexString(),
        nonce,
        chainId
      };

      console.log('✅ 交易数据准备完成');

      return {
        success: true,
        transactionData,
        marketParams: { description, duration, oracle, closingTime },
        gasEstimate: gasEstimate.toString()
      };

    } catch (error) {
      console.error('❌ 准备交易数据失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 等待交易确认并解析市场ID
   */
  async waitForMarketCreation(chainId, txHash) {
    try {
      const provider = this.providers.get(chainId);
      const contract = this.contracts.get(chainId);
      
      if (!provider || !contract) {
        throw new Error(`网络 ${chainId} 未初始化`);
      }

      console.log(`⏳ 等待交易确认: ${txHash}`);

      // 等待交易确认
      const receipt = await provider.waitForTransaction(txHash, 1, 300000); // 5分钟超时

      if (receipt.status !== 1) {
        throw new Error('交易执行失败');
      }

      // 解析事件获取市场ID
      const marketCreatedEvent = receipt.logs
        .map(log => {
          try {
            return contract.interface.parseLog(log);
          } catch (e) {
            return null;
          }
        })
        .find(event => event && event.name === 'MarketCreated');

      const marketId = marketCreatedEvent?.args?.marketId?.toString();

      console.log(`✅ 市场创建成功! 市场ID: ${marketId}`);

      return {
        success: true,
        marketId,
        txHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        explorerUrl: this.getExplorerUrl(chainId, txHash, 'tx')
      };

    } catch (error) {
      console.error('❌ 交易确认失败:', error);
      return {
        success: false,
        error: error.message,
        txHash
      };
    }
  }

  /**
   * 获取市场信息
   */
  async getMarket(chainId, marketId) {
    try {
      const contract = this.contracts.get(chainId);
      if (!contract) {
        throw new Error(`网络 ${chainId} 的合约未初始化`);
      }

      const marketData = await contract.markets(marketId);
      
      return {
        marketId: marketId,
        description: marketData.description,
        creator: marketData.creator,
        oracle: marketData.oracle,
        status: marketData.status,
        resolutionTime: marketData.resolutionTime.toNumber(),
        totalShares: [
          marketData.totalShares[0].toString(),
          marketData.totalShares[1].toString()
        ],
        isResolved: marketData.isResolved,
        winningOutcome: marketData.winningOutcome
      };

    } catch (error) {
      console.error('获取市场信息失败:', error);
      throw error;
    }
  }

  /**
   * 提议市场结果
   */
  async proposeResult(chainId, marketId, outcome) {
    try {
      const contract = this.contracts.get(chainId);
      if (!contract || !this.adminWallet) {
        throw new Error('合约或管理员钱包未初始化');
      }

      const tx = await contract.proposeResult(marketId, outcome);
      const receipt = await tx.wait();

      console.log(`✅ 结果提议成功: 市场${marketId}, 结果${outcome}`);

      return {
        success: true,
        txHash: tx.hash,
        blockNumber: receipt.blockNumber
      };

    } catch (error) {
      console.error('提议结果失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 确认市场结果
   */
  async finalizeResult(chainId, marketId) {
    try {
      const contract = this.contracts.get(chainId);
      if (!contract || !this.adminWallet) {
        throw new Error('合约或管理员钱包未初始化');
      }

      const tx = await contract.finalizeResult(marketId);
      const receipt = await tx.wait();

      console.log(`✅ 结果确认成功: 市场${marketId}`);

      return {
        success: true,
        txHash: tx.hash,
        blockNumber: receipt.blockNumber
      };

    } catch (error) {
      console.error('确认结果失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 获取网络状态
   */
  async getNetworkStatus(chainId) {
    try {
      const provider = this.providers.get(chainId);
      if (!provider) {
        return { connected: false, error: '网络未初始化' };
      }

      const [blockNumber, gasPrice, balance] = await Promise.all([
        provider.getBlockNumber(),
        provider.getGasPrice(),
        this.adminWallet ? provider.getBalance(this.adminWallet.address) : Promise.resolve('0')
      ]);

      return {
        connected: true,
        blockNumber,
        gasPrice: gasPrice.toString(),
        adminBalance: ethers.utils.formatEther(balance)
      };

    } catch (error) {
      return {
        connected: false,
        error: error.message
      };
    }
  }

  /**
   * 获取区块链浏览器URL
   */
  getExplorerUrl(chainId, hash, type = 'tx') {
    const config = this.networkConfigs[chainId];
    if (!config) return '';
    
    const baseUrls = {
      56: 'https://bscscan.com',
      97: 'https://testnet.bscscan.com'
    };
    
    const baseUrl = baseUrls[chainId];
    if (!baseUrl) return '';
    
    return `${baseUrl}/${type}/${hash}`;
  }

  /**
   * 获取支持的网络列表
   */
  getSupportedNetworks() {
    return Object.keys(this.networkConfigs).map(chainId => ({
      chainId: parseInt(chainId),
      ...this.networkConfigs[chainId]
    }));
  }
}

module.exports = Web3Manager;
