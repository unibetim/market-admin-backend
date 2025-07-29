/**
 * Migration: Add hotspot functionality to markets table
 * Description: Adds is_hotspot and hotspot_order fields to support trending markets management
 */

const sqlite3 = require('sqlite3').verbose();

class HotspotMigration {
  constructor(db) {
    this.db = db;
  }

  async up() {
    console.log('🔄 Running migration: Add hotspot fields to markets table...');
    
    try {
      // Check if columns already exist
      const tableInfo = await this.getTableInfo('markets');
      const hasHotspotField = tableInfo.some(col => col.name === 'is_hotspot');
      const hasOrderField = tableInfo.some(col => col.name === 'hotspot_order');
      
      if (!hasHotspotField) {
        await this.runQuery('ALTER TABLE markets ADD COLUMN is_hotspot INTEGER DEFAULT 0');
        console.log('✅ Added is_hotspot column');
      } else {
        console.log('⚠️ is_hotspot column already exists, skipping...');
      }
      
      if (!hasOrderField) {
        await this.runQuery('ALTER TABLE markets ADD COLUMN hotspot_order INTEGER DEFAULT 0');
        console.log('✅ Added hotspot_order column');
      } else {
        console.log('⚠️ hotspot_order column already exists, skipping...');
      }
      
      // Create index for performance
      await this.runQuery(`
        CREATE INDEX IF NOT EXISTS idx_markets_hotspot 
        ON markets(is_hotspot, hotspot_order DESC)
      `);
      console.log('✅ Created hotspot index');
      
      console.log('✅ Migration completed successfully');
      return true;
      
    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  }

  async down() {
    console.log('🔄 Rolling back migration: Remove hotspot fields...');
    
    try {
      // SQLite doesn't support DROP COLUMN, so we need to recreate the table
      // This is a destructive operation, use with caution
      console.log('⚠️ SQLite doesn\'t support DROP COLUMN. Manual intervention required.');
      console.log('To rollback: You would need to recreate the table without these columns.');
      return false;
    } catch (error) {
      console.error('❌ Rollback failed:', error);
      throw error;
    }
  }

  // Helper methods
  getTableInfo(tableName) {
    return new Promise((resolve, reject) => {
      this.db.all(`PRAGMA table_info(${tableName})`, (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  runQuery(sql) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, function(err) {
        if (err) reject(err);
        else resolve(this);
      });
    });
  }
}

// Export for programmatic use
module.exports = HotspotMigration;

// CLI usage
if (require.main === module) {
  const Database = require('../src/database/Database');
  
  async function runMigration() {
    const database = new Database();
    
    try {
      await database.init();
      const migration = new HotspotMigration(database.db);
      await migration.up();
      process.exit(0);
    } catch (error) {
      console.error('Migration failed:', error);
      process.exit(1);
    }
  }
  
  runMigration();
}