// 手动设置链上ID - 基于已知的链上市场数据
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 基于之前的链上市场查询结果的手动映射
const KNOWN_MAPPINGS = {
  // 阿森纳 vs 切尔西 -> 链上市场13 (让球+1.5)
  'market_1753376961108_p7plxgba9': 13,
  
  // 其他市场可以根据需要添加
  // 'market_xxx': 链上ID
};

async function manualSetChainIds() {
  console.log('🔧 手动设置已知市场的链上ID...');
  
  const dbPath = path.join(__dirname, 'data', 'markets.sqlite');
  
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, async (err) => {
      if (err) {
        reject(err);
        return;
      }
      
      try {
        for (const [marketId, chainMarketId] of Object.entries(KNOWN_MAPPINGS)) {
          await updateMarketChainId(db, marketId, chainMarketId);
          console.log(`✅ 设置市场 ${marketId} 的链上ID为 ${chainMarketId}`);
        }
        
        // 验证设置结果
        console.log('\n📋 验证设置结果:');
        const markets = await getUpdatedMarkets(db);
        markets.forEach(market => {
          console.log(`  ${market.market_id} -> 链上ID: ${market.chain_market_id || 'NULL'} (${market.title})`);
        });
        
        console.log('\n🎉 手动设置完成');
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

function getUpdatedMarkets(db) {
  return new Promise((resolve, reject) => {
    db.all(`
      SELECT market_id, title, status, chain_market_id 
      FROM markets 
      WHERE status = 'active'
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

// 执行脚本
manualSetChainIds()
  .then(() => {
    console.log('✅ 脚本执行完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 脚本执行失败:', error);
    process.exit(1);
  });