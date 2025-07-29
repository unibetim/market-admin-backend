/**
 * 🎯 OddsMarket 区块链事件监听服务
 * 世界顶级架构设计 - 企业级链上数据同步系统
 * 
 * 功能特性:
 * - 实时合约事件监听
 * - 智能重试和错误恢复
 * - 事件去重和验证
 * - 批量数据处理
 * - 断线重连机制
 * - 历史事件追溯
 * - 数据库自动同步
 * 
 * @author 世界顶级区块链工程师
 * @version 1.0.0
 */

const { ethers } = require('ethers');
const EventEmitter = require('eventemitter3');
const _ = require('lodash');
const moment = require('moment');
const cron = require('node-cron');

/**
 * 智能合约事件类型定义
 */
const CONTRACT_EVENTS = {
  // 市场相关事件
  MarketCreated: {
    name: 'MarketCreated',
    signature: 'MarketCreated(uint256,address,string,uint256,address)',
    priority: 'high',
    realtime: true
  },
  MarketClosed: {
    name: 'MarketClosed', 
    signature: 'MarketClosed(uint256,uint256)',
    priority: 'high',
    realtime: true
  },
  MarketResolved: {
    name: 'MarketResolved',
    signature: 'MarketResolved(uint256,uint8,uint256)', 
    priority: 'high',
    realtime: true
  },
  
  // 交易相关事件
  SharesBought: {
    name: 'SharesBought',
    signature: 'SharesBought(uint256,address,uint8,uint256,uint256,uint256)',
    priority: 'high',
    realtime: true
  },
  SharesSold: {
    name: 'SharesSold', 
    signature: 'SharesSold(uint256,address,uint8,uint256,uint256,uint256)',
    priority: 'high',
    realtime: true
  },
  
  // 流动性相关事件
  LiquidityAdded: {
    name: 'LiquidityAdded',
    signature: 'LiquidityAdded(uint256,address,uint256,uint256)',
    priority: 'medium',
    realtime: true
  },
  LiquidityRemoved: {
    name: 'LiquidityRemoved',
    signature: 'LiquidityRemoved(uint256,address,uint256,uint256)', 
    priority: 'medium',
    realtime: true
  },
  
  // 结果相关事件
  ResultProposed: {
    name: 'ResultProposed',
    signature: 'ResultProposed(uint256,address,uint8,uint256)',
    priority: 'medium',
    realtime: false
  },
  ResultFinalized: {
    name: 'ResultFinalized',
    signature: 'ResultFinalized(uint256,uint8,uint256)',
    priority: 'high',
    realtime: true
  },
  
  // 奖金相关事件
  WinningsClaimed: {
    name: 'WinningsClaimed',
    signature: 'WinningsClaimed(uint256,address,uint256,uint256)',
    priority: 'medium', 
    realtime: false
  }
};

/**
 * 事件处理状态
 */
const EVENT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing', 
  COMPLETED: 'completed',
  FAILED: 'failed',
  DUPLICATE: 'duplicate'
};

class BlockchainEventListener extends EventEmitter {
  constructor(web3Manager, database, socketService, options = {}) {
    super();
    
    this.web3Manager = web3Manager;
    this.database = database;
    this.socketService = socketService;
    
    // 配置选项
    this.options = {
      // 监听配置
      chainId: parseInt(process.env.CHAIN_ID) || 97,
      startBlock: options.startBlock || 'latest',
      confirmations: options.confirmations || 3,
      
      // 重试配置
      maxRetries: options.maxRetries || 5,
      retryDelay: options.retryDelay || 2000,
      
      // 批处理配置
      batchSize: options.batchSize || 100,
      batchInterval: options.batchInterval || 5000,
      
      // 性能配置
      maxConcurrentEvents: options.maxConcurrentEvents || 10,
      eventCacheSize: options.eventCacheSize || 1000,
      
      ...options
    };
    
    // 状态管理
    this.isListening = false;
    this.lastProcessedBlock = null;
    this.eventCache = new Map(); // 事件去重缓存
    this.processingQueue = []; // 待处理事件队列
    this.failedEvents = new Map(); // 失败事件记录
    
    // 统计信息
    this.stats = {
      totalEvents: 0,
      processedEvents: 0,
      failedEvents: 0,
      duplicateEvents: 0,
      eventsPerSecond: 0,
      lastEventTime: null,
      startTime: Date.now()
    };
    
    // 合约实例和过滤器
    this.contract = null;
    this.eventFilters = new Map();
    this.provider = null;
    
    this.init();
  }

