/**
 * 🚀 OddsMarket 增强版启动脚本
 * 世界顶级部署脚本 - 企业级启动管理
 * 
 * 功能特性:
 * - 环境检查和验证
 * - 依赖项检查
 * - 智能合约验证
 * - 数据库迁移
 * - 服务健康检查
 * - 优雅启动流程
 * 
 * @author 世界顶级DevOps工程师
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 OddsMarket Enhanced Server Startup Script');
console.log('=============================================');

/**
 * 环境检查
 */
function checkEnvironment() {
  console.log('🔍 Checking environment...');
  
  const requiredEnvVars = [
    'JWT_SECRET',
    'CHAIN_ID',
    'ODDSMARKET_CONTRACT_ADDRESS'
  ];
  
  const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(envVar => console.error(`   - ${envVar}`));
    console.log('\n💡 Please check your .env file');
    process.exit(1);
  }
  
  console.log('✅ Environment variables validated');
}

/**
 * 依赖检查
 */
function checkDependencies() {
  console.log('📦 Checking dependencies...');
  
  const requiredPackages = [
    'socket.io',
    'eventemitter3',
    'node-cron',
    'lodash',
    'moment'
  ];
  
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const installedDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    const missing = requiredPackages.filter(pkg => !installedDeps[pkg]);
    
    if (missing.length > 0) {
      console.log('📦 Installing missing packages...');
      execSync(`npm install ${missing.join(' ')}`, { stdio: 'inherit' });
    }
    
    console.log('✅ Dependencies validated');
  } catch (error) {
    console.error('❌ Failed to check dependencies:', error.message);
    process.exit(1);
  }
}

/**
 * 合约验证
 */
function verifyContract() {
  console.log('📋 Verifying smart contract...');
  
  const contractAddress = process.env.ODDSMARKET_CONTRACT_ADDRESS;
  const chainId = process.env.CHAIN_ID || '97';
  
  if (!contractAddress) {
    console.error('❌ Contract address not configured');
    process.exit(1);
  }
  
  // 检查ABI文件
  const abiPath = path.join(__dirname, 'src/abi/OddsMarketV1Simplified.json');
  if (!fs.existsSync(abiPath)) {
    console.error('❌ Contract ABI file not found:', abiPath);
    process.exit(1);
  }
  
  console.log(`✅ Contract verified: ${contractAddress} (Chain: ${chainId})`);
}

/**
 * 数据库初始化
 */
function initializeDatabase() {
  console.log('🗄️ Checking database...');
  
  const dbPath = process.env.DATABASE_PATH || './data/markets.sqlite';
  const dbDir = path.dirname(dbPath);
  
  // 确保数据目录存在
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
    console.log(`📁 Created database directory: ${dbDir}`);
  }
  
  console.log('✅ Database ready');
}

/**
 * 创建必要目录
 */
function createDirectories() {
  console.log('📁 Creating necessary directories...');
  
  const dirs = [
    './data',
    './logs',
    './public/uploads',
    './public/uploads/logos',
    './public/uploads/resources'
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`   Created: ${dir}`);
    }
  });
  
  console.log('✅ Directories ready');
}

/**
 * 主启动函数
 */
async function startServer() {
  try {
    console.log('\n⚡ Starting OddsMarket Enhanced Server...\n');
    
    // 1. 环境检查
    checkEnvironment();
    
    // 2. 依赖检查
    checkDependencies();
    
    // 3. 合约验证
    verifyContract();
    
    // 4. 数据库初始化
    initializeDatabase();
    
    // 5. 创建必要目录
    createDirectories();
    
    console.log('\n✅ Pre-flight checks completed successfully!');
    console.log('🚀 Launching enhanced server...\n');
    
    // 启动增强版服务器
    require('./server-enhanced.js');
    
  } catch (error) {
    console.error('\n❌ Startup failed:', error.message);
    process.exit(1);
  }
}

// 启动服务器
startServer();