# OddsMarket V1 第一阶段开发计划

## 🎯 总体架构设计

### 系统架构图
```
┌─────────────────┐    WebSocket    ┌─────────────────┐    Events    ┌─────────────────┐
│   Frontend      │◄──────────────►│   Backend       │◄────────────►│   Blockchain    │
│   (React)       │                 │   (Node.js)     │              │   (BSC)         │
└─────────────────┘                 └─────────────────┘              └─────────────────┘
        │                                   │                                │
        │                                   │                                │
        ▼                                   ▼                                ▼
┌─────────────────┐                 ┌─────────────────┐              ┌─────────────────┐
│  Socket.io      │                 │   Database      │              │  Smart Contract │
│  Client         │                 │   (SQLite)      │              │  Events         │
└─────────────────┘                 └─────────────────┘              └─────────────────┘
```

### 核心组件

1. **WebSocket 实时推送系统**
   - Socket.IO 服务器
   - 房间管理（按市场分组）
   - 事件类型管理
   - 用户订阅管理

2. **链上事件监听系统**
   - 合约事件监听器
   - 事件解析和验证
   - 数据库同步器
   - 错误处理和重试机制

3. **交易API系统**
   - RESTful API endpoints
   - Web3 集成
   - 交易验证和安全
   - 用户权限管理

## 🔧 技术选型

### 依赖包安装
```bash
# WebSocket
npm install socket.io

# 事件处理
npm install eventemitter3

# 定时任务
npm install node-cron

# 工具库
npm install lodash moment
```

### 架构模式
- **事件驱动架构** (Event-Driven Architecture)
- **观察者模式** (Observer Pattern)
- **发布订阅模式** (Pub/Sub Pattern)
- **责任链模式** (Chain of Responsibility)

## 📊 数据流设计

### 1. WebSocket 数据流
```
区块链事件 → 事件监听器 → 数据处理 → WebSocket推送 → 前端更新
```

### 2. API 数据流
```
前端请求 → 参数验证 → 合约调用 → 数据库更新 → 响应返回 → WebSocket广播
```

### 3. 同步数据流
```
区块链状态 → 定时同步 → 数据库更新 → 一致性检查 → 异常报告
```

## 🎪 事件类型定义

### WebSocket 事件
```javascript
const SOCKET_EVENTS = {
  // 连接事件
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',
  
  // 订阅事件
  SUBSCRIBE_MARKET: 'subscribe:market',
  UNSUBSCRIBE_MARKET: 'unsubscribe:market',
  SUBSCRIBE_USER: 'subscribe:user',
  
  // 市场事件
  MARKET_CREATED: 'market:created',
  MARKET_UPDATED: 'market:updated',
  MARKET_CLOSED: 'market:closed',
  MARKET_RESOLVED: 'market:resolved',
  
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
  USER_BALANCE_UPDATE: 'user:balance_update'
};
```

### 智能合约事件
```javascript
const CONTRACT_EVENTS = {
  MarketCreated: 'MarketCreated',
  SharesBought: 'SharesBought', 
  SharesSold: 'SharesSold',
  LiquidityAdded: 'LiquidityAdded',
  LiquidityRemoved: 'LiquidityRemoved',
  ResultProposed: 'ResultProposed',
  ResultFinalized: 'ResultFinalized',
  WinningsClaimed: 'WinningsClaimed'
};
```

## 🔐 安全和性能考虑

### 安全措施
1. **连接认证**: JWT token 验证
2. **速率限制**: 防止 WebSocket 滥用
3. **房间权限**: 用户只能订阅有权限的市场
4. **数据验证**: 所有链上数据都需验证

### 性能优化
1. **批量更新**: 价格变化批量推送
2. **智能订阅**: 按需订阅，减少无用推送
3. **缓存策略**: 热点数据缓存
4. **连接池**: 数据库连接池优化

## 📝 开发里程碑

### 第1周: WebSocket 基础框架
- [x] Socket.IO 服务器搭建
- [x] 基础事件管理
- [x] 房间管理系统
- [x] 认证中间件

### 第2周: 链上事件监听
- [x] 合约事件监听器
- [x] 事件解析和处理
- [x] 数据库同步机制
- [x] 错误处理和重试

### 第3周: 交易API完善
- [x] 买卖份额API
- [x] 流动性管理API
- [x] 用户持仓查询
- [x] 交易历史记录

### 第4周: 集成和测试
- [x] 系统集成测试
- [x] 性能压力测试
- [x] 前端集成
- [x] 生产部署准备

---

*Created by 世界顶级全栈工程师 & OddsMarket 项目专家顾问*