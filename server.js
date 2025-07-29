const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(helmet());
// CORS配置 - 支持开发和生产环境
const corsOptions = {
  origin: function (origin, callback) {
    // 允许的域名
    const allowedOrigins = [
      'http://localhost:3000',      // 前端开发环境
      'http://localhost:3001',      // 后端开发环境
      'https://localhost:3000',     // HTTPS开发环境
      'https://localhost:3001',     // HTTPS开发环境
    ];

    // 如果设置了生产环境域名
    if (process.env.FRONTEND_URL) {
      allowedOrigins.push(process.env.FRONTEND_URL);
    }
    if (process.env.ADMIN_URL) {
      allowedOrigins.push(process.env.ADMIN_URL);
    }
    
    // 支持环境变量中的多个允许域名
    if (process.env.ALLOWED_ORIGINS) {
      const envOrigins = process.env.ALLOWED_ORIGINS.split(',');
      allowedOrigins.push(...envOrigins);
    }

    // 开发环境允许所有localhost域名
    if (process.env.NODE_ENV === 'development') {
      if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1')) {
        return callback(null, true);
      }
    }

    // 允许来自同一域名的请求（管理后台）
    if (!origin) {
      // 同源请求（如从 /admin 访问 /api）
      return callback(null, true);
    }
    
    // 如果请求来自Railway域名本身
    if (origin.includes('railway.app')) {
      return callback(null, true);
    }
    
    // 检查是否在允许列表中
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`🚫 CORS阻止了来自 ${origin} 的请求`);
      console.warn(`允许的域名列表:`, allowedOrigins);
      callback(new Error('不允许的CORS请求'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 静态文件服务 - 提供球队logo等资源
app.use('/static', express.static(path.join(__dirname, 'public')));

// 数据库初始化
const Database = require('./src/database/Database');
const DatabaseExtensions = require('./src/database/DatabaseExtensions');
const database = new Database();

// 使数据库实例全局可用
app.locals.db = database;

// 路由
const authRoutes = require('./src/routes/auth');
const marketsRoutes = require('./src/routes/markets');
const resourcesRoutes = require('./src/routes/resources');
const templatesRoutes = require('./src/routes/templates');
const statsRoutes = require('./src/routes/stats');
const settingsRoutes = require('./src/routes/settings');
const hotspotsRoutes = require('./src/routes/hotspots');
const { initTradingRoutes } = require('./src/routes/trading');

app.use('/api/auth', authRoutes);
app.use('/api/markets', marketsRoutes);
app.use('/api/resources', resourcesRoutes);
app.use('/api/templates', templatesRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/hotspots', hotspotsRoutes);

// 钱包签名市场创建路由
const walletMarketsRoutes = require('./src/routes/walletMarkets');
app.use('/api/wallet-markets', walletMarketsRoutes);

// 初始化交易路由（需要web3Manager和database）
// TODO: 需要web3Manager和socketService实例
// app.use('/api/trading', initTradingRoutes(web3Manager, database, socketService));

// 管理后台静态页面
app.use('/admin', express.static(path.join(__dirname, 'admin-ui/build')));
app.get('/admin/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin-ui/build/index.html'));
});

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    database: database.isConnected() ? 'connected' : 'disconnected'
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    database: database.isConnected() ? 'connected' : 'disconnected'
  });
});

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl
  });
});

// 错误处理中间件
app.use((error, req, res, next) => {
  console.error('Error:', error);
  
  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// 启动服务器
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 OddsMarket管理后端启动成功`);
  console.log(`📍 端口: ${PORT}`);
  console.log(`🌐 管理后台: http://localhost:${PORT}/admin`);
  console.log(`🔗 API文档: http://localhost:${PORT}/api/docs`);
  
  // 初始化数据库
  try {
    await database.init();
    console.log('✅ 数据库初始化成功');
    
    // 运行热点功能数据库迁移
    const HotspotMigration = require('./migrations/001_add_hotspot_fields');
    const migration = new HotspotMigration(database.db);
    await migration.up();
    
    // 初始化数据库扩展
    const dbExtensions = new DatabaseExtensions(database);
    app.set('dbExtensions', dbExtensions);
    console.log('✅ 数据库扩展初始化成功');
    
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error.message);
  }

  // 异步初始化Web3Manager (不阻塞应用启动)
  setTimeout(async () => {
    try {
      const Web3Manager = require('./src/utils/web3Manager');
      const web3Manager = new Web3Manager();
      app.set('web3Manager', web3Manager);
    } catch (error) {
      console.warn('⚠️ Web3Manager初始化失败，但应用继续运行:', error.message);
    }
  }, 1000);
});

// 优雅关闭
process.on('SIGINT', async () => {
  console.log('\n⏹️  正在关闭服务器...');
  try {
    await database.close();
    console.log('✅ 数据库连接已关闭');
    process.exit(0);
  } catch (error) {
    console.error('❌ 关闭过程中出错:', error.message);
    process.exit(1);
  }
});

module.exports = app;
