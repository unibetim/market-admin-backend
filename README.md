# OddsMarket 集中式市场管理后端

这是一个专门为OddsMarket预测市场平台设计的集中式管理后端系统，支持高效创建和管理各种类型的预测市场。

## 🎯 主要功能

### 🏗️ 核心特性
- **集中式市场创建**: 支持体育、财经、政治、科技等多种市场类型
- **资源管理**: 球队logo、图片等静态资源统一管理
- **模板系统**: 预设模板快速创建市场
- **IPFS集成**: 与前端保持一致的去中心化存储
- **区块链交互**: 直接发布市场到BSC网络
- **管理后台**: 现代化的Web管理界面

### 🏀 体育市场
- **足球**: 支持英超、德甲、西甲、意甲、世界杯、欧洲杯、欧冠
- **篮球**: NBA、CBA等联赛，只支持胜负盘
- **让球系统**: 足球支持-3.5到+3.5球让球
- **球队管理**: 自动识别现有logo，支持新增

### 💰 财经市场
- **加密货币**: BTC、ETH、BNB等价格预测
- **股票指数**: 各种股票和指数预测
- **时间周期**: 灵活的时间范围设置

## 🚀 快速开始

### 1. 环境要求
```bash
Node.js >= 16.0.0
npm >= 8.0.0
```

### 2. 安装依赖
```bash
cd market-admin-backend
npm install
```

### 3. 配置环境变量
```bash
cp .env.example .env
# 编辑 .env 文件，配置必要参数
```

### 4. 配置管理员私钥 (重要！)
使用私钥设置助手来安全配置管理员私钥：
```bash
node setup-private-key.js
```

这个脚本将帮助您：
- 输入现有私钥并验证
- 生成新的测试钱包
- 检查当前配置和余额
- 安全地保存到环境变量

⚠️ **重要提醒**:
- 管理员私钥用于真实的区块链交易
- 确保钱包有足够的BNB余额支付Gas费用
- 测试网可从 https://testnet.binance.org/faucet-smart 获取免费BNB

### 5. 启动服务
```bash
# 开发模式
npm run dev

# 生产模式
npm start
```

### 6. 安装前端管理界面
```bash
cd admin-ui
npm install
npm start
```

## 🌐 访问地址

- **后端API**: http://localhost:3001
- **管理后台**: http://localhost:3001/admin
- **健康检查**: http://localhost:3001/health

## 🔐 默认登录信息

- **用户名**: admin
- **密码**: admin123

⚠️ **请在生产环境中立即更改默认密码！**

## 📋 API文档

### 认证相关
```bash
POST /api/auth/login          # 管理员登录
GET  /api/auth/verify         # 验证token
POST /api/auth/logout         # 登出
POST /api/auth/change-password # 修改密码
```

### 市场管理
```bash
GET  /api/markets             # 获取市场列表
POST /api/markets             # 创建新市场
GET  /api/markets/:id         # 获取市场详情
POST /api/markets/:id/publish # 发布市场到区块链
PUT  /api/markets/:id         # 更新市场
DELETE /api/markets/:id       # 删除市场(仅草稿)
```

### 资源管理
```bash
GET  /api/resources           # 获取资源列表
GET  /api/resources/teams     # 获取球队列表
GET  /api/resources/leagues   # 获取联赛列表
POST /api/resources/upload    # 上传资源文件
```

### 模板管理
```bash
GET  /api/templates           # 获取模板列表
POST /api/templates/:id/apply # 应用模板
POST /api/templates           # 创建模板
```

### 统计信息
```bash
GET  /api/stats               # 系统统计
GET  /api/stats/logs          # 操作日志
GET  /api/stats/performance   # 性能信息
```

## 🏗️ 项目结构

```
market-admin-backend/
├── src/
│   ├── database/           # 数据库管理
│   ├── routes/            # API路由
│   ├── utils/             # 工具类
│   └── middleware/        # 中间件
├── admin-ui/              # 前端管理界面
├── public/                # 静态资源
├── data/                  # 数据库文件
└── server.js              # 服务器入口
```

## 🔧 配置说明

### 环境变量配置
```bash
# 服务配置
PORT=3001                  # 服务端口
NODE_ENV=development       # 运行环境

# 区块链配置
ODDSMARKET_CONTRACT_ADDRESS=0x...    # 合约地址
ADMIN_PRIVATE_KEY=0x...              # 管理员私钥

# 管理员配置
ADMIN_USERNAME=admin                 # 管理员用户名
ADMIN_PASSWORD_HASH=$2a$10$...       # 密码哈希
```

### 数据库
项目使用SQLite数据库，首次启动会自动创建必要的表结构和基础数据。

### IPFS集成
系统复用前端的免费IPFS策略，支持本地缓存和多网关切换。

## 🎨 使用指南

### 创建足球市场
1. 进入管理后台
2. 选择"创建市场" → "体育" → "足球"
3. 选择联赛(英超/德甲等)
4. 选择对阵球队(自动加载logo)
5. 设置让球(-2.5到+3.5球)
6. 设置比赛时间和预言机
7. 一键发布或保存草稿

### 创建篮球市场
1. 选择"体育" → "篮球"
2. 选择联赛(NBA/CBA等)
3. 选择对阵球队
4. 设置比赛时间(只有胜负盘)
5. 发布市场

### 创建财经市场
1. 选择"财经" → "加密货币"
2. 选择币种(BTC/ETH等)
3. 设置目标价格和时间周期
4. 发布预测市场

## 🛠️ 开发指南

### 添加新的市场类型
1. 在`src/routes/templates.js`中添加模板
2. 在数据库中插入模板数据
3. 在前端添加对应的创建界面

### 添加新的球队logo
1. 将logo文件放入`public/logos/{sport}/{league}/`目录
2. 系统会自动扫描并在创建市场时显示

### 自定义模板
系统支持创建自定义模板，可以通过API或管理界面添加。

## 🔒 安全建议

1. **更改默认密码**: 首次登录后立即修改管理员密码
2. **设置私钥**: 配置管理员私钥用于区块链交互
3. **HTTPS部署**: 生产环境使用HTTPS
4. **防火墙设置**: 限制API访问来源
5. **定期备份**: 备份数据库和配置文件

## 🐛 故障排除

### 常见问题

1. **数据库连接失败**
   ```bash
   # 检查数据目录权限
   chmod 755 ./data
   ```

2. **区块链连接失败**
   ```bash
   # 检查RPC地址和网络
   curl https://data-seed-prebsc-1-s1.binance.org:8545/
   ```

3. **前端无法访问API**
   ```bash
   # 检查CORS配置和端口
   curl http://localhost:3001/health
   ```

### 日志查看
```bash
# 查看服务日志
npm run dev

# 查看操作日志
curl http://localhost:3001/api/stats/logs
```

## 📈 性能优化

- SQLite数据库适合中小规模使用
- IPFS缓存减少网络请求
- 前端React Query缓存提升响应速度
- 批量操作支持减少API调用

## 🤝 贡献指南

欢迎提交Issue和Pull Request来改进系统。

## 📄 许可证

MIT License

---

🎉 **现在您拥有了一个完整的集中式市场管理系统！**

通过这个后端，您可以高效地创建和管理各种类型的预测市场，特别是体育和财经市场。系统设计简洁易用，同时保持了与现有前端架构的完美兼容。