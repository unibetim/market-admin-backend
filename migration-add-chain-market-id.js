// 数据库迁移脚本 - 添加 chain_market_id 字段
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

async function migrateDatabase() {
  const dbPath = path.join(__dirname, 'data', 'markets.sqlite');
  
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('数据库连接失败:', err);
        reject(err);
        return;
      }
      
      console.log('✅ 连接到数据库');
      
      // 添加 chain_market_id 字段
      db.run(`
        ALTER TABLE markets 
        ADD COLUMN chain_market_id INTEGER DEFAULT NULL
      `, (err) => {
        if (err) {
          // 如果字段已存在，忽略错误
          if (err.message.includes('duplicate column name')) {
            console.log('⚠️ chain_market_id 字段已存在，跳过添加');
          } else {
            console.error('添加字段失败:', err);
            reject(err);
            return;
          }
        } else {
          console.log('✅ 成功添加 chain_market_id 字段');
        }
        
        // 添加索引
        db.run(`
          CREATE INDEX IF NOT EXISTS idx_chain_market_id 
          ON markets(chain_market_id)
        `, (err) => {
          if (err) {
            console.error('创建索引失败:', err);
            reject(err);
          } else {
            console.log('✅ 成功创建 chain_market_id 索引');
            db.close();
            resolve();
          }
        });
      });
    });
  });
}

// 执行迁移
migrateDatabase()
  .then(() => {
    console.log('🎉 数据库迁移完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 数据库迁移失败:', error);
    process.exit(1);
  });