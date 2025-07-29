/**
 * 🎯 OddsMarket 主服务集成器
 * 世界顶级系统架构 - 企业级微服务编排
 * 
 * 功能特性:
 * - WebSocket服务管理
 * - 区块链事件监听协调
 * - 数据库扩展集成
 * - 服务间通信
 * - 健康检查和监控
 * - 优雅关闭处理
 * - 错误恢复机制
 * 
 * @author 世界顶级系统架构师
 * @version 1.0.0
 */

const { EventEmitter } = require('events');
const { SocketService } = require('./SocketService');
const { BlockchainEventListener } = require('./BlockchainEventListener');
const DatabaseExtensions = require('../database/DatabaseExtensions');
const Web3Manager = require('../utils/web3Manager');

class MainService extends EventEmitter {
  constructor(database, httpServer, options = {}) {
    super();
    
    this.database = database;
    this.httpServer = httpServer;
    this.options = {
      enableWebSocket: process.env.ENABLE_WEBSOCKET !== 'false',
      enableEventListener: process.env.ENABLE_EVENT_LISTENER !== 'false',
      chainId: parseInt(process.env.CHAIN_ID) || 97,
      startBlock: options.startBlock || 'latest',
      ...options
    };
    
    // 服务实例
    this.web3Manager = null;
    this.socketService = null;
    this.eventListener = null;
    this.databaseExtensions = null;
    
    // 状态管理
    this.isInitialized = false;
    this.isRunning = false;
    this.services = new Map();
    this.healthChecks = new Map();
    
    // 统计信息
    this.stats = {
      startTime: null,
      uptime: 0,
      servicesStatus: {},
      lastHealthCheck: null
    };
    
    console.log('🎯 MainService created with options:', this.options);
  }

  /**
   * 初始化所有服务
   */
  async initialize() {
    try {
      console.log('🚀 Initializing OddsMarket MainService...');
      
      if (this.isInitialized) {
        console.warn('⚠️ MainService already initialized');
        return;
      }
      
      // 1. 初始化数据库扩展
      await this.initializeDatabaseExtensions();
      
      // 2. 初始化Web3管理器
      await this.initializeWeb3Manager();
      
      // 3. 初始化WebSocket服务
      if (this.options.enableWebSocket) {
        await this.initializeSocketService();
      }
      
      // 4. 初始化区块链事件监听器
      if (this.options.enableEventListener) {
        await this.initializeEventListener();
      }
      
      // 5. 设置服务间通信
      this.setupServiceCommunication();
      
      // 6. 启动健康检查
      this.startHealthChecks();
      
      this.isInitialized = true;
      this.stats.startTime = Date.now();
      
      console.log('✅ MainService initialized successfully');
      this.emit('service:initialized');
      
    } catch (error) {
      console.error('❌ Failed to initialize MainService:', error);
      await this.cleanup();
      throw error;
    }
  }

  /**
   * 初始化数据库扩展
   */
  async initializeDatabaseExtensions() {
    try {
      console.log('🗄️ Initializing database extensions...');
      
      this.databaseExtensions = new DatabaseExtensions(this.database);
      await this.databaseExtensions.createBlockchainTables();
      
      // 将扩展添加到数据库实例
      this.database.extensions = this.databaseExtensions;
      
      this.services.set('database', {
        instance: this.databaseExtensions,
        status: 'running',
        startTime: Date.now()
      });
      
      console.log('✅ Database extensions initialized');
      
    } catch (error) {
      console.error('❌ Failed to initialize database extensions:', error);
      throw error;
    }
  }

  /**
   * 初始化Web3管理器
   */
  async initializeWeb3Manager() {
    try {
      console.log('🌐 Initializing Web3 Manager...');
      
      this.web3Manager = new Web3Manager();
      await this.web3Manager.init();
      
      this.services.set('web3', {
        instance: this.web3Manager,
        status: 'running',
        startTime: Date.now()
      });
      
      console.log('✅ Web3 Manager initialized');
      
    } catch (error) {
      console.error('❌ Failed to initialize Web3 Manager:', error);
      throw error;
    }
  }

  /**
   * 初始化WebSocket服务
   */
  async initializeSocketService() {
    try {
      console.log('🔌 Initializing WebSocket Service...');
      
      this.socketService = new SocketService(this.httpServer, {
        cors: {
          origin: process.env.FRONTEND_URL || "http://localhost:3000",
          methods: ["GET", "POST"],
          credentials: true
        }
      });
      
      // 设置事件监听
      this.socketService.on('service:started', (data) => {
        console.log('🎉 WebSocket Service started:', data);
      });
      
      this.socketService.on('user:connected', (data) => {
        console.log(`👤 User connected: ${data.userId} (${data.socketId})`);
      });
      
      this.socketService.on('user:disconnected', (data) => {
        console.log(`👋 User disconnected: ${data.userId} (Duration: ${data.duration}ms)`);
      });
      
      this.services.set('websocket', {
        instance: this.socketService,
        status: 'running',
        startTime: Date.now()
      });
      
      console.log('✅ WebSocket Service initialized');
      
    } catch (error) {
      console.error('❌ Failed to initialize WebSocket Service:', error);
      throw error;
    }
  }

