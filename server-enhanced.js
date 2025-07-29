/**
 * 🚀 OddsMarket 增强版服务器
 * 世界顶级全栈架构 - 企业级实时交易平台
 *
 * 新增功能:
 * - WebSocket实时推送
 * - 区块链事件监听
 * - 完整交易API
 * - 智能合约集成
 * - 实时数据同步
 * - 企业级监控
 *
 * @author 世界顶级全栈工程师团队
 * @version 2.0.0
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const http = require('http');
require('dotenv').config();

// 核心服务导入
const Database = require('./src/database/Database');
const MainService = require('./src/services/MainService');

// 路由导入
const authRoutes = require('./src/routes/auth');
const marketsRoutes = require('./src/routes/markets');
const templatesRoutes = require('./src/routes/templates');
const resourcesRoutes = require('./src/routes/resources');
const statsRoutes = require('./src/routes/stats');
const settingsRoutes = require('./src/routes/settings');
const { initTradingRoutes } = require('./src/routes/trading');

const app = express();
const PORT = process.env.PORT || 3001;

// 创建HTTP服务器（支持WebSocket）
const server = http.createServer(app);

// 初始化数据库
const database = new Database();

// 初始化主服务（WebSocket + 事件监听）
let mainService = null;

// 中间件配置
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "ws:", "wss:"]
    }
  }
}));

// CORS配置 - 支持WebSocket
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',      // 前端开发环境
      'http://localhost:3001',      // 后端开发环境
      'https://localhost:3000',     // HTTPS开发环境
      'https://localhost:3001',     // HTTPS开发环境
    ];

    // 生产环境域名
    if (process.env.FRONTEND_URL) {
      allowedOrigins.push(process.env.FRONTEND_URL);
    }
    if (process.env.ADMIN_URL) {
      allowedOrigins.push(process.env.ADMIN_URL);
    }

    // 开发环境宽松策略
    if (process.env.NODE_ENV === 'development') {
      if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1')) {
        return callback(null, true);
      }
    }

    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      console.warn(`🚫 CORS blocked request from ${origin}`);
      callback(new Error('CORS not allowed'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// 请求日志
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// 请求解析
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
app.use('/public', express.static(path.join(__dirname, 'public')));

// API路由
app.use('/api/auth', authRoutes);
app.use('/api/markets', marketsRoutes);
app.use('/api/templates', templatesRoutes);
app.use('/api/resources', resourcesRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/settings', settingsRoutes);

// 管理后台静态页面
app.use('/admin', express.static(path.join(__dirname, 'admin-ui/build')));
app.get('/admin/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin-ui/build/index.html'));
});

// WebSocket状态端点
app.get('/api/websocket/status', (req, res) => {
  if (mainService && mainService.socketService) {
    const status = mainService.socketService.getStatus();
    res.json({
      success: true,
      data: status
    });
  } else {
    res.json({
      success: false,
      message: 'WebSocket service not available'
    });
  }
});

// 区块链监听状态端点
app.get('/api/blockchain/status', (req, res) => {
  if (mainService && mainService.eventListener) {
    const status = mainService.eventListener.getStats();
    res.json({
      success: true,
      data: status
    });
  } else {
    res.json({
      success: false,
      message: 'Blockchain event listener not available'
    });
  }
});

// 系统健康检查（增强版）
app.get('/health', (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    services: {
      database: database.db ? 'connected' : 'disconnected',
      websocket: mainService?.socketService ? 'running' : 'not_running',
      eventListener: mainService?.eventListener?.isListening ? 'listening' : 'not_listening',
      web3: mainService?.web3Manager ? 'connected' : 'not_connected'
    }
  };

  // 检查是否有服务异常
  const unhealthyServices = Object.entries(health.services)
    .filter(([_, status]) => !['connected', 'running', 'listening'].includes(status))
    .map(([name]) => name);

  if (unhealthyServices.length > 0) {
    health.status = 'degraded';
    health.issues = unhealthyServices;
  }

  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
});

// 系统指标端点
app.get('/api/metrics', (req, res) => {
  const metrics = {
    timestamp: Date.now(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
    system: {}
  };

  if (mainService) {
    metrics.system = mainService.getStatus();
  }

  res.json({
    success: true,
    data: metrics
  });
});

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
    availableEndpoints: [
      '/api/auth',
      '/api/markets',
      '/api/trading',
      '/api/templates',
      '/api/resources',
      '/api/stats',
      '/api/settings',
      '/health',
      '/api/metrics',
      '/admin'
    ]
  });
});

// 全局错误处理
app.use((error, req, res, next) => {
  console.error('❌ Global Error Handler:', error);

  // WebSocket相关错误
  if (error.message && error.message.includes('WebSocket')) {
    return res.status(503).json({
      success: false,
      message: 'WebSocket service unavailable',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }

  // 区块链相关错误
  if (error.message && error.message.includes('blockchain')) {
    return res.status(503).json({
      success: false,
      message: 'Blockchain service unavailable',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }

  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && {
      stack: error.stack,
      details: error
    })
  });
});

// 优雅关闭处理
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

async function gracefulShutdown(signal) {
  console.log(`\n🔄 Received ${signal}, starting graceful shutdown...`);

  try {
    // 停止接受新连接
    server.close(async () => {
      console.log('🔌 HTTP server closed');

      // 关闭主服务
      if (mainService) {
        await mainService.shutdown();
        console.log('🎯 MainService shutdown completed');
      }

      // 关闭数据库连接
      if (database.db) {
        database.db.close();
        console.log('🗄️ Database connection closed');
      }

      console.log('✅ Graceful shutdown completed');
      process.exit(0);
    });

    // 超时强制退出
    setTimeout(() => {
      console.error('❌ Forced shutdown due to timeout');
      process.exit(1);
    }, 10000);

  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
}

// 启动服务器
async function startServer() {
  try {
    console.log('🚀 Starting OddsMarket Enhanced Server...');
    console.log('=====================================');

    // 1. 初始化数据库
    console.log('📊 Initializing database...');
    await database.init();
    console.log('✅ Database initialized successfully');

    // 2. 初始化主服务
    console.log('🎯 Initializing main services...');
    mainService = new MainService(database, server, {
      enableWebSocket: process.env.ENABLE_WEBSOCKET !== 'false',
      enableEventListener: process.env.ENABLE_EVENT_LISTENER !== 'false',
      chainId: parseInt(process.env.CHAIN_ID) || 97
    });

    // 3. 添加交易路由（需要mainService初始化后）
    app.use('/api/trading', initTradingRoutes(
      mainService.web3Manager,
      database,
      mainService.socketService
    ));
    console.log('💰 Trading routes initialized');

    // 4. 启动所有服务
    await mainService.start();
    console.log('✅ All services started successfully');

    // 5. 启动HTTP服务器
    server.listen(PORT, () => {
      console.log('=====================================');
      console.log('🎉 OddsMarket Enhanced Server Started!');
      console.log('=====================================');
      console.log(`📍 Port: ${PORT}`);
      console.log(`🌐 Admin Panel: http://localhost:${PORT}/admin`);
      console.log(`🔗 API Docs: http://localhost:${PORT}/api/docs`);
      console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
      console.log(`📊 Metrics: http://localhost:${PORT}/api/metrics`);
      console.log(`🔌 WebSocket: ws://localhost:${PORT}`);
      console.log('=====================================');

      const services = mainService.getStatus();
      console.log('🎯 Active Services:');
      Object.entries(services.services).forEach(([name, data]) => {
        console.log(`   - ${name}: ${data.status} (${Math.floor(data.uptime/1000)}s)`);
      });

      console.log('=====================================');
      console.log('🚀 Ready for trading! 🚀');
    });

    // 服务事件监听
    mainService.on('service:started', (data) => {
      console.log('🎉 Service started:', data);
    });

    mainService.on('health:warning', (data) => {
      console.warn('⚠️ Health warning:', data.unhealthyServices);
    });

    mainService.on('user:activity', (data) => {
      if (process.env.LOG_USER_ACTIVITY === 'true') {
        console.log(`👤 User activity: ${data.type} - ${data.userId}`);
      }
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);

    // 清理已启动的服务
    if (mainService) {
      try {
        await mainService.shutdown();
      } catch (cleanupError) {
        console.error('❌ Error during cleanup:', cleanupError);
      }
    }

    process.exit(1);
  }
}

// 启动服务器
startServer();

module.exports = { app, server, database, mainService };
