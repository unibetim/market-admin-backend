const path = require('path');

/**
 * 修复templates表结构，添加缺失的字段
 */

const migration = {
  up: async (db) => {
    console.log('🚀 开始修复templates表结构...');

    // 检查当前表结构
    const tableInfo = await db.all("PRAGMA table_info(templates)");
    const existingColumns = tableInfo.map(col => col.name);
    console.log('📋 当前templates表字段:', existingColumns);

    // 需要添加的字段
    const requiredColumns = [
      { name: 'description', type: 'TEXT DEFAULT ""' },
      { name: 'tags', type: 'TEXT DEFAULT ""' },
      { name: 'is_shared', type: 'INTEGER DEFAULT 0' },
      { name: 'created_by', type: 'TEXT DEFAULT "admin"' },
      { name: 'metadata', type: 'TEXT DEFAULT "{}"' },
      { name: 'status', type: 'TEXT DEFAULT "active"' }
    ];

    // 添加缺失的字段
    for (const column of requiredColumns) {
      if (!existingColumns.includes(column.name)) {
        console.log(`➕ 添加字段: ${column.name}`);
        await db.run(`ALTER TABLE templates ADD COLUMN ${column.name} ${column.type}`);
      } else {
        console.log(`✅ 字段已存在: ${column.name}`);
      }
    }

    // 确保所有现有记录有合理的默认值
    await db.run(`
      UPDATE templates 
      SET 
        description = COALESCE(description, ''),
        tags = COALESCE(tags, ''),
        is_shared = COALESCE(is_shared, 0),
        created_by = COALESCE(created_by, 'admin'),
        metadata = COALESCE(metadata, '{}'),
        status = COALESCE(status, 'active')
      WHERE 
        description IS NULL OR 
        tags IS NULL OR 
        is_shared IS NULL OR 
        created_by IS NULL OR 
        metadata IS NULL OR
        status IS NULL
    `);

    console.log('✅ templates表结构修复完成！');
  },

  down: async (db) => {
    console.log('⚠️ 注意：SQLite不支持DROP COLUMN，无法完全回滚此迁移');
    // SQLite不支持删除列，只能创建新表替换
  }
};

module.exports = migration;