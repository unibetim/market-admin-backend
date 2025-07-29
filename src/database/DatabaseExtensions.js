/**
 * 🗄️ OddsMarket 数据库扩展模块
 * 支持区块链事件监听和实时数据同步
 * 
 * 功能特性:
 * - 区块链数据同步
 * - 交易记录管理
 * - 用户持仓追踪
 * - 市场价格更新
 * - 流动性管理
 * - 事件处理状态追踪
 * 
 * @author 世界顶级数据库架构师
 * @version 1.0.0
 */

class DatabaseExtensions {
  constructor(database) {
    this.db = database.db;
  }

  /**
   * 创建区块链相关表
   */
  async createBlockchainTables() {
    const queries = [
      // 区块处理状态表
      `CREATE TABLE IF NOT EXISTS blockchain_sync (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        chain_id INTEGER NOT NULL,
        last_processed_block INTEGER NOT NULL,
        sync_status TEXT DEFAULT 'syncing',
        last_sync_time INTEGER DEFAULT (strftime('%s', 'now')),
        UNIQUE(chain_id)
      )`,

      // 交易记录表
      `CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tx_hash TEXT NOT NULL UNIQUE,
        market_id TEXT NOT NULL,
        user_address TEXT NOT NULL,
        transaction_type TEXT NOT NULL, -- 'buy', 'sell', 'add_liquidity', 'remove_liquidity', 'claim'
        outcome INTEGER, -- 0 or 1 for buy/sell, null for liquidity
        shares TEXT, -- BigNumber string
        cost TEXT, -- BigNumber string for buy transactions
        payout TEXT, -- BigNumber string for sell transactions
        liquidity_amount TEXT, -- BigNumber string for liquidity transactions
        lp_tokens TEXT, -- LP tokens for liquidity transactions
        gas_price TEXT,
        gas_used TEXT,
        block_number INTEGER NOT NULL,
        block_timestamp INTEGER,
        event_log_index INTEGER,
        processed_at INTEGER DEFAULT (strftime('%s', 'now')),
        created_at INTEGER DEFAULT (strftime('%s', 'now'))
      )`,

      // 用户持仓表
      `CREATE TABLE IF NOT EXISTS user_positions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_address TEXT NOT NULL,
        market_id TEXT NOT NULL,
        outcome INTEGER NOT NULL, -- 0 or 1
        shares_balance TEXT DEFAULT '0', -- BigNumber string
        lp_tokens TEXT DEFAULT '0', -- LP tokens balance
        total_invested TEXT DEFAULT '0', -- Total amount invested
        total_withdrawn TEXT DEFAULT '0', -- Total amount withdrawn
        last_updated INTEGER DEFAULT (strftime('%s', 'now')),
        UNIQUE(user_address, market_id, outcome)
      )`,

      // 市场价格历史表
      `CREATE TABLE IF NOT EXISTS market_price_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        market_id TEXT NOT NULL,
        outcome_0_price TEXT NOT NULL, -- BigNumber string
        outcome_1_price TEXT NOT NULL, -- BigNumber string
        total_volume TEXT DEFAULT '0',
        total_liquidity TEXT DEFAULT '0',
        last_trade_time INTEGER,
        block_number INTEGER,
        created_at INTEGER DEFAULT (strftime('%s', 'now'))
      )`,

      // 市场流动性记录表
      `CREATE TABLE IF NOT EXISTS liquidity_operations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        market_id TEXT NOT NULL,
        provider_address TEXT NOT NULL,
        operation_type TEXT NOT NULL, -- 'add' or 'remove'
        amount TEXT NOT NULL, -- BigNumber string
        lp_tokens TEXT, -- LP tokens received/burned
        tx_hash TEXT NOT NULL,
        block_number INTEGER NOT NULL,
        block_timestamp INTEGER,
        created_at INTEGER DEFAULT (strftime('%s', 'now'))
      )`,

      // 事件处理状态表
      `CREATE TABLE IF NOT EXISTS event_processing_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_id TEXT NOT NULL UNIQUE, -- tx_hash + log_index
        event_name TEXT NOT NULL,
        market_id TEXT,
        tx_hash TEXT NOT NULL,
        block_number INTEGER NOT NULL,
        log_index INTEGER NOT NULL,
        processing_status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
        retry_count INTEGER DEFAULT 0,
        error_message TEXT,
        processed_at INTEGER,
        created_at INTEGER DEFAULT (strftime('%s', 'now'))
      )`,

      // 市场统计表
      `CREATE TABLE IF NOT EXISTS market_statistics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        market_id TEXT NOT NULL UNIQUE,
        total_volume TEXT DEFAULT '0',
        total_trades INTEGER DEFAULT 0,
        unique_traders INTEGER DEFAULT 0,
        total_liquidity TEXT DEFAULT '0',
        liquidity_providers INTEGER DEFAULT 0,
        outcome_0_volume TEXT DEFAULT '0',
        outcome_1_volume TEXT DEFAULT '0',
        price_volatility REAL DEFAULT 0.0,
        last_updated INTEGER DEFAULT (strftime('%s', 'now'))
      )`
    ];

    for (const query of queries) {
      await this.runQuery(query);
    }

    // 创建索引
    await this.createIndexes();
    
    console.log('✅ Blockchain tables created successfully');
  }

