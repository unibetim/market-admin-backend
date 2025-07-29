// 设置现有市场的链上ID - 一次性迁移脚本
const sqlite3 = require('sqlite3').verbose();
const Web3Manager = require('./src/utils/web3Manager');
const path = require('path');

async function setupChainMarketIds() {
  console.log('🚀 开始设置现有市场的链上ID...');
  
  const dbPath = path.join(__dirname, 'data', 'markets.sqlite');
  const web3Manager = new Web3Manager();
  
  return new Promise(async (resolve, reject) => {
    const db = new sqlite3.Database(dbPath, async (err) => {
      if (err) {
        reject(err);
        return;
      }
      
      try {
        // 1. 先运行数据库迁移
        console.log('📋 检查数据库结构...');
        await runMigration(db);
        
        // 2. 获取所有已发布但缺少chain_market_id的市场
        const markets = await getMarketsNeedingChainId(db);
        console.log(`📊 找到 ${markets.length} 个需要设置链上ID的市场`);
        
        if (markets.length === 0) {
          console.log('✅ 所有市场都已设置链上ID');
          db.close();
          resolve();
          return;
        }
        
        // 3. 基于市场描述和合约数据进行智能映射
        const chainMarkets = await getChainMarkets(web3Manager);
        console.log(`📋 链上找到 ${chainMarkets.length} 个市场`);
        
        // 4. 执行映射
        const mappings = createMappings(markets, chainMarkets);
        console.log('🔗 创建的映射关系:');
        mappings.forEach(({ market, chainMarketId }) => {
          console.log(`  ${market.market_id} -> 链上ID ${chainMarketId}`);
        });
        
        // 5. 更新数据库
        for (const { market, chainMarketId } of mappings) {
          await updateMarketChainId(db, market.market_id, chainMarketId);
          console.log(`✅ 更新市场 ${market.market_id} 的链上ID为 ${chainMarketId}`);
        }
        
        console.log('🎉 链上ID设置完成');
        db.close();
        resolve();
        
      } catch (error) {
        console.error('❌ 设置失败:', error);
        db.close();
        reject(error);
      }
    });
  });
}

// 运行数据库迁移
function runMigration(db) {
  return new Promise((resolve, reject) => {
    db.run(`
      ALTER TABLE markets 
      ADD COLUMN chain_market_id INTEGER DEFAULT NULL
    `, (err) => {
      if (err && !err.message.includes('duplicate column name')) {
        reject(err);
      } else {
        console.log('✅ 数据库迁移完成');
        resolve();
      }
    });
  });
}

// 获取需要设置链上ID的市场
function getMarketsNeedingChainId(db) {
  return new Promise((resolve, reject) => {
    db.all(`
      SELECT * FROM markets 
      WHERE status = 'active' 
      AND (chain_market_id IS NULL OR chain_market_id = 0)
      ORDER BY created_at ASC
    `, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

// 获取链上市场数据
async function getChainMarkets(web3Manager) {
  try {
    const contract = web3Manager.contracts.get(97); // BSC Testnet
    if (!contract) {
      throw new Error('合约未初始化');
    }
    
    const marketCount = await contract.getMarketCount();
    const chainMarkets = [];
    
    for (let i = 1; i <= marketCount.toNumber(); i++) {
      try {
        const marketInfo = await contract.getMarketInfo(i);
        chainMarkets.push({
          id: i,
          description: marketInfo.description,
          status: marketInfo.status,
          totalLiquidity: marketInfo.totalLiquidity.toString(),
          creationTime: marketInfo.creationTime.toNumber()
        });
      } catch (error) {
        console.warn(`跳过市场 ${i}:`, error.message);
      }
    }
    
    return chainMarkets;
  } catch (error) {
    console.error('获取链上市场失败:', error);
    return [];
  }
}

// 创建映射关系
function createMappings(dbMarkets, chainMarkets) {
  const mappings = [];
  
  for (const dbMarket of dbMarkets) {
    // 1. 首先尝试基于描述匹配
    const dbTitle = dbMarket.title.toLowerCase();
    
    // 查找包含关键词的链上市场
    let matchedChainMarket = chainMarkets.find(cm => {
      const chainDesc = cm.description.toLowerCase();
      
      // 提取关键词进行匹配
      if (dbTitle.includes('阿森纳') && dbTitle.includes('切尔西')) {
        return chainDesc.includes('阿森纳') && chainDesc.includes('切尔西');
      }
      if (dbTitle.includes('曼联') && dbTitle.includes('曼城')) {
        return chainDesc.includes('曼联') && chainDesc.includes('曼城');
      }
      if (dbTitle.includes('利物浦') && dbTitle.includes('切尔西')) {
        return chainDesc.includes('利物浦') && chainDesc.includes('切尔西');
      }
      if (dbTitle.includes('皇家马德里') && dbTitle.includes('巴塞罗那')) {
        return chainDesc.includes('皇家马德里') && chainDesc.includes('巴塞罗那');
      }
      
      return false;
    });
    
    // 2. 如果没有找到精确匹配，尝试按创建时间顺序匹配
    if (!matchedChainMarket) {
      const unusedChainMarkets = chainMarkets.filter(cm => 
        !mappings.some(m => m.chainMarketId === cm.id)
      );
      
      if (unusedChainMarkets.length > 0) {
        // 按创建时间排序，取最早的未使用市场
        matchedChainMarket = unusedChainMarkets.sort((a, b) => a.creationTime - b.creationTime)[0];
      }
    }
    
    if (matchedChainMarket) {
      mappings.push({
        market: dbMarket,
        chainMarketId: matchedChainMarket.id
      });
    } else {
      console.warn(`⚠️ 无法为市场 ${dbMarket.market_id} 找到匹配的链上市场`);
    }
  }
  
  return mappings;
}

// 更新市场的链上ID
function updateMarketChainId(db, marketId, chainMarketId) {
  return new Promise((resolve, reject) => {
    db.run(`
      UPDATE markets 
      SET chain_market_id = ?, updated_at = strftime('%s', 'now')
      WHERE market_id = ?
    `, [chainMarketId, marketId], (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

// 执行脚本
if (require.main === module) {
  setupChainMarketIds()
    .then(() => {
      console.log('🎉 脚本执行完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 脚本执行失败:', error);
      process.exit(1);
    });
}

module.exports = { setupChainMarketIds };