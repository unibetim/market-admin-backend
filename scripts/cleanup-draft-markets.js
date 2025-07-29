const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 数据库路径
const dbPath = path.join(__dirname, '../data/markets.sqlite');

console.log('🧹 开始清理没有链上ID的草稿市场...');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ 数据库连接失败:', err.message);
    process.exit(1);
  }
  console.log('✅ 数据库连接成功');
});

// 查询需要删除的市场
db.all(`
  SELECT id, title, status, chain_market_id, created_at 
  FROM markets 
  WHERE chain_market_id IS NULL OR chain_market_id = ''
  ORDER BY created_at DESC
`, (err, markets) => {
  if (err) {
    console.error('❌ 查询失败:', err.message);
    db.close();
    process.exit(1);
  }

  if (markets.length === 0) {
    console.log('✅ 没有需要清理的草稿市场');
    db.close();
    return;
  }

  console.log(`\n📋 找到 ${markets.length} 个没有链上ID的市场:`);
  markets.forEach(market => {
    const date = new Date(market.created_at).toLocaleString();
    console.log(`- ID ${market.id}: ${market.title} (${market.status}) - ${date}`);
  });

  console.log(`\n⚠️  即将删除这 ${markets.length} 个市场，3秒后开始...`);
  
  setTimeout(() => {
    // 开始删除
    db.run(`
      DELETE FROM markets 
      WHERE chain_market_id IS NULL OR chain_market_id = ''
    `, function(err) {
      if (err) {
        console.error('❌ 删除失败:', err.message);
        db.close();
        process.exit(1);
      }

      console.log(`✅ 成功删除 ${this.changes} 个草稿市场`);

      // 验证删除结果
      db.get('SELECT COUNT(*) as count FROM markets', (err, row) => {
        if (err) {
          console.error('❌ 验证失败:', err.message);
        } else {
          console.log(`📊 数据库中剩余市场数量: ${row.count}`);
        }

        // 显示剩余市场的状态
        db.all(`
          SELECT status, COUNT(*) as count 
          FROM markets 
          GROUP BY status
        `, (err, statusCounts) => {
          if (!err && statusCounts.length > 0) {
            console.log('\n📈 剩余市场状态分布:');
            statusCounts.forEach(item => {
              console.log(`- ${item.status}: ${item.count} 个`);
            });
          }

          console.log('\n🎉 清理完成！现在数据库中只包含已发布到链上的市场。');
          db.close();
        });
      });
    });
  }, 3000);
});