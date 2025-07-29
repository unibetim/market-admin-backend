const express = require('express');
const Web3Manager = require('../utils/web3Manager');
const jwt = require('jsonwebtoken');

const router = express.Router();
const web3Manager = new Web3Manager();

/**
 * 认证中间件 - 支持传统密码和钱包登录
 */
const authenticate = (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: '需要认证令牌'
      });
    }

    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    const decoded = jwt.verify(token, jwtSecret);
    
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: '无效的认证令牌'
    });
  }
};

/**
 * 准备创建市场的交易数据
 */
router.post('/prepare-create', authenticate, async (req, res) => {
  try {
    const { marketData, signerAddress } = req.body;

    if (!marketData || !signerAddress) {
      return res.status(400).json({
        success: false,
        message: '市场数据和签名者地址是必需的'
      });
    }

    // 默认使用BSC测试网
    const chainId = parseInt(process.env.DEFAULT_CHAIN_ID) || 97;

    // 准备交易数据
    const result = await web3Manager.prepareCreateMarketTransaction(
      chainId, 
      marketData, 
      signerAddress
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    console.log(`📋 为地址 ${signerAddress} 准备创建市场交易`);

    res.json({
      success: true,
      ...result,
      chainId
    });

  } catch (error) {
    console.error('准备创建市场交易失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

/**
 * 提交已签名的创建市场交易
 */
router.post('/submit-create', authenticate, async (req, res) => {
  try {
    const { txHash, marketData, signerAddress } = req.body;

    if (!txHash || !marketData || !signerAddress) {
      return res.status(400).json({
        success: false,
        message: '交易哈希、市场数据和签名者地址是必需的'
      });
    }

    const chainId = parseInt(process.env.DEFAULT_CHAIN_ID) || 97;

    console.log(`📤 处理已提交的创建市场交易: ${txHash}`);

    // 等待交易确认并获取市场ID
    const confirmResult = await web3Manager.waitForMarketCreation(chainId, txHash);

    if (!confirmResult.success) {
      return res.status(400).json({
        success: false,
        message: '交易确认失败',
        error: confirmResult.error
      });
    }

    // 保存市场到数据库
    try {
      // 生成市场ID
      const marketId = `market_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      
      // 格式化数据以匹配Database.js的createMarket方法
      const marketRecord = {
        marketId,
        type: marketData.category || 'other',
        category: marketData.category || 'other',
        title: marketData.description.substring(0, 100),
        description: marketData.description,
        optionA: marketData.options?.[0] || '选项A',
        optionB: marketData.options?.[1] || '选项B',
        resolutionTime: marketData.closingTime, // 直接使用时间戳
        oracleAddress: marketData.oracle_address || marketData.oracle || signerAddress,
        ipfsHash: null, // 不使用IPFS
        metadata: JSON.stringify({
          chainMarketId: confirmResult.marketId,
          txHash: txHash,
          blockNumber: confirmResult.blockNumber,
          creatorAddress: signerAddress,
          ...marketData.additional_data
        })
      };

      const savedMarket = await req.app.locals.db.createMarket(marketRecord);
      
      // 更新状态为active并添加链上信息
      await req.app.locals.db.run(`
        UPDATE markets SET 
          status = 'active',
          chain_market_id = ?,
          tx_hash = ?
        WHERE id = ?
      `, [confirmResult.marketId, txHash, savedMarket.id]);

      console.log(`✅ 市场已保存到数据库: ID ${savedMarket.id}, 链上ID ${confirmResult.marketId}`);

      res.json({
        success: true,
        message: '市场创建成功',
        market: savedMarket,
        blockchain: confirmResult
      });

    } catch (dbError) {
      console.error('保存市场到数据库失败:', dbError);
      
      // 即使数据库保存失败，交易仍然成功
      res.json({
        success: true,
        message: '市场已在区块链上创建，但数据库同步失败',
        blockchain: confirmResult,
        warning: '请手动同步数据库记录'
      });
    }

  } catch (error) {
    console.error('提交创建市场交易失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

/**
 * 准备提议结果的交易数据
 */
router.post('/prepare-propose-result', authenticate, async (req, res) => {
  try {
    const { marketId, outcome, signerAddress } = req.body;

    if (!marketId || outcome === undefined || !signerAddress) {
      return res.status(400).json({
        success: false,
        message: '市场ID、结果和签名者地址是必需的'
      });
    }

    const chainId = parseInt(process.env.DEFAULT_CHAIN_ID) || 97;
    const contract = web3Manager.contracts.get(chainId);
    const provider = web3Manager.providers.get(chainId);

    if (!contract || !provider) {
      return res.status(500).json({
        success: false,
        message: '区块链连接未初始化'
      });
    }

    // 编码交易数据
    const txData = contract.interface.encodeFunctionData('proposeResult', [
      marketId,
      outcome
    ]);

    // 估算Gas
    let gasEstimate;
    try {
      gasEstimate = await contract.estimateGas.proposeResult(marketId, outcome, {
        from: signerAddress
      });
    } catch (error) {
      console.warn('Gas估算失败:', error.message);
      gasEstimate = ethers.BigNumber.from('100000');
    }

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

    console.log(`📋 为市场 ${marketId} 准备提议结果交易`);

    res.json({
      success: true,
      transactionData,
      marketId,
      outcome,
      chainId
    });

  } catch (error) {
    console.error('准备提议结果交易失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

/**
 * 获取当前用户信息
 */
router.get('/user-info', authenticate, (req, res) => {
  res.json({
    success: true,
    user: req.user,
    message: '用户信息获取成功'
  });
});

module.exports = router;