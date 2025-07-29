const express = require('express');
const router = express.Router();

/**
 * 健康检查端点 - Fly.io 使用
 */
router.get('/', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV
  });
});

module.exports = router;