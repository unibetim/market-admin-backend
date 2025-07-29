/**
 * 🚀 OddsMarket WebSocket 实时推送服务
 * 世界顶级架构设计 - 企业级实时通信系统
 * 
 * 功能特性:
 * - 房间管理 (按市场分组)
 * - 用户认证和权限控制
 * - 事件类型管理
 * - 智能订阅系统
 * - 批量数据推送
 * - 连接状态监控
 * 
 * @author 世界顶级全栈工程师
 * @version 1.0.0
 */

const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const EventEmitter = require('eventemitter3');
const _ = require('lodash');
const moment = require('moment');

/**
 * WebSocket 事件类型定义
 */
const SOCKET_EVENTS = {
  // 连接事件
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',
  ERROR: 'error',
  
  // 认证事件
  AUTHENTICATE: 'authenticate',
  AUTHENTICATION_SUCCESS: 'authentication:success',
  AUTHENTICATION_ERROR: 'authentication:error',
  
  // 订阅事件
  SUBSCRIBE_MARKET: 'subscribe:market',
  UNSUBSCRIBE_MARKET: 'unsubscribe:market',
  SUBSCRIBE_USER: 'subscribe:user',
  UNSUBSCRIBE_USER: 'unsubscribe:user',
  SUBSCRIBE_GLOBAL: 'subscribe:global',
  
  // 市场事件
  MARKET_CREATED: 'market:created',
  MARKET_UPDATED: 'market:updated',
  MARKET_CLOSED: 'market:closed',
  MARKET_RESOLVED: 'market:resolved',
  MARKET_CANCELLED: 'market:cancelled',
  
  // 价格事件
  PRICE_UPDATE: 'price:update',
  PRICE_BATCH_UPDATE: 'price:batch_update',
  
  // 交易事件
  SHARES_BOUGHT: 'trade:shares_bought',
  SHARES_SOLD: 'trade:shares_sold',
  LIQUIDITY_ADDED: 'liquidity:added',
  LIQUIDITY_REMOVED: 'liquidity:removed',
  
  // 用户事件
  USER_POSITION_UPDATE: 'user:position_update',
  USER_BALANCE_UPDATE: 'user:balance_update',
  USER_TRANSACTION: 'user:transaction',
  
  // 系统事件
  SYSTEM_ANNOUNCEMENT: 'system:announcement',
  SYSTEM_MAINTENANCE: 'system:maintenance'
};

/**
 * 房间类型定义
 */
const ROOM_TYPES = {
  MARKET: 'market',
  USER: 'user', 
  GLOBAL: 'global',
  ADMIN: 'admin'
};

/**
 * 用户权限级别
 */
const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  GUEST: 'guest'
};

class SocketService extends EventEmitter {
  constructor(server, options = {}) {
    super();
    
    // 配置选项
    this.options = {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
      },
      pingTimeout: 60000,
      pingInterval: 25000,
      maxHttpBufferSize: 1e6, // 1MB
      ...options
    };
    
    // 初始化 Socket.IO 服务器
    this.io = new Server(server, this.options);
    
    // 连接管理
    this.connections = new Map(); // socketId -> connection info
    this.userSockets = new Map();  // userId -> Set of socketIds
    this.marketRooms = new Map();  // marketId -> Set of socketIds
    
    // 统计信息
    this.stats = {
      totalConnections: 0,
      currentConnections: 0,
      messagesPerSecond: 0,
      lastMessageCount: 0,
      startTime: Date.now()
    };
    
    // 消息队列 (批量发送优化)
    this.messageQueue = new Map();
    this.queueFlushInterval = 100; // 100ms 批量发送
    