  /**
   * 初始化事件监听器
   */
  async init() {
    try {
      console.log('🎯 Initializing Blockchain Event Listener...');
      
      await this.setupProvider();
      await this.setupContract();
      await this.setupEventFilters();
      await this.loadLastProcessedBlock();
      
      // 启动定时任务
      this.startPeriodicTasks();
      
      console.log('✅ Blockchain Event Listener initialized successfully');
      
      this.emit('listener:initialized', {
        chainId: this.options.chainId,
        contractAddress: this.contract?.address,
        startBlock: this.lastProcessedBlock
      });
      
    } catch (error) {
      console.error('❌ Failed to initialize Blockchain Event Listener:', error);
      throw error;
    }
  }

  /**
   * 设置区块链提供者
   */
  async setupProvider() {
    try {
      this.provider = this.web3Manager.providers.get(this.options.chainId);
      
      if (!this.provider) {
        throw new Error(`Provider not found for chain ${this.options.chainId}`);
      }
      
      // 测试连接
      const network = await this.provider.getNetwork();
      console.log(`🌐 Connected to ${network.name} (Chain ID: ${network.chainId})`);
      
      // 设置连接错误处理
      this.provider.on('error', (error) => {
        console.error('Provider error:', error);
        this.handleProviderError(error);
      });
      
      this.provider.on('block', (blockNumber) => {
        this.emit('block:new', { blockNumber, timestamp: Date.now() });
      });
      
    } catch (error) {
      console.error('Failed to setup provider:', error);
      throw error;
    }
  }

  /**
   * 设置智能合约
   */
  async setupContract() {
    try {
      const contractConfig = this.web3Manager.contractConfigs[this.options.chainId];
      
      if (!contractConfig || !contractConfig.address) {
        throw new Error(`Contract not deployed on chain ${this.options.chainId}`);
      }
      
      this.contract = new ethers.Contract(
        contractConfig.address,
        contractConfig.abi,
        this.provider
      );
      
      console.log(`📋 Contract setup: ${contractConfig.address}`);
      
    } catch (error) {
      console.error('Failed to setup contract:', error);
      throw error;
    }
  }

  /**
   * 设置事件过滤器
   */
  async setupEventFilters() {
    try {
      for (const [eventName, eventConfig] of Object.entries(CONTRACT_EVENTS)) {
        const filter = this.contract.filters[eventName]();
        this.eventFilters.set(eventName, {
          filter,
          config: eventConfig,
          listener: null
        });
      }
      
      console.log(`🔍 Setup ${this.eventFilters.size} event filters`);
      
    } catch (error) {
      console.error('Failed to setup event filters:', error);
      throw error;
    }
  }

  /**
   * 加载最后处理的区块
   */
  async loadLastProcessedBlock() {
    try {
      // 从数据库获取最后处理的区块
      const lastBlock = await this.database.getLastProcessedBlock(this.options.chainId);
      
      if (lastBlock) {
        this.lastProcessedBlock = lastBlock;
        console.log(`📦 Last processed block: ${lastBlock}`);
      } else {
        // 如果没有记录，从当前区块开始
        const currentBlock = await this.provider.getBlockNumber();
        this.lastProcessedBlock = currentBlock;
        console.log(`📦 Starting from current block: ${currentBlock}`);
      }
      
    } catch (error) {
      console.error('Failed to load last processed block:', error);
      // 使用默认值
      this.lastProcessedBlock = await this.provider.getBlockNumber();
    }
  }

  /**
   * 开始监听所有事件
   */
  async startListening() {
    if (this.isListening) {
      console.warn('⚠️ Event listener already running');
      return;
    }
    
    try {
      console.log('🚀 Starting blockchain event listening...');
      
      this.isListening = true;
      
      // 处理历史事件
      await this.processHistoricalEvents();
      
      // 启动实时监听
      this.startRealTimeListening();
      
      // 启动处理队列
      this.startEventProcessor();
      
      console.log('✅ Blockchain event listening started');
      
      this.emit('listener:started', {
        timestamp: Date.now(),
        startBlock: this.lastProcessedBlock
      });
      
    } catch (error) {
      console.error('❌ Failed to start event listening:', error);
      this.isListening = false;
      throw error;
    }
  }

