/**
 * Script to clean up markets that are marked as active but not published to blockchain
 * These are likely test markets from early development
 */

const Database = require('../src/database/Database');
const path = require('path');

async function cleanupInvalidMarkets() {
  const db = new Database();
  
  try {
    // Initialize database
    await db.init();
    console.log('Connected to database');
    
    // Find markets with active status but no chain_market_id
    const invalidMarkets = await db.all(`
      SELECT id, market_id, title, status, chain_market_id 
      FROM markets 
      WHERE status = 'active' AND (chain_market_id IS NULL OR chain_market_id = '')
    `);
    
    console.log(`Found ${invalidMarkets.length} invalid markets to clean up:`);
    invalidMarkets.forEach(market => {
      console.log(`- ID: ${market.id}, Market ID: ${market.market_id}, Title: ${market.title}`);
    });
    
    if (invalidMarkets.length === 0) {
      console.log('No invalid markets found. Database is clean!');
      return;
    }
    
    // Confirm before deletion
    console.log('\nThese markets will be deleted permanently.');
    console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...');
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Delete invalid markets
    const deleteResult = await db.run(`
      DELETE FROM markets 
      WHERE status = 'active' AND (chain_market_id IS NULL OR chain_market_id = '')
    `);
    
    console.log(`\nDeleted ${deleteResult.changes} markets successfully.`);
    
    // Log the cleanup operation
    await db.log(
      'cleanup_markets',
      'system',
      null,
      'script',
      `Cleaned up ${deleteResult.changes} invalid markets without chain_market_id`,
      { 
        deletedCount: deleteResult.changes,
        deletedIds: invalidMarkets.map(m => m.market_id)
      }
    );
    
    // Show remaining active markets
    const remainingMarkets = await db.all(`
      SELECT id, market_id, title, chain_market_id 
      FROM markets 
      WHERE status = 'active'
      ORDER BY chain_market_id DESC
    `);
    
    console.log(`\nRemaining active markets (${remainingMarkets.length}):`);
    remainingMarkets.forEach(market => {
      console.log(`- Chain ID: ${market.chain_market_id}, Market ID: ${market.market_id}, Title: ${market.title}`);
    });
    
  } catch (error) {
    console.error('Error during cleanup:', error);
  } finally {
    await db.close();
    console.log('\nDatabase connection closed.');
  }
}

// Run the cleanup
cleanupInvalidMarkets();