    this.init();
  }

  /**
   * 初始化 WebSocket 服务
   */
  init() {
    console.log('🚀 Initializing OddsMarket WebSocket Service...');
    
    // 认证中间件
    this.io.use(this.authMiddleware.bind(this));
    
    // 连接处理
    this.io.on(SOCKET_EVENTS.CONNECTION, this.handleConnection.bind(this));
    
    // 启动批量消息发送定时器
    this.startMessageQueue();
    
    // 启动统计监控
    this.startStatsMonitoring();
    
    console.log('✅ WebSocket Service initialized successfully');
    
    // 发出服务启动事件
    this.emit('service:started', {
      timestamp: Date.now(),
      port: this.options.port || 'inherited'
    });
  }

  /**
   * JWT 认证中间件
   */
  async authMiddleware(socket, next) {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization;
      
      if (!token) {
        // 允许匿名连接，但权限受限
        socket.user = {
          id: `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          role: USER_ROLES.GUEST,
          authenticated: false
        };
        return next();
      }

      // 验证 JWT token
      const decoded = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET);
      
      socket.user = {
        id: decoded.userId || decoded.id,
        role: decoded.role || USER_ROLES.USER,
        authenticated: true,
        ...decoded
      };
      
      next();
    } catch (error) {
      console.error('WebSocket authentication failed:', error);
      next(new Error('Authentication failed'));
    }
  }

  /**
   * 处理新连接
   */
  handleConnection(socket) {
    const user = socket.user;
    const connectionInfo = {
      socketId: socket.id,
      userId: user.id,
      userRole: user.role,
      authenticated: user.authenticated,
      connectedAt: Date.now(),
      subscriptions: new Set(),
      lastActivity: Date.now()
    };

    // 存储连接信息
    this.connections.set(socket.id, connectionInfo);
    
    // 用户连接映射
    if (!this.userSockets.has(user.id)) {
      this.userSockets.set(user.id, new Set());
    }
    this.userSockets.get(user.id).add(socket.id);
    
    // 更新统计
    this.stats.totalConnections++;
    this.stats.currentConnections++;
    
    console.log(`🔗 New connection: ${socket.id} (User: ${user.id}, Role: ${user.role})`);
    
    // 注册事件处理器
    this.registerEventHandlers(socket);
    
    // 发送连接成功消息
    socket.emit(SOCKET_EVENTS.AUTHENTICATION_SUCCESS, {
      userId: user.id,
      role: user.role,
      authenticated: user.authenticated,
      serverTime: Date.now()
    });
    
    // 如果是认证用户，自动加入用户专属房间
    if (user.authenticated) {
      socket.join(`${ROOM_TYPES.USER}:${user.id}`);
      console.log(`👤 User ${user.id} joined personal room`);
    }
    
    // 发出连接事件
    this.emit('user:connected', {
      socketId: socket.id,
      userId: user.id,
      authenticated: user.authenticated
    });
  }

  /**
   * 注册Socket事件处理器
   */
  registerEventHandlers(socket) {
    // 断开连接
    socket.on(SOCKET_EVENTS.DISCONNECT, (reason) => {
      this.handleDisconnection(socket, reason);
    });

    // 订阅市场
    socket.on(SOCKET_EVENTS.SUBSCRIBE_MARKET, (data) => {
      this.handleMarketSubscription(socket, data);
    });

    // 取消订阅市场
    socket.on(SOCKET_EVENTS.UNSUBSCRIBE_MARKET, (data) => {
      this.handleMarketUnsubscription(socket, data);
    });

    // 全局订阅
    socket.on(SOCKET_EVENTS.SUBSCRIBE_GLOBAL, () => {
      this.handleGlobalSubscription(socket);
    });

    // 用户订阅 (仅认证用户)
    socket.on(SOCKET_EVENTS.SUBSCRIBE_USER, (data) => {
      this.handleUserSubscription(socket, data);
    });

    // 错误处理
    socket.on(SOCKET_EVENTS.ERROR, (error) => {
      console.error(`Socket error from ${socket.id}:`, error);
    });

    // 更新活动时间
    socket.use((packet, next) => {
      const connection = this.connections.get(socket.id);
      if (connection) {
        connection.lastActivity = Date.now();
      }
      next();
    });
  }

  /**
   * 处理市场订阅
   */
  handleMarketSubscription(socket, data) {
    try {
      const { marketId } = data;
      
      if (!marketId) {
        socket.emit(SOCKET_EVENTS.ERROR, { message: 'Market ID is required' });
        return;
      }

      const roomName = `${ROOM_TYPES.MARKET}:${marketId}`;
      
      // 加入市场房间
      socket.join(roomName);
      
      // 更新连接信息
      const connection = this.connections.get(socket.id);
      if (connection) {
        connection.subscriptions.add(roomName);
      }
      
      // 更新市场房间映射
      if (!this.marketRooms.has(marketId)) {
        this.marketRooms.set(marketId, new Set());
      }
      this.marketRooms.get(marketId).add(socket.id);
      
      console.log(`📊 Socket ${socket.id} subscribed to market ${marketId}`);
      
      // 发送订阅成功确认
      socket.emit('subscription:success', {
        type: ROOM_TYPES.MARKET,
        marketId,
        timestamp: Date.now()
      });
      
      // 立即发送当前市场数据
      this.sendMarketSnapshot(socket, marketId);
      
    } catch (error) {
      console.error('Market subscription error:', error);
      socket.emit(SOCKET_EVENTS.ERROR, { 
        message: 'Failed to subscribe to market',
        error: error.message 
      });
    }
  }

  /**
   * 处理市场取消订阅
   */
  handleMarketUnsubscription(socket, data) {
    try {
      const { marketId } = data;
      const roomName = `${ROOM_TYPES.MARKET}:${marketId}`;
      
      // 离开房间
      socket.leave(roomName);
      
      // 更新连接信息
      const connection = this.connections.get(socket.id);
      if (connection) {
        connection.subscriptions.delete(roomName);
      }
      
      // 更新市场房间映射
      if (this.marketRooms.has(marketId)) {
        this.marketRooms.get(marketId).delete(socket.id);
        if (this.marketRooms.get(marketId).size === 0) {
          this.marketRooms.delete(marketId);
        }
      }
      
      console.log(`📊 Socket ${socket.id} unsubscribed from market ${marketId}`);
      
      socket.emit('unsubscription:success', {
        type: ROOM_TYPES.MARKET,
        marketId,
        timestamp: Date.now()
      });
      
    } catch (error) {
      console.error('Market unsubscription error:', error);
      socket.emit(SOCKET_EVENTS.ERROR, { 
        message: 'Failed to unsubscribe from market',
        error: error.message 
      });
    }
  }

  /**
   * 处理全局订阅
   */
  handleGlobalSubscription(socket) {
    const roomName = ROOM_TYPES.GLOBAL;
    
    socket.join(roomName);
    
    const connection = this.connections.get(socket.id);
    if (connection) {
      connection.subscriptions.add(roomName);
    }
    
    console.log(`🌍 Socket ${socket.id} subscribed to global events`);
    
    socket.emit('subscription:success', {
      type: ROOM_TYPES.GLOBAL,
      timestamp: Date.now()
    });
  }

  /**
   * 处理用户订阅 (仅认证用户)
   */
  handleUserSubscription(socket, data) {
    const user = socket.user;
    
    if (!user.authenticated) {
      socket.emit(SOCKET_EVENTS.ERROR, { 
        message: 'Authentication required for user subscription' 
      });
      return;
    }
    
    const { userId } = data;
    
    // 用户只能订阅自己的数据，除非是管理员
    if (userId !== user.id && user.role !== USER_ROLES.ADMIN) {
      socket.emit(SOCKET_EVENTS.ERROR, { 
        message: 'Permission denied' 
      });
      return;
    }
    
    const roomName = `${ROOM_TYPES.USER}:${userId}`;
    socket.join(roomName);
    
    const connection = this.connections.get(socket.id);
    if (connection) {
      connection.subscriptions.add(roomName);
    }
    
    console.log(`👤 Socket ${socket.id} subscribed to user ${userId} events`);
    
    socket.emit('subscription:success', {
      type: ROOM_TYPES.USER,
      userId,
      timestamp: Date.now()
    });
  }

  /**
   * 处理连接断开
   */
  handleDisconnection(socket, reason) {
    const connection = this.connections.get(socket.id);
    
    if (connection) {
      const { userId } = connection;
      
      // 清理用户连接映射
      if (this.userSockets.has(userId)) {
        this.userSockets.get(userId).delete(socket.id);
        if (this.userSockets.get(userId).size === 0) {
          this.userSockets.delete(userId);
        }
      }
      
      // 清理市场房间映射
      for (const [marketId, socketIds] of this.marketRooms.entries()) {
        socketIds.delete(socket.id);
        if (socketIds.size === 0) {
          this.marketRooms.delete(marketId);
        }
      }
      
      // 删除连接信息
      this.connections.delete(socket.id);
      
      // 更新统计
      this.stats.currentConnections--;
      
      console.log(`🔌 Connection closed: ${socket.id} (User: ${userId}, Reason: ${reason})`);
      
      // 发出断开连接事件
      this.emit('user:disconnected', {
        socketId: socket.id,
        userId,
        reason,
        duration: Date.now() - connection.connectedAt
      });
    }
  }

  /**
   * 发送市场快照数据
   */
  async sendMarketSnapshot(socket, marketId) {
    try {
      // 这里应该调用数据库或缓存获取市场当前状态
      // 暂时发送模拟数据
      const marketData = {
        marketId,
        prices: [0.6, 0.4], // 示例价格
        totalVolume: '1000.5',
        lastUpdate: Date.now()
      };
      
      socket.emit(SOCKET_EVENTS.PRICE_UPDATE, marketData);
    } catch (error) {
      console.error('Failed to send market snapshot:', error);
    }
  }

  /**
   * 广播消息到市场房间
   */
  broadcastToMarket(marketId, event, data) {
    const roomName = `${ROOM_TYPES.MARKET}:${marketId}`;
    this.io.to(roomName).emit(event, {
      marketId,
      timestamp: Date.now(),
      ...data
    });
    
    console.log(`📡 Broadcast to market ${marketId}: ${event}`);
  }

  /**
   * 发送消息给特定用户
   */
  sendToUser(userId, event, data) {
    const roomName = `${ROOM_TYPES.USER}:${userId}`;
    this.io.to(roomName).emit(event, {
      userId,
      timestamp: Date.now(),
      ...data
    });
    
    console.log(`📤 Message to user ${userId}: ${event}`);
  }

  /**
   * 全局广播
   */
  broadcastGlobal(event, data) {
    this.io.to(ROOM_TYPES.GLOBAL).emit(event, {
      timestamp: Date.now(),
      ...data
    });
    
    console.log(`🌍 Global broadcast: ${event}`);
  }

  /**
   * 批量价格更新
   */
  broadcastPriceBatch(priceUpdates) {
    // 按市场分组
    const marketGroups = _.groupBy(priceUpdates, 'marketId');
    
    for (const [marketId, updates] of Object.entries(marketGroups)) {
      this.broadcastToMarket(marketId, SOCKET_EVENTS.PRICE_BATCH_UPDATE, {
        updates,
        count: updates.length
      });
    }
  }

  /**
   * 启动消息队列处理
   */
  startMessageQueue() {
    setInterval(() => {
      if (this.messageQueue.size > 0) {
        // 处理队列中的批量消息
        this.messageQueue.clear();
      }
    }, this.queueFlushInterval);
  }

  /**
   * 启动统计监控
   */
  startStatsMonitoring() {
    setInterval(() => {
      const now = Date.now();
      const runtime = now - this.stats.startTime;
      
      console.log(`📊 WebSocket Stats: ${this.stats.currentConnections} connections, ` +
                  `${this.stats.totalConnections} total, ` +
                  `runtime: ${Math.floor(runtime / 1000)}s`);
      
      // 重置消息计数
      this.stats.lastMessageCount = 0;
    }, 30000); // 每30秒打印一次统计
  }

  /**
   * 获取服务状态
   */
  getStatus() {
    return {
      ...this.stats,
      activeMarkets: this.marketRooms.size,
      activeUsers: this.userSockets.size,
      runtime: Date.now() - this.stats.startTime,
      memoryUsage: process.memoryUsage()
    };
  }

  /**
   * 关闭服务
   */
  async close() {
    console.log('🔄 Shutting down WebSocket service...');
    
    // 通知所有客户端服务即将关闭
    this.io.emit(SOCKET_EVENTS.SYSTEM_MAINTENANCE, {
      message: 'Server is shutting down',
      timestamp: Date.now()
    });
    
    // 等待消息发送完成
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 关闭所有连接
    this.io.close();
    
    console.log('✅ WebSocket service stopped');
    
    this.emit('service:stopped', {
      timestamp: Date.now(),
      finalStats: this.getStatus()
    });
  }
}

module.exports = {
  SocketService,
  SOCKET_EVENTS,
  ROOM_TYPES,
  USER_ROLES
};