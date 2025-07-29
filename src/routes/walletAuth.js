const express = require('express');
const { ethers } = require('ethers');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const router = express.Router();

// 临时存储nonce，实际应用应使用Redis
const nonceStore = new Map();

/**
 * 获取签名nonce
 */
router.post('/nonce', async (req, res) => {
  try {
    const { address } = req.body;

    if (!address) {
      return res.status(400).json({
        success: false,
        message: '钱包地址是必需的'
      });
    }

    // 验证地址格式
    if (!ethers.utils.isAddress(address)) {
      return res.status(400).json({
        success: false,
        message: '无效的钱包地址格式'
      });
    }

    // 生成随机nonce
    const nonce = crypto.randomBytes(16).toString('hex');
    const timestamp = Date.now();
    
    // 构造签名消息
    const message = `OddsMarket Admin Login
Timestamp: ${timestamp}
Nonce: ${nonce}
Address: ${address.toLowerCase()}

请签名此消息以验证钱包所有权。`;

    // 存储nonce（5分钟过期）
    nonceStore.set(address.toLowerCase(), {
      nonce,
      timestamp,
      message,
      expires: timestamp + 5 * 60 * 1000 // 5分钟
    });

    console.log(`🔑 为地址 ${address} 生成登录nonce`);

    res.json({
      success: true,
      message,
      nonce,
      timestamp
    });

  } catch (error) {
    console.error('生成nonce失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

/**
 * 验证钱包签名并登录
 */
router.post('/verify', async (req, res) => {
  try {
    const { address, signature, message } = req.body;

    if (!address || !signature || !message) {
      return res.status(400).json({
        success: false,
        message: '地址、签名和消息都是必需的'
      });
    }

    const normalizedAddress = address.toLowerCase();

    // 检查nonce记录
    const nonceData = nonceStore.get(normalizedAddress);
    if (!nonceData) {
      return res.status(400).json({
        success: false,
        message: '未找到有效的nonce，请重新获取'
      });
    }

    // 检查是否过期
    if (Date.now() > nonceData.expires) {
      nonceStore.delete(normalizedAddress);
      return res.status(400).json({
        success: false,
        message: 'Nonce已过期，请重新获取'
      });
    }

    // 验证消息匹配
    if (message !== nonceData.message) {
      return res.status(400).json({
        success: false,
        message: '消息不匹配'
      });
    }

    // 验证签名
    let recoveredAddress;
    try {
      recoveredAddress = ethers.utils.verifyMessage(message, signature);
    } catch (error) {
      console.error('签名验证失败:', error);
      return res.status(400).json({
        success: false,
        message: '无效的签名'
      });
    }

    // 检查地址匹配
    if (recoveredAddress.toLowerCase() !== normalizedAddress) {
      return res.status(400).json({
        success: false,
        message: '签名地址与请求地址不匹配'
      });
    }

    // 清除已使用的nonce
    nonceStore.delete(normalizedAddress);

    // 生成JWT令牌
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    const token = jwt.sign(
      { 
        address: normalizedAddress,
        loginTime: Date.now(),
        method: 'wallet'
      },
      jwtSecret,
      { expiresIn: '24h' }
    );

    console.log(`✅ 钱包 ${address} 登录成功`);

    res.json({
      success: true,
      message: '登录成功',
      token,
      address: normalizedAddress,
      expiresIn: '24h'
    });

  } catch (error) {
    console.error('钱包验证失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

/**
 * 获取当前登录状态
 */
router.get('/status', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.json({
        success: false,
        authenticated: false,
        message: '未提供认证令牌'
      });
    }

    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    const decoded = jwt.verify(token, jwtSecret);

    res.json({
      success: true,
      authenticated: true,
      address: decoded.address,
      loginTime: decoded.loginTime,
      method: decoded.method
    });

  } catch (error) {
    res.json({
      success: false,
      authenticated: false,
      message: '无效的认证令牌'
    });
  }
});

/**
 * 钱包登出
 */
router.post('/logout', async (req, res) => {
  try {
    // 清理可能存在的nonce
    const { address } = req.body;
    if (address) {
      nonceStore.delete(address.toLowerCase());
    }

    res.json({
      success: true,
      message: '登出成功'
    });

  } catch (error) {
    console.error('登出失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

// 清理过期nonce的定时任务
setInterval(() => {
  const now = Date.now();
  for (const [address, data] of nonceStore.entries()) {
    if (now > data.expires) {
      nonceStore.delete(address);
    }
  }
}, 60 * 1000); // 每分钟清理一次

module.exports = router;