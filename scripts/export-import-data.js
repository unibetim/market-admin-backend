#!/usr/bin/env node

/**
 * 数据导入导出脚本
 * 用于在不同环境之间迁移数据
 */

const fs = require('fs');
const path = require('path');
const Database = require('../src/database/Database');

// 导出数据
async function exportData() {
  const db = new Database();
  await db.init();
  
  try {
    // 导出所有表的数据
    const markets = await db.getAllMarkets();
    const templates = db.db.prepare('SELECT * FROM templates').all();
    const resources = db.db.prepare('SELECT * FROM resources').all();
    const settings = db.db.prepare('SELECT * FROM system_settings').all();
    
    const exportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      data: {
        markets,
        templates,
        resources,
        settings
      }
    };
    
    // 保存到文件
    const exportPath = path.join(__dirname, '..', 'data-export.json');
    fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2));
    
    console.log('✅ 数据导出成功！');
    console.log(`📁 文件路径: ${exportPath}`);
    console.log(`📊 导出数据统计:`);
    console.log(`   - 市场: ${markets.length} 条`);
    console.log(`   - 模板: ${templates.length} 条`);
    console.log(`   - 资源: ${resources.length} 条`);
    console.log(`   - 设置: ${settings.length} 条`);
    
  } catch (error) {
    console.error('❌ 导出失败:', error);
  } finally {
    db.close();
  }
}

// 导入数据
async function importData(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error('❌ 文件不存在:', filePath);
    return;
  }
  
  const db = new Database();
  await db.init();
  
  try {
    const importData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    console.log('📋 准备导入数据...');
    console.log(`📅 导出时间: ${importData.exportDate}`);
    
    // 开始事务
    db.db.prepare('BEGIN').run();
    
    // 清空现有数据（可选）
    if (process.argv.includes('--clear')) {
      console.log('🗑️  清空现有数据...');
      db.db.prepare('DELETE FROM markets').run();
      db.db.prepare('DELETE FROM templates').run();
      db.db.prepare('DELETE FROM resources').run();
      db.db.prepare('DELETE FROM system_settings').run();
    }
    
    // 导入市场数据
    const marketStmt = db.db.prepare(`
      INSERT OR REPLACE INTO markets (
        id, title, description, category, outcome_a, outcome_b,
        odds_a, odds_b, liquidity_a, liquidity_b, trading_end_time,
        oracle_source, oracle_config, metadata, status, is_template,
        chain_market_id, created_at, updated_at
      ) VALUES (
        @id, @title, @description, @category, @outcome_a, @outcome_b,
        @odds_a, @odds_b, @liquidity_a, @liquidity_b, @trading_end_time,
        @oracle_source, @oracle_config, @metadata, @status, @is_template,
        @chain_market_id, @created_at, @updated_at
      )
    `);
    
    for (const market of importData.data.markets || []) {
      marketStmt.run(market);
    }
    console.log(`✅ 导入 ${importData.data.markets?.length || 0} 个市场`);
    
    // 导入模板数据
    const templateStmt = db.db.prepare(`
      INSERT OR REPLACE INTO templates (
        id, name, description, category, template_data, created_at, updated_at
      ) VALUES (
        @id, @name, @description, @category, @template_data, @created_at, @updated_at
      )
    `);
    
    for (const template of importData.data.templates || []) {
      templateStmt.run(template);
    }
    console.log(`✅ 导入 ${importData.data.templates?.length || 0} 个模板`);
    
    // 导入资源数据
    const resourceStmt = db.db.prepare(`
      INSERT OR REPLACE INTO resources (
        id, name, type, category, file_path, url, metadata, created_at
      ) VALUES (
        @id, @name, @type, @category, @file_path, @url, @metadata, @created_at
      )
    `);
    
    for (const resource of importData.data.resources || []) {
      resourceStmt.run(resource);
    }
    console.log(`✅ 导入 ${importData.data.resources?.length || 0} 个资源`);
    
    // 导入设置数据
    const settingStmt = db.db.prepare(`
      INSERT OR REPLACE INTO system_settings (
        key, value, description, updated_at
      ) VALUES (
        @key, @value, @description, @updated_at
      )
    `);
    
    for (const setting of importData.data.settings || []) {
      settingStmt.run(setting);
    }
    console.log(`✅ 导入 ${importData.data.settings?.length || 0} 个设置`);
    
    // 提交事务
    db.db.prepare('COMMIT').run();
    
    console.log('🎉 数据导入成功！');
    
  } catch (error) {
    db.db.prepare('ROLLBACK').run();
    console.error('❌ 导入失败:', error);
  } finally {
    db.close();
  }
}

// 主函数
async function main() {
  const command = process.argv[2];
  
  if (command === 'export') {
    await exportData();
  } else if (command === 'import') {
    const filePath = process.argv[3] || path.join(__dirname, '..', 'data-export.json');
    await importData(filePath);
  } else {
    console.log('📚 使用方法:');
    console.log('  导出数据: node scripts/export-import-data.js export');
    console.log('  导入数据: node scripts/export-import-data.js import [文件路径]');
    console.log('  清空并导入: node scripts/export-import-data.js import [文件路径] --clear');
  }
}

main().catch(console.error);