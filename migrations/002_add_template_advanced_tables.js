const path = require('path');

/**
 * 添加模板系统的高级功能表
 * 包括版本控制、统计、评分等功能
 */

const migration = {
  up: async (db) => {
    console.log('🚀 开始执行模板系统高级表迁移...');

    // 1. 模板版本表
    await db.run(`
      CREATE TABLE IF NOT EXISTS template_versions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        template_id INTEGER NOT NULL,
        version_number TEXT NOT NULL DEFAULT '1.0.0',
        version_notes TEXT DEFAULT '',
        template_data TEXT NOT NULL,
        is_current INTEGER DEFAULT 0,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        FOREIGN KEY (template_id) REFERENCES templates(id) ON DELETE CASCADE
      )
    `);

    // 2. 模板统计表
    await db.run(`
      CREATE TABLE IF NOT EXISTS template_stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        template_id INTEGER NOT NULL UNIQUE,
        usage_count INTEGER DEFAULT 0,
        last_used_at INTEGER DEFAULT NULL,
        total_ratings INTEGER DEFAULT 0,
        avg_rating REAL DEFAULT 0.0,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER DEFAULT (strftime('%s', 'now')),
        FOREIGN KEY (template_id) REFERENCES templates(id) ON DELETE CASCADE
      )
    `);

    // 3. 模板评分表
    await db.run(`
      CREATE TABLE IF NOT EXISTS template_ratings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        template_id INTEGER NOT NULL,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        comment TEXT DEFAULT '',
        created_by TEXT DEFAULT 'admin',
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        FOREIGN KEY (template_id) REFERENCES templates(id) ON DELETE CASCADE
      )
    `);

    // 4. 为现有模板创建版本和统计记录
    const existingTemplates = await db.all('SELECT id, template_data FROM templates WHERE is_active = 1');
    
    for (const template of existingTemplates) {
      // 创建初始版本记录
      await db.run(`
        INSERT OR IGNORE INTO template_versions (
          template_id, version_number, version_notes, template_data, is_current
        ) VALUES (?, ?, ?, ?, 1)
      `, [template.id, '1.0.0', '初始版本', template.template_data]);

      // 创建统计记录
      await db.run(`
        INSERT OR IGNORE INTO template_stats (
          template_id, usage_count, total_ratings, avg_rating
        ) VALUES (?, 0, 0, 0.0)
      `, [template.id]);
    }

    // 5. 创建索引
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_template_versions_template_id ON template_versions(template_id)',
      'CREATE INDEX IF NOT EXISTS idx_template_versions_is_current ON template_versions(is_current)',
      'CREATE INDEX IF NOT EXISTS idx_template_stats_template_id ON template_stats(template_id)',
      'CREATE INDEX IF NOT EXISTS idx_template_stats_usage_count ON template_stats(usage_count DESC)',
      'CREATE INDEX IF NOT EXISTS idx_template_ratings_template_id ON template_ratings(template_id)',
      'CREATE INDEX IF NOT EXISTS idx_template_ratings_rating ON template_ratings(rating)'
    ];

    for (const indexQuery of indexes) {
      await db.run(indexQuery);
    }

    console.log(`✅ 模板系统高级表迁移完成！为 ${existingTemplates.length} 个现有模板创建了版本和统计记录`);
  },

  down: async (db) => {
    console.log('🔄 回滚模板系统高级表迁移...');
    
    await db.run('DROP TABLE IF EXISTS template_ratings');
    await db.run('DROP TABLE IF EXISTS template_stats');
    await db.run('DROP TABLE IF EXISTS template_versions');
    
    console.log('✅ 模板系统高级表回滚完成');
  }
};

module.exports = migration;