  /**
   * 处理历史事件
   */
  async processHistoricalEvents() {
    try {
      const currentBlock = await this.provider.getBlockNumber();
      const fromBlock = Math.max(this.lastProcessedBlock - 100, 0); // 回溯100个区块
      
      if (fromBlock >= currentBlock) {
        console.log('📚 No historical events to process');
        return;
      }
      
      console.log(`📚 Processing historical events from block ${fromBlock} to ${currentBlock}...`);
      
      for (const [eventName, eventData] of this.eventFilters.entries()) {
        try {
          const events = await this.contract.queryFilter(
            eventData.filter,
            fromBlock,
            currentBlock
          );
          
          console.log(`📋 Found ${events.length} ${eventName} events`);
          
          for (const event of events) {
            await this.queueEvent(event, eventName, false); // 历史事件不实时推送
          }
          
        } catch (error) {
          console.error(`Failed to query ${eventName} events:`, error);
        }
      }
      
    } catch (error) {
      console.error('Failed to process historical events:', error);
    }
  }

  /**
   * 启动实时事件监听
   */
  startRealTimeListening() {
    for (const [eventName, eventData] of this.eventFilters.entries()) {
      const listener = async (...args) => {
        const event = args[args.length - 1]; // 最后一个参数是事件对象
        await this.queueEvent(event, eventName, true);
      };
      
      // 添加监听器
      this.contract.on(eventData.filter, listener);
      
      // 保存监听器引用
      eventData.listener = listener;
      
      console.log(`👂 Listening for ${eventName} events`);
    }
  }

  /**
   * 将事件加入处理队列
   */
  async queueEvent(event, eventName, isRealtime = true) {
    try {
      // 生成事件唯一ID
      const eventId = `${event.transactionHash}_${event.logIndex}`;
      
      // 检查是否重复
      if (this.eventCache.has(eventId)) {
        this.stats.duplicateEvents++;
        return;
      }
      
      // 添加到缓存
      this.eventCache.set(eventId, Date.now());
      
      // 清理过期缓存
      if (this.eventCache.size > this.options.eventCacheSize) {
        const oldestKeys = Array.from(this.eventCache.keys()).slice(0, 100);
        oldestKeys.forEach(key => this.eventCache.delete(key));
      }
      
      // 构建事件数据
      const eventData = {
        id: eventId,
        name: eventName,
        blockNumber: event.blockNumber,
        transactionHash: event.transactionHash,
        logIndex: event.logIndex,
        args: event.args,
        timestamp: Date.now(),
        isRealtime,
        retryCount: 0,
        status: EVENT_STATUS.PENDING
      };
      
      // 添加到处理队列
      this.processingQueue.push(eventData);
      this.stats.totalEvents++;
      
      console.log(`📥 Queued ${eventName} event: ${eventId}`);
      
      // 实时事件立即通知
      if (isRealtime && CONTRACT_EVENTS[eventName]?.realtime) {
        this.emit('event:queued', eventData);
      }
      
    } catch (error) {
      console.error('Failed to queue event:', error);
    }
  }

  /**
   * 启动事件处理器
   */
  startEventProcessor() {
    setInterval(async () => {
      if (this.processingQueue.length === 0) {
        return;
      }
      
      // 获取待处理事件批次
      const batch = this.processingQueue.splice(0, this.options.batchSize);
      
      console.log(`⚙️ Processing ${batch.length} events...`);
      
      // 并发处理事件
      const processPromises = batch.map(eventData => 
        this.processEvent(eventData).catch(error => {
          console.error(`Failed to process event ${eventData.id}:`, error);
          this.handleEventError(eventData, error);
        })
      );
      
      await Promise.allSettled(processPromises);
      
    }, this.options.batchInterval);
  }