  /**
   * 初始化区块链事件监听器
   */
  async initializeEventListener() {
    try {
      console.log('🎯 Initializing Blockchain Event Listener...');
      
      this.eventListener = new BlockchainEventListener(
        this.web3Manager,
        this.database,
        this.socketService,
        {
          chainId: this.options.chainId,
          startBlock: this.options.startBlock,
          confirmations: 3,
          maxRetries: 5,
          batchSize: 50
        }
      );
      
      // 设置事件监听
      this.eventListener.on('listener:initialized', (data) => {
        console.log('🎉 Event Listener initialized:', data);
      });
      
      this.eventListener.on('event:processed', (eventData) => {
        console.log(`✅ Event processed: ${eventData.name} (${eventData.id})`);
      });
      
      this.eventListener.on('block:new', (data) => {
        console.log(`📦 New block: ${data.blockNumber}`);
      });
      
      this.services.set('eventListener', {
        instance: this.eventListener,
        status: 'initialized',
        startTime: Date.now()
      });
      
      console.log('✅ Blockchain Event Listener initialized');
      
    } catch (error) {
      console.error('❌ Failed to initialize Blockchain Event Listener:', error);
      throw error;
    }
  }

  /**
   * 设置服务间通信
   */
  setupServiceCommunication() {
    console.log('🔗 Setting up service communication...');
    
    // WebSocket <-> Event Listener 通信
    if (this.socketService && this.eventListener) {
      // 事件监听器向WebSocket发送实时更新
      this.eventListener.on('event:processed', (eventData) => {
        if (this.socketService && eventData.isRealtime) {
          this.broadcastEventToWebSocket(eventData);
        }
      });
      
      // WebSocket状态变化通知
      this.socketService.on('user:connected', (data) => {
        this.emit('user:activity', { type: 'connect', ...data });
      });
      
      this.socketService.on('user:disconnected', (data) => {
        this.emit('user:activity', { type: 'disconnect', ...data });
      });
    }
    
    // 数据库 <-> 其他服务通信
    if (this.database) {
      this.on('data:updated', async (data) => {
        // 数据更新时通知相关服务
        if (this.socketService) {
          this.socketService.broadcastGlobal('data:updated', data);
        }
      });
    }
    
    console.log('✅ Service communication setup completed');
  }

  /**
   * 启动所有服务
   */
  async start() {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }
      
      if (this.isRunning) {
        console.warn('⚠️ MainService already running');
        return;
      }
      
      console.log('🚀 Starting all services...');
      
      // 启动区块链事件监听器
      if (this.eventListener) {
        await this.eventListener.startListening();
        this.services.get('eventListener').status = 'running';
      }
      
      this.isRunning = true;
      