  /**
   * 创建数据库索引
   */
  async createIndexes() {
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_transactions_market_id ON transactions(market_id)',
      'CREATE INDEX IF NOT EXISTS idx_transactions_user_address ON transactions(user_address)',
      'CREATE INDEX IF NOT EXISTS idx_transactions_block_number ON transactions(block_number)',
      'CREATE INDEX IF NOT EXISTS idx_user_positions_user_market ON user_positions(user_address, market_id)',
      'CREATE INDEX IF NOT EXISTS idx_market_price_history_market_id ON market_price_history(market_id)',
      'CREATE INDEX IF NOT EXISTS idx_liquidity_operations_market_id ON liquidity_operations(market_id)',
      'CREATE INDEX IF NOT EXISTS idx_event_processing_status ON event_processing_log(processing_status)',
      'CREATE INDEX IF NOT EXISTS idx_market_statistics_market_id ON market_statistics(market_id)'
    ];

    for (const index of indexes) {
      await this.runQuery(index);
    }

    console.log('✅ Database indexes created successfully');
  }

  /**
   * 获取最后处理的区块
   */
  async getLastProcessedBlock(chainId) {
    const query = 'SELECT last_processed_block FROM blockchain_sync WHERE chain_id = ?';
    const row = await this.getQuery(query, [chainId]);
    return row ? row.last_processed_block : null;
  }

  /**
   * 更新最后处理的区块
   */
  async updateLastProcessedBlock(chainId, blockNumber) {
    const query = `
      INSERT OR REPLACE INTO blockchain_sync (chain_id, last_processed_block, last_sync_time)
      VALUES (?, ?, strftime('%s', 'now'))
    `;
    await this.runQuery(query, [chainId, blockNumber]);
  }

  /**
   * 从事件更新市场信息
   */
  async updateMarketFromEvent(eventData) {
    const {
      marketId,
      creator,
      description,
      closingTime,
      oracle,
      txHash,
      blockNumber,
      status
    } = eventData;

    const query = `
      UPDATE markets 
      SET 
        oracle_address = ?,
        tx_hash = ?,
        contract_created = 1,
        status = ?,
        updated_at = strftime('%s', 'now')
      WHERE market_id = ?
    `;

    await this.runQuery(query, [oracle, txHash, status, marketId]);

    // 初始化市场统计
    await this.initializeMarketStatistics(marketId);
  }

  /**
   * 更新市场价格
   */
  async updateMarketPrices(marketId, priceData) {
    const { outcome, newPrice, lastTradeTime } = priceData;

    // 获取当前价格
    const currentPrices = await this.getMarketCurrentPrices(marketId);
    
    // 更新价格
    const outcome0Price = outcome === 0 ? newPrice : currentPrices.outcome_0_price;
    const outcome1Price = outcome === 1 ? newPrice : currentPrices.outcome_1_price;

    // 插入价格历史
    const historyQuery = `
      INSERT INTO market_price_history (
        market_id, outcome_0_price, outcome_1_price, last_trade_time, created_at
      ) VALUES (?, ?, ?, ?, strftime('%s', 'now'))
    `;

    await this.runQuery(historyQuery, [marketId, outcome0Price, outcome1Price, lastTradeTime]);

    console.log(`💰 Updated prices for market ${marketId}`);
  }

  /**
   * 获取市场当前价格
   */
  async getMarketCurrentPrices(marketId) {
    const query = `
      SELECT outcome_0_price, outcome_1_price, total_volume, total_liquidity
      FROM market_price_history 
      WHERE market_id = ? 
      ORDER BY created_at DESC 
      LIMIT 1
    `;

    const row = await this.getQuery(query, [marketId]);
    return row || {
      outcome_0_price: '0.5',
      outcome_1_price: '0.5',
      total_volume: '0',
      total_liquidity: '0'
    };
  }

  /**
   * 插入交易记录
   */
  async insertTransaction(transactionData) {
    const {
      marketId,
      user,
      type,
      outcome,
      shares,
      cost,
      payout,
      txHash,
      blockNumber,
      timestamp
    } = transactionData;

    const query = `
      INSERT INTO transactions (
        tx_hash, market_id, user_address, transaction_type, outcome,
        shares, cost, payout, block_number, block_timestamp, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, strftime('%s', 'now'))
    `;

    await this.runQuery(query, [
      txHash, marketId, user, type, outcome,
      shares, cost || null, payout || null, blockNumber, timestamp
    ]);

    // 更新用户持仓
    await this.updateUserPosition(user, marketId, outcome, type, shares, cost || payout);

    // 更新市场统计
    await this.updateMarketStatistics(marketId);

    console.log(`📊 Inserted ${type} transaction for user ${user}`);
  }

  /**
   * 更新用户持仓
   */
  async updateUserPosition(userAddress, marketId, outcome, type, shares, amount) {
    // 获取当前持仓
    const currentPosition = await this.getUserPosition(userAddress, marketId, outcome);

    let newSharesBalance = currentPosition.shares_balance || '0';
    let newTotalInvested = currentPosition.total_invested || '0';
    let newTotalWithdrawn = currentPosition.total_withdrawn || '0';

    // 使用BigNumber计算
    const BigNumber = require('ethers').BigNumber;
    const currentShares = BigNumber.from(newSharesBalance);
    const sharesAmount = BigNumber.from(shares);
    const amountBN = BigNumber.from(amount);

    if (type === 'buy') {
      newSharesBalance = currentShares.add(sharesAmount).toString();
      newTotalInvested = BigNumber.from(newTotalInvested).add(amountBN).toString();
    } else if (type === 'sell') {
      newSharesBalance = currentShares.sub(sharesAmount).toString();
      newTotalWithdrawn = BigNumber.from(newTotalWithdrawn).add(amountBN).toString();
    }

    const query = `
      INSERT OR REPLACE INTO user_positions (
        user_address, market_id, outcome, shares_balance, 
        total_invested, total_withdrawn, last_updated
      ) VALUES (?, ?, ?, ?, ?, ?, strftime('%s', 'now'))
    `;

    await this.runQuery(query, [
      userAddress, marketId, outcome, newSharesBalance,
      newTotalInvested, newTotalWithdrawn
    ]);
  }

  /**
   * 获取用户持仓
   */
  async getUserPosition(userAddress, marketId, outcome) {
    const query = `
      SELECT * FROM user_positions 
      WHERE user_address = ? AND market_id = ? AND outcome = ?
    `;
    
    const row = await this.getQuery(query, [userAddress, marketId, outcome]);
    return row || {
      shares_balance: '0',
      total_invested: '0',
      total_withdrawn: '0'
    };
  }

  /**
   * 更新市场流动性
   */
  async updateMarketLiquidity(marketId, liquidityData) {
    const {
      action,
      amount,
      payout,
      provider,
      lpTokens,
      txHash,
      timestamp
    } = liquidityData;

    // 插入流动性操作记录
    const query = `
      INSERT INTO liquidity_operations (
        market_id, provider_address, operation_type, amount, 
        lp_tokens, tx_hash, block_timestamp, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, strftime('%s', 'now'))
    `;

    await this.runQuery(query, [
      marketId, provider, action, amount || payout,
      lpTokens, txHash, timestamp
    ]);

    // 更新用户LP代币持仓
    await this.updateUserLPPosition(provider, marketId, action, lpTokens || amount);

    console.log(`💧 Updated liquidity for market ${marketId}: ${action}`);
  }

  /**
   * 更新用户LP代币持仓
   */
  async updateUserLPPosition(userAddress, marketId, action, lpTokens) {
    const currentPosition = await this.getUserPosition(userAddress, marketId, -1); // -1 表示LP持仓
    
    const BigNumber = require('ethers').BigNumber;
    const currentLP = BigNumber.from(currentPosition.lp_tokens || '0');
    const lpAmount = BigNumber.from(lpTokens);

    let newLPBalance;
    if (action === 'add') {
      newLPBalance = currentLP.add(lpAmount).toString();
    } else {
      newLPBalance = currentLP.sub(lpAmount).toString();
    }

    const query = `
      INSERT OR REPLACE INTO user_positions (
        user_address, market_id, outcome, lp_tokens, last_updated
      ) VALUES (?, ?, -1, ?, strftime('%s', 'now'))
    `;

    await this.runQuery(query, [userAddress, marketId, newLPBalance]);
  }

  /**
   * 更新市场状态
   */
  async updateMarketStatus(marketId, statusData) {
    const {
      status,
      winningOutcome,
      finalizeTime,
      txHash,
      resolvedAt
    } = statusData;

    const query = `
      UPDATE markets 
      SET 
        status = ?,
        updated_at = strftime('%s', 'now')
      WHERE market_id = ?
    `;

    await this.runQuery(query, [status, marketId]);

    console.log(`🏁 Updated market ${marketId} status to ${status}`);
  }

  /**
   * 初始化市场统计
   */
  async initializeMarketStatistics(marketId) {
    const query = `
      INSERT OR IGNORE INTO market_statistics (market_id)
      VALUES (?)
    `;
    
    await this.runQuery(query, [marketId]);
  }

  /**
   * 更新市场统计
   */
  async updateMarketStatistics(marketId) {
    // 计算总交易量、交易次数、独特交易者等
    const statsQuery = `
      SELECT 
        COUNT(*) as total_trades,
        COUNT(DISTINCT user_address) as unique_traders,
        COALESCE(SUM(CASE WHEN transaction_type = 'buy' THEN CAST(cost AS DECIMAL) ELSE 0 END), 0) as total_volume
      FROM transactions 
      WHERE market_id = ?
    `;

    const stats = await this.getQuery(statsQuery, [marketId]);

    // 计算流动性提供者数量
    const liquidityQuery = `
      SELECT COUNT(DISTINCT provider_address) as liquidity_providers
      FROM liquidity_operations 
      WHERE market_id = ?
    `;

    const liquidityStats = await this.getQuery(liquidityQuery, [marketId]);

    // 更新统计表
    const updateQuery = `
      UPDATE market_statistics 
      SET 
        total_volume = ?,
        total_trades = ?,
        unique_traders = ?,
        liquidity_providers = ?,
        last_updated = strftime('%s', 'now')
      WHERE market_id = ?
    `;

    await this.runQuery(updateQuery, [
      stats.total_volume.toString(),
      stats.total_trades,
      stats.unique_traders,
      liquidityStats.liquidity_providers,
      marketId
    ]);
  }

  /**
   * 获取用户所有持仓
   */
  async getUserAllPositions(userAddress) {
    const query = `
      SELECT 
        p.*,
        m.title as market_title,
        m.option_a,
        m.option_b,
        m.status as market_status
      FROM user_positions p
      JOIN markets m ON p.market_id = m.market_id
      WHERE p.user_address = ? AND (p.shares_balance != '0' OR p.lp_tokens != '0')
      ORDER BY p.last_updated DESC
    `;

    return await this.allQuery(query, [userAddress]);
  }

  /**
   * 获取市场详细统计
   */
  async getMarketDetailedStats(marketId) {
    const query = `
      SELECT 
        ms.*,
        ph.outcome_0_price,
        ph.outcome_1_price,
        ph.total_liquidity,
        ph.last_trade_time
      FROM market_statistics ms
      LEFT JOIN (
        SELECT * FROM market_price_history 
        WHERE market_id = ? 
        ORDER BY created_at DESC 
        LIMIT 1
      ) ph ON ms.market_id = ph.market_id
      WHERE ms.market_id = ?
    `;

    return await this.getQuery(query, [marketId, marketId]);
  }

  /**
   * 获取交易历史
   */
  async getTransactionHistory(filters = {}) {
    let query = `
      SELECT 
        t.*,
        m.title as market_title
      FROM transactions t
      JOIN markets m ON t.market_id = m.market_id
      WHERE 1=1
    `;
    
    const params = [];

    if (filters.marketId) {
      query += ' AND t.market_id = ?';
      params.push(filters.marketId);
    }

    if (filters.userAddress) {
      query += ' AND t.user_address = ?';
      params.push(filters.userAddress);
    }

    if (filters.transactionType) {
      query += ' AND t.transaction_type = ?';
      params.push(filters.transactionType);
    }

    if (filters.limit) {
      query += ' ORDER BY t.created_at DESC LIMIT ?';
      params.push(filters.limit);
    }

    return await this.allQuery(query, params);
  }

  /**
   * 辅助方法：执行查询
   */
  async runQuery(query, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(query, params, function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, changes: this.changes });
      });
    });
  }

  /**
   * 辅助方法：获取单行
   */
  async getQuery(query, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(query, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  /**
   * 辅助方法：获取所有行
   */
  async allQuery(query, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  // ============ 热点市场管理功能 ============

  /**
   * 设置市场为热点
   * @param {string} marketId - 市场ID
   * @param {number} order - 排序权重 (可选)
   */
  async setMarketHotspot(marketId, order = null) {
    try {
      // 如果没有指定order，获取当前最大order + 1
      if (order === null) {
        const maxOrderResult = await this.getQuery(
          'SELECT MAX(hotspot_order) as max_order FROM markets WHERE is_hotspot = 1'
        );
        order = (maxOrderResult?.max_order || 0) + 1;
      }

      const query = `
        UPDATE markets 
        SET 
          is_hotspot = 1,
          hotspot_order = ?,
          updated_at = strftime('%s', 'now')
        WHERE market_id = ?
      `;

      const result = await this.runQuery(query, [order, marketId]);
      
      if (result.changes === 0) {
        throw new Error(`Market ${marketId} not found`);
      }

      console.log(`🔥 Market ${marketId} set as hotspot with order ${order}`);
      return { success: true, marketId, order };

    } catch (error) {
      console.error('❌ Failed to set market hotspot:', error);
      throw error;
    }
  }

  /**
   * 取消市场热点状态
   * @param {string} marketId - 市场ID
   */
  async removeMarketHotspot(marketId) {
    try {
      const query = `
        UPDATE markets 
        SET 
          is_hotspot = 0,
          hotspot_order = 0,
          updated_at = strftime('%s', 'now')
        WHERE market_id = ?
      `;

      const result = await this.runQuery(query, [marketId]);
      
      if (result.changes === 0) {
        throw new Error(`Market ${marketId} not found`);
      }

      console.log(`❄️ Market ${marketId} removed from hotspots`);
      return { success: true, marketId };

    } catch (error) {
      console.error('❌ Failed to remove market hotspot:', error);
      throw error;
    }
  }

  /**
   * 获取所有热点市场
   * @param {Object} options - 查询选项
   * @param {number} options.limit - 限制数量
   * @param {boolean} options.activeOnly - 只返回活跃市场
   */
  async getHotspotMarkets(options = {}) {
    try {
      const { limit = 20, activeOnly = true } = options;
      
      let query = `
        SELECT 
          m.*,
          CASE 
            WHEN m.resolution_time > strftime('%s', 'now') THEN 'active'
            WHEN m.resolution_time <= strftime('%s', 'now') AND m.status != 'resolved' THEN 'closed'
            ELSE m.status
          END as computed_status
        FROM markets m
        WHERE m.is_hotspot = 1
      `;

      const params = [];

      if (activeOnly) {
        query += ` AND m.status != 'draft'`;
      }

      query += ` ORDER BY m.hotspot_order DESC, m.created_at DESC`;

      if (limit > 0) {
        query += ` LIMIT ?`;
        params.push(limit);
      }

      const markets = await this.allQuery(query, params);
      
      console.log(`🔥 Retrieved ${markets.length} hotspot markets`);
      return markets;

    } catch (error) {
      console.error('❌ Failed to get hotspot markets:', error);
      throw error;
    }
  }

  /**
   * 批量更新热点市场排序
   * @param {Array} orders - 排序数组 [{marketId, order}, ...]
   */
  async updateHotspotOrders(orders) {
    try {
      // 使用事务确保数据一致性
      return new Promise((resolve, reject) => {
        this.db.serialize(() => {
          this.db.run('BEGIN TRANSACTION');

          let completed = 0;
          let hasError = false;

          orders.forEach(({ marketId, order }) => {
            const query = `
              UPDATE markets 
              SET 
                hotspot_order = ?,
                updated_at = strftime('%s', 'now')
              WHERE market_id = ? AND is_hotspot = 1
            `;

            this.db.run(query, [order, marketId], (err) => {
              if (err) {
                hasError = true;
                console.error(`❌ Failed to update order for market ${marketId}:`, err);
              }

              completed++;
              
              if (completed === orders.length) {
                if (hasError) {
                  this.db.run('ROLLBACK');
                  reject(new Error('Failed to update some market orders'));
                } else {
                  this.db.run('COMMIT');
                  console.log(`✅ Updated orders for ${orders.length} hotspot markets`);
                  resolve({ success: true, updated: orders.length });
                }
              }
            });
          });
        });
      });

    } catch (error) {
      console.error('❌ Failed to update hotspot orders:', error);
      throw error;
    }
  }

  /**
   * 获取市场的热点状态
   * @param {string} marketId - 市场ID
   */
  async getMarketHotspotStatus(marketId) {
    try {
      const query = `
        SELECT market_id, is_hotspot, hotspot_order
        FROM markets 
        WHERE market_id = ?
      `;

      const result = await this.getQuery(query, [marketId]);
      
      if (!result) {
        throw new Error(`Market ${marketId} not found`);
      }

      return {
        marketId: result.market_id,
        isHotspot: Boolean(result.is_hotspot),
        order: result.hotspot_order || 0
      };

    } catch (error) {
      console.error('❌ Failed to get market hotspot status:', error);
      throw error;
    }
  }

  /**
   * 切换市场热点状态
   * @param {string} marketId - 市场ID
   */
  async toggleMarketHotspot(marketId) {
    try {
      const status = await this.getMarketHotspotStatus(marketId);
      
      if (status.isHotspot) {
        return await this.removeMarketHotspot(marketId);
      } else {
        return await this.setMarketHotspot(marketId);
      }

    } catch (error) {
      console.error('❌ Failed to toggle market hotspot:', error);
      throw error;
    }
  }
}

module.exports = DatabaseExtensions;