  /**
   * 处理单个事件
   */
  async processEvent(eventData) {
    try {
      eventData.status = EVENT_STATUS.PROCESSING;
      
      console.log(`🔄 Processing ${eventData.name} event: ${eventData.id}`);
      
      // 根据事件类型调用相应处理器
      switch (eventData.name) {
        case 'MarketCreated':
          await this.handleMarketCreated(eventData);
          break;
        case 'SharesBought':
          await this.handleSharesBought(eventData);
          break;
        case 'SharesSold':
          await this.handleSharesSold(eventData);
          break;
        case 'LiquidityAdded':
          await this.handleLiquidityAdded(eventData);
          break;
        case 'LiquidityRemoved':
          await this.handleLiquidityRemoved(eventData);
          break;
        case 'MarketResolved':
          await this.handleMarketResolved(eventData);
          break;
        default:
          console.warn(`Unknown event type: ${eventData.name}`);
      }
      
      eventData.status = EVENT_STATUS.COMPLETED;
      this.stats.processedEvents++;
      this.stats.lastEventTime = Date.now();
      
      console.log(`✅ Processed ${eventData.name} event: ${eventData.id}`);
      
      // 发出处理完成事件
      this.emit('event:processed', eventData);
      
      // 更新最后处理的区块
      if (eventData.blockNumber > this.lastProcessedBlock) {
        this.lastProcessedBlock = eventData.blockNumber;
        await this.database.updateLastProcessedBlock(this.options.chainId, eventData.blockNumber);
      }
      
    } catch (error) {
      eventData.status = EVENT_STATUS.FAILED;
      throw error;
    }
  }

  /**
   * 处理市场创建事件
   */
  async handleMarketCreated(eventData) {
    const { args } = eventData;
    const [marketId, creator, description, closingTime, oracle] = args;
    
    // 更新数据库
    await this.database.updateMarketFromEvent({
      marketId: marketId.toString(),
      creator,
      description,
      closingTime: closingTime.toNumber(),
      oracle,
      txHash: eventData.transactionHash,
      blockNumber: eventData.blockNumber,
      status: 'active'
    });
    
    // 实时推送到前端
    if (this.socketService && eventData.isRealtime) {
      this.socketService.broadcastGlobal('market:created', {
        marketId: marketId.toString(),
        creator,
        description,
        closingTime: closingTime.toNumber(),
        oracle,
        transactionHash: eventData.transactionHash
      });
    }
    
    console.log(`📈 Market created: ${marketId}`);
  }

  /**
   * 处理份额购买事件
   */
  async handleSharesBought(eventData) {
    const { args } = eventData;
    const [marketId, buyer, outcome, shares, cost, newPrice] = args;
    
    // 更新数据库中的市场数据
    await this.database.updateMarketPrices(marketId.toString(), {
      outcome: outcome.toNumber(),
      newPrice: newPrice.toString(),
      lastTradeTime: Date.now()
    });
    
    // 记录交易
    await this.database.insertTransaction({
      marketId: marketId.toString(),
      user: buyer,
      type: 'buy',
      outcome: outcome.toNumber(),
      shares: shares.toString(),
      cost: cost.toString(),
      txHash: eventData.transactionHash,
      blockNumber: eventData.blockNumber,
      timestamp: Date.now()
    });
    
    // 实时推送价格更新
    if (this.socketService && eventData.isRealtime) {
      this.socketService.broadcastToMarket(marketId.toString(), 'trade:shares_bought', {
        buyer,
        outcome: outcome.toNumber(),
        shares: shares.toString(),
        cost: cost.toString(),
        newPrice: newPrice.toString(),
        transactionHash: eventData.transactionHash
      });
      
      // 推送用户位置更新
      this.socketService.sendToUser(buyer, 'user:position_update', {
        marketId: marketId.toString(),
        outcome: outcome.toNumber(),
        shares: shares.toString(),
        action: 'buy'
      });
    }
    
    console.log(`💰 Shares bought: Market ${marketId}, User ${buyer}, Shares ${shares}`);
  }

  /**
   * 处理份额出售事件
   */
  async handleSharesSold(eventData) {
    const { args } = eventData;
    const [marketId, seller, outcome, shares, payout, newPrice] = args;
    
    // 更新数据库
    await this.database.updateMarketPrices(marketId.toString(), {
      outcome: outcome.toNumber(),
      newPrice: newPrice.toString(),
      lastTradeTime: Date.now()
    });
    
    // 记录交易
    await this.database.insertTransaction({
      marketId: marketId.toString(),
      user: seller,
      type: 'sell',
      outcome: outcome.toNumber(),
      shares: shares.toString(),
      payout: payout.toString(),
      txHash: eventData.transactionHash,
      blockNumber: eventData.blockNumber,
      timestamp: Date.now()
    });
    
    // 实时推送
    if (this.socketService && eventData.isRealtime) {
      this.socketService.broadcastToMarket(marketId.toString(), 'trade:shares_sold', {
        seller,
        outcome: outcome.toNumber(),
        shares: shares.toString(),
        payout: payout.toString(),
        newPrice: newPrice.toString(),
        transactionHash: eventData.transactionHash
      });
      
      this.socketService.sendToUser(seller, 'user:position_update', {
        marketId: marketId.toString(),
        outcome: outcome.toNumber(),
        shares: shares.toString(),
        action: 'sell'
      });
    }
    
    console.log(`💸 Shares sold: Market ${marketId}, User ${seller}, Shares ${shares}`);
  }