      console.log('✅ All services started successfully');
      this.emit('service:started', {
        timestamp: Date.now(),
        services: Array.from(this.services.keys())
      });
      
    } catch (error) {
      console.error('❌ Failed to start services:', error);
      throw error;
    }
  }

  /**
   * 广播事件到WebSocket
   */
  broadcastEventToWebSocket(eventData) {
    try {
      const { name, args, marketId } = eventData;
      
      switch (name) {
        case 'MarketCreated':
          this.socketService.broadcastGlobal('market:created', {
            marketId: args[0].toString(),
            creator: args[1],
            description: args[2]
          });
          break;
          
        case 'SharesBought':
        case 'SharesSold':
          const actionType = name === 'SharesBought' ? 'bought' : 'sold';
          this.socketService.broadcastToMarket(args[0].toString(), `trade:shares_${actionType}`, {
            user: args[1],
            outcome: args[2].toNumber(),
            shares: args[3].toString(),
            amount: args[4].toString()
          });
          break;
          
        case 'LiquidityAdded':
        case 'LiquidityRemoved':
          const liquidityAction = name === 'LiquidityAdded' ? 'added' : 'removed';
          this.socketService.broadcastToMarket(args[0].toString(), `liquidity:${liquidityAction}`, {
            provider: args[1],
            amount: args[2].toString()
          });
          break;
          
        case 'MarketResolved':
          this.socketService.broadcastToMarket(args[0].toString(), 'market:resolved', {
            winningOutcome: args[1].toNumber(),
            finalizeTime: args[2].toNumber()
          });
          break;
      }
      
    } catch (error) {
      console.error('Failed to broadcast event to WebSocket:', error);
    }
  }

  /**
   * 启动健康检查
   */
  startHealthChecks() {
    console.log('🏥 Starting health checks...');
    
    // 每30秒检查一次服务健康状态
    setInterval(async () => {
      await this.performHealthCheck();
    }, 30000);
    
    // 每5分钟打印统计信息
    setInterval(() => {
      this.printStats();
    }, 300000);
  }

  /**
   * 执行健康检查
   */
  async performHealthCheck() {
    try {
      const healthStatus = {};
      
      for (const [serviceName, serviceData] of this.services.entries()) {
        try {
          let isHealthy = true;
          let details = {};
          
          switch (serviceName) {
            case 'websocket':
              const wsStatus = this.socketService.getStatus();
              isHealthy = wsStatus.currentConnections >= 0;
              details = wsStatus;
              break;
              
            case 'eventListener':
              const listenerStats = this.eventListener.getStats();
              isHealthy = this.eventListener.isListening && listenerStats.totalEvents >= 0;
              details = listenerStats;
              break;
              
            case 'web3':
              const networkStatus = await this.web3Manager.getNetworkStatus(this.options.chainId);
              isHealthy = networkStatus.connected;
              details = networkStatus;
              break;
              
            case 'database':
              // 简单的数据库连接检查
              isHealthy = this.database.db !== null;
              details = { connected: isHealthy };
              break;
          }
          
          healthStatus[serviceName] = {
            healthy: isHealthy,
            uptime: Date.now() - serviceData.startTime,
            details
          };
          
        } catch (error) {
          healthStatus[serviceName] = {
            healthy: false,
            error: error.message,
            uptime: Date.now() - serviceData.startTime
          };
        }
      }
      
      this.stats.servicesStatus = healthStatus;
      this.stats.lastHealthCheck = Date.now();
      
      // 检查是否有不健康的服务
      const unhealthyServices = Object.entries(healthStatus)
        .filter(([_, status]) => !status.healthy)
        .map(([name]) => name);
      
      if (unhealthyServices.length > 0) {
        console.warn(`⚠️ Unhealthy services detected: ${unhealthyServices.join(', ')}`);
        this.emit('health:warning', { unhealthyServices, healthStatus });
      }
      
    } catch (error) {
      console.error('Health check failed:', error);
    }
  }

  /**
   * 打印统计信息
   */
  printStats() {
    if (this.stats.startTime) {
      this.stats.uptime = Date.now() - this.stats.startTime;
      const uptimeHours = Math.floor(this.stats.uptime / (1000 * 60 * 60));
      const uptimeMinutes = Math.floor((this.stats.uptime % (1000 * 60 * 60)) / (1000 * 60));
      
      console.log(`📊 MainService Stats - Uptime: ${uptimeHours}h ${uptimeMinutes}m`);
      console.log(`   Services: ${Array.from(this.services.keys()).join(', ')}`);
      
      if (this.socketService) {
        const wsStats = this.socketService.getStatus();
        console.log(`   WebSocket: ${wsStats.currentConnections} connections`);
      }
      
      if (this.eventListener) {
        const eventStats = this.eventListener.getStats();
        console.log(`   Events: ${eventStats.processedEvents} processed, ${eventStats.queueLength} queued`);
      }
    }
  }

  /**
   * 获取服务状态
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      isRunning: this.isRunning,
      services: Object.fromEntries(
        Array.from(this.services.entries()).map(([name, data]) => [
          name,
          {
            status: data.status,
            uptime: Date.now() - data.startTime
          }
        ])
      ),
      stats: this.stats,
      options: this.options
    };
  }

  /**
   * 优雅关闭
   */
  async shutdown() {
    try {
      console.log('🔄 Shutting down MainService...');
      
      this.isRunning = false;
      
      // 关闭事件监听器
      if (this.eventListener) {
        await this.eventListener.close();
        console.log('✅ Event Listener closed');
      }
      
      // 关闭WebSocket服务
      if (this.socketService) {
        await this.socketService.close();
        console.log('✅ WebSocket Service closed');
      }
      
      // 清理资源
      await this.cleanup();
      
      console.log('✅ MainService shutdown completed');
      this.emit('service:shutdown');
      
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
      throw error;
    }
  }

  /**
   * 清理资源
   */
  async cleanup() {
    try {
      // 移除所有监听器
      this.removeAllListeners();
      
      // 清理服务引用
      this.services.clear();
      this.healthChecks.clear();
      
      // 重置状态
      this.isInitialized = false;
      this.isRunning = false;
      
      console.log('🧹 MainService cleanup completed');
      
    } catch (error) {
      console.error('❌ Error during cleanup:', error);
    }
  }

  /**
   * 重启服务
   */
  async restart() {
    console.log('🔄 Restarting MainService...');
    
    await this.shutdown();
    await new Promise(resolve => setTimeout(resolve, 2000)); // 等待2秒
    await this.start();
    
    console.log('✅ MainService restarted successfully');
  }
}

module.exports = MainService;