  /**
   * 处理流动性添加事件
   */
  async handleLiquidityAdded(eventData) {
    const { args } = eventData;
    const [marketId, provider, amount, lpTokens] = args;
    
    // 更新市场流动性信息
    await this.database.updateMarketLiquidity(marketId.toString(), {
      action: 'add',
      amount: amount.toString(),
      provider,
      lpTokens: lpTokens.toString(),
      txHash: eventData.transactionHash,
      timestamp: Date.now()
    });
    
    // 实时推送
    if (this.socketService && eventData.isRealtime) {
      this.socketService.broadcastToMarket(marketId.toString(), 'liquidity:added', {
        provider,
        amount: amount.toString(),
        lpTokens: lpTokens.toString(),
        transactionHash: eventData.transactionHash
      });
    }
    
    console.log(`💧 Liquidity added: Market ${marketId}, Amount ${amount}`);
  }

  /**
   * 处理流动性移除事件
   */
  async handleLiquidityRemoved(eventData) {
    const { args } = eventData;
    const [marketId, provider, lpTokens, payout] = args;
    
    // 更新市场流动性信息
    await this.database.updateMarketLiquidity(marketId.toString(), {
      action: 'remove',
      payout: payout.toString(),
      provider,
      lpTokens: lpTokens.toString(),
      txHash: eventData.transactionHash,
      timestamp: Date.now()
    });
    
    // 实时推送
    if (this.socketService && eventData.isRealtime) {
      this.socketService.broadcastToMarket(marketId.toString(), 'liquidity:removed', {
        provider,
        lpTokens: lpTokens.toString(),
        payout: payout.toString(),
        transactionHash: eventData.transactionHash
      });
    }
    
    console.log(`🚰 Liquidity removed: Market ${marketId}, Payout ${payout}`);
  }

  /**
   * 处理市场解决事件
   */
  async handleMarketResolved(eventData) {
    const { args } = eventData;
    const [marketId, winningOutcome, finalizeTime] = args;
    
    // 更新市场状态
    await this.database.updateMarketStatus(marketId.toString(), {
      status: 'resolved',
      winningOutcome: winningOutcome.toNumber(),
      finalizeTime: finalizeTime.toNumber(),
      txHash: eventData.transactionHash,
      resolvedAt: Date.now()
    });
    
    // 实时推送
    if (this.socketService && eventData.isRealtime) {
      this.socketService.broadcastToMarket(marketId.toString(), 'market:resolved', {
        winningOutcome: winningOutcome.toNumber(),
        finalizeTime: finalizeTime.toNumber(),
        transactionHash: eventData.transactionHash
      });
      
      // 全局广播重要市场解决
      this.socketService.broadcastGlobal('market:resolved', {
        marketId: marketId.toString(),
        winningOutcome: winningOutcome.toNumber()
      });
    }
    
    console.log(`🏁 Market resolved: ${marketId}, Winner: ${winningOutcome}`);
  }

  /**
   * 处理事件错误
   */
  handleEventError(eventData, error) {
    eventData.retryCount++;
    this.stats.failedEvents++;
    
    console.error(`❌ Event processing failed: ${eventData.id}, Attempt: ${eventData.retryCount}`);
    
    // 如果重试次数未达到上限，重新加入队列
    if (eventData.retryCount < this.options.maxRetries) {
      setTimeout(() => {
        this.processingQueue.push(eventData);
      }, this.options.retryDelay * eventData.retryCount);
    } else {
      // 记录失败事件
      this.failedEvents.set(eventData.id, {
        ...eventData,
        error: error.message,
        failedAt: Date.now()
      });
      
      console.error(`💀 Event permanently failed: ${eventData.id}`);
    }
  }

  /**
   * 处理提供者错误
   */
  handleProviderError(error) {
    console.error('Provider error, attempting to reconnect...', error);
    
    // 停止监听
    this.stopListening();
    
    // 延迟重连
    setTimeout(async () => {
      try {
        await this.setupProvider();
        await this.startListening();
        console.log('✅ Successfully reconnected to provider');
      } catch (reconnectError) {
        console.error('❌ Failed to reconnect:', reconnectError);
        // 继续重试
        this.handleProviderError(reconnectError);
      }
    }, 10000); // 10秒后重试
  }

  /**
   * 启动定时任务
   */
  startPeriodicTasks() {
    // 每5分钟同步一次状态
    cron.schedule('*/5 * * * *', () => {
      this.syncStatus();
    });
    
    // 每小时清理一次失败事件
    cron.schedule('0 * * * *', () => {
      this.cleanupFailedEvents();
    });
    
    // 每天打印统计信息
    cron.schedule('0 0 * * *', () => {
      this.printDailyStats();
    });
  }

  /**
   * 同步状态
   */
  async syncStatus() {
    try {
      const currentBlock = await this.provider.getBlockNumber();
      console.log(`📊 Sync Status - Current Block: ${currentBlock}, Last Processed: ${this.lastProcessedBlock}`);
      
      // 如果落后太多区块，需要追赶
      if (currentBlock - this.lastProcessedBlock > 100) {
        console.warn(`⚠️ Behind by ${currentBlock - this.lastProcessedBlock} blocks, catching up...`);
        await this.processHistoricalEvents();
      }
      
    } catch (error) {
      console.error('Failed to sync status:', error);
    }
  }

  /**
   * 清理失败事件
   */
  cleanupFailedEvents() {
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    
    for (const [eventId, eventData] of this.failedEvents.entries()) {
      if (eventData.failedAt < oneDayAgo) {
        this.failedEvents.delete(eventId);
      }
    }
    
    console.log(`🧹 Cleaned up old failed events, ${this.failedEvents.size} remaining`);
  }

  /**
   * 打印每日统计
   */
  printDailyStats() {
    const runtime = Date.now() - this.stats.startTime;
    const runtimeHours = Math.floor(runtime / (1000 * 60 * 60));
    
    console.log(`📊 Daily Stats - Runtime: ${runtimeHours}h, ` +
                `Total Events: ${this.stats.totalEvents}, ` +
                `Processed: ${this.stats.processedEvents}, ` +
                `Failed: ${this.stats.failedEvents}, ` +
                `Duplicates: ${this.stats.duplicateEvents}`);
  }

  /**
   * 停止监听
   */
  stopListening() {
    if (!this.isListening) {
      return;
    }
    
    console.log('🛑 Stopping blockchain event listening...');
    
    // 移除所有事件监听器
    for (const [eventName, eventData] of this.eventFilters.entries()) {
      if (eventData.listener) {
        this.contract.off(eventData.filter, eventData.listener);
        console.log(`🔇 Stopped listening for ${eventName} events`);
      }
    }
    
    this.isListening = false;
    
    console.log('✅ Blockchain event listening stopped');
    
    this.emit('listener:stopped', {
      timestamp: Date.now(),
      finalStats: this.getStats()
    });
  }

  /**
   * 获取统计信息
   */
  getStats() {
    return {
      ...this.stats,
      queueLength: this.processingQueue.length,
      failedEventsCount: this.failedEvents.size,
      cacheSize: this.eventCache.size,
      isListening: this.isListening,
      lastProcessedBlock: this.lastProcessedBlock,
      runtime: Date.now() - this.stats.startTime
    };
  }

  /**
   * 强制重新处理失败事件
   */
  async retryFailedEvents() {
    console.log(`🔄 Retrying ${this.failedEvents.size} failed events...`);
    
    for (const [eventId, eventData] of this.failedEvents.entries()) {
      eventData.retryCount = 0;
      eventData.status = EVENT_STATUS.PENDING;
      this.processingQueue.push(eventData);
      this.failedEvents.delete(eventId);
    }
    
    console.log('✅ All failed events queued for retry');
  }

  /**
   * 关闭监听器
   */
  async close() {
    console.log('🔄 Shutting down Blockchain Event Listener...');
    
    this.stopListening();
    
    // 等待处理队列清空
    while (this.processingQueue.length > 0) {
      console.log(`⏳ Waiting for ${this.processingQueue.length} events to process...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('✅ Blockchain Event Listener closed');
    
    this.emit('listener:closed', {
      timestamp: Date.now(),
      finalStats: this.getStats()
    });
  }
}

module.exports = {
  BlockchainEventListener,
  CONTRACT_EVENTS,
  EVENT_STATUS
};