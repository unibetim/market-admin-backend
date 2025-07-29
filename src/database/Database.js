const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs').promises;

class Database {
  constructor() {
    this.db = null;
    this.dbPath = process.env.DB_PATH || './data/markets.sqlite';
  }

  async init() {
    try {
      // 确保数据目录存在
      const dbDir = path.dirname(this.dbPath);
      try {
        await fs.access(dbDir);
      } catch {
        await fs.mkdir(dbDir, { recursive: true });
      }

      // 连接数据库
      return new Promise((resolve, reject) => {
        this.db = new sqlite3.Database(this.dbPath, (err) => {
          if (err) {
            console.error('数据库连接失败:', err.message);
            reject(err);
            return;
          }
          
          console.log('✅ SQLite数据库连接成功');
          this.createTables().then(resolve).catch(reject);
        });
      });
    } catch (error) {
      console.error('数据库初始化失败:', error);
      throw error;
    }
  }

  async createTables() {
    const queries = [
      // 市场管理表
      `CREATE TABLE IF NOT EXISTS markets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        market_id TEXT UNIQUE,
        type TEXT NOT NULL,
        category TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        option_a TEXT NOT NULL,
        option_b TEXT NOT NULL,
        resolution_time INTEGER,
        oracle_address TEXT,
        ipfs_hash TEXT,
        contract_created BOOLEAN DEFAULT 0,
        chain_market_id INTEGER DEFAULT NULL,
        tx_hash TEXT,
        status TEXT DEFAULT 'draft',
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER DEFAULT (strftime('%s', 'now')),
        metadata TEXT
      )`,

      // 资源管理表 - 球队logo等
      `CREATE TABLE IF NOT EXISTS resources (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        category TEXT NOT NULL,
        name TEXT NOT NULL,
        display_name TEXT,
        file_path TEXT,
        file_size INTEGER,
        mime_type TEXT,
        tags TEXT,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER DEFAULT (strftime('%s', 'now'))
      )`,

      // 模板管理表
      `CREATE TABLE IF NOT EXISTS templates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        category TEXT NOT NULL,
        template_data TEXT NOT NULL,
        is_active BOOLEAN DEFAULT 1,
        usage_count INTEGER DEFAULT 0,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER DEFAULT (strftime('%s', 'now'))
      )`,

      // 操作日志表
      `CREATE TABLE IF NOT EXISTS operation_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        operation_type TEXT NOT NULL,
        target_type TEXT NOT NULL,
        target_id TEXT,
        user_id TEXT,
        description TEXT,
        metadata TEXT,
        created_at INTEGER DEFAULT (strftime('%s', 'now'))
      )`,

      // 系统配置表
      `CREATE TABLE IF NOT EXISTS system_config (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        description TEXT,
        updated_at INTEGER DEFAULT (strftime('%s', 'now'))
      )`
    ];

    for (const query of queries) {
      await this.run(query);
    }

    // 创建数据库索引以提高查询性能
    await this.createIndexes();

    // 初始化基础数据
    await this.initializeBasicData();
  }

  async createIndexes() {
    const indexes = [
      // 市场表基础索引
      'CREATE INDEX IF NOT EXISTS idx_markets_market_id ON markets(market_id)',
      'CREATE INDEX IF NOT EXISTS idx_markets_type ON markets(type)',
      'CREATE INDEX IF NOT EXISTS idx_markets_category ON markets(category)',
      'CREATE INDEX IF NOT EXISTS idx_markets_status ON markets(status)',
      'CREATE INDEX IF NOT EXISTS idx_markets_created_at ON markets(created_at)',
      
      // 🚀 性能优化：复合索引，针对常用查询组合
      'CREATE INDEX IF NOT EXISTS idx_markets_status_type_created ON markets(status, type, created_at DESC)',
      'CREATE INDEX IF NOT EXISTS idx_markets_category_status_created ON markets(category, status, created_at DESC)',
      'CREATE INDEX IF NOT EXISTS idx_markets_type_category_status ON markets(type, category, status)',
      
      // 搜索优化索引
      'CREATE INDEX IF NOT EXISTS idx_markets_title ON markets(title COLLATE NOCASE)',
      'CREATE INDEX IF NOT EXISTS idx_markets_search_combo ON markets(status, category, created_at DESC)',
      
      // 资源表索引
      'CREATE INDEX IF NOT EXISTS idx_resources_type ON resources(type)',
      'CREATE INDEX IF NOT EXISTS idx_resources_category ON resources(category)',
      'CREATE INDEX IF NOT EXISTS idx_resources_name ON resources(name)',
      
      // 模板表索引
      'CREATE INDEX IF NOT EXISTS idx_templates_type ON templates(type)',
      'CREATE INDEX IF NOT EXISTS idx_templates_category ON templates(category)',
      'CREATE INDEX IF NOT EXISTS idx_templates_is_active ON templates(is_active)',
      
      // 操作日志表索引
      'CREATE INDEX IF NOT EXISTS idx_operation_logs_operation_type ON operation_logs(operation_type)',
      'CREATE INDEX IF NOT EXISTS idx_operation_logs_target_type ON operation_logs(target_type)',
      'CREATE INDEX IF NOT EXISTS idx_operation_logs_created_at ON operation_logs(created_at)'
    ];

    for (const indexQuery of indexes) {
      try {
        await this.run(indexQuery);
      } catch (error) {
        console.warn('创建索引失败:', indexQuery, error.message);
      }
    }
    
    console.log('✅ 数据库索引创建完成');
  }

  async initializeBasicData() {
    // 插入基础模板数据
    const templates = [
      {
        name: '🏀 NBA比赛',
        type: 'sports',
        category: 'basketball',
        template_data: JSON.stringify({
          type: 'sports',
          category: 'basketball',
          league: 'nba',
          title_template: '{teamA} vs {teamB}',
          description_template: 'NBA常规赛：{teamA} vs {teamB}。预测获胜方。',
          options: {
            optionA: '{teamA}获胜',
            optionB: '{teamB}获胜'
          },
          handicap: null
        })
      },
      {
        name: '⚽ 英超比赛',
        type: 'sports', 
        category: 'football',
        template_data: JSON.stringify({
          type: 'sports',
          category: 'football',
          league: 'premier-league',
          title_template: '{teamA} vs {teamB} (让球{handicap})',
          description_template: '英超联赛：{teamA} vs {teamB}，主队让球{handicap}',
          options: {
            optionA: '上盘（{teamA}让{handicap}球获胜）',
            optionB: '下盘（{teamB}受让{handicap}球获胜）'
          },
          handicap_options: [-2.5, -1.5, -0.5, 0.5, 1.5, 2.5, 3.5]
        })
      },
      {
        name: '💰 比特币价格',
        type: 'finance',
        category: 'crypto',
        template_data: JSON.stringify({
          type: 'finance',
          category: 'crypto',
          asset: 'bitcoin',
          title_template: '比特币价格预测 - {timeframe}',
          description_template: '预测比特币在{timeframe}是否会达到{price}美元',
          options: {
            optionA: '达到目标价格',
            optionB: '未达到目标价格'
          },
          price_ranges: ['50000', '60000', '70000', '80000', '100000']
        })
      }
    ];

    for (const template of templates) {
      try {
        await this.run(`
          INSERT OR IGNORE INTO templates (name, type, category, template_data)
          VALUES (?, ?, ?, ?)
        `, [template.name, template.type, template.category, template.template_data]);
      } catch (error) {
        // 忽略重复插入错误
      }
    }
  }

  // Promise包装的数据库操作
  run(query, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(query, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, changes: this.changes });
        }
      });
    });
  }

  get(query, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(query, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  all(query, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(query, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // 市场相关操作
  async createMarket(marketData) {
    const {
      marketId, type, category, title, description,
      optionA, optionB, resolutionTime, oracleAddress,
      ipfsHash, metadata
    } = marketData;

    return await this.run(`
      INSERT INTO markets (
        market_id, type, category, title, description,
        option_a, option_b, resolution_time, oracle_address,
        ipfs_hash, metadata, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft')
    `, [
      marketId, type, category, title, description,
      optionA, optionB, resolutionTime, oracleAddress,
      ipfsHash, typeof metadata === 'string' ? metadata : JSON.stringify(metadata)
    ]);
  }

  async getMarkets(filters = {}) {
    let query = 'SELECT * FROM markets';
    let params = [];
    let conditions = [];

    if (filters.type) {
      conditions.push('type = ?');
      params.push(filters.type);
    }

    if (filters.category) {
      conditions.push('category = ?');
      params.push(filters.category);
    }

    if (filters.status) {
      conditions.push('status = ?');
      params.push(filters.status);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY created_at DESC';

    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(filters.limit);
    }

    const markets = await this.all(query, params);
    return markets.map(market => ({
      ...market,
      metadata: market.metadata ? JSON.parse(market.metadata) : {}
    }));
  }

  async updateMarketStatus(marketId, status, txHash = null, chainMarketId = null) {
    const params = [status, txHash, chainMarketId, marketId];
    return await this.run(`
      UPDATE markets 
      SET status = ?, tx_hash = ?, chain_market_id = ?, updated_at = strftime('%s', 'now')
      WHERE market_id = ?
    `, params);
  }

  // 资源相关操作
  async addResource(resourceData) {
    const { type, category, name, displayName, filePath, fileSize, mimeType, tags } = resourceData;
    
    return await this.run(`
      INSERT INTO resources (type, category, name, display_name, file_path, file_size, mime_type, tags)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [type, category, name, displayName, filePath, fileSize, mimeType, tags]);
  }

  async getResources(type, category = null) {
    let query = 'SELECT * FROM resources WHERE type = ?';
    let params = [type];

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    query += ' ORDER BY name ASC';
    return await this.all(query, params);
  }

  // 模板相关操作
  async getTemplates(type = null) {
    let query = 'SELECT * FROM templates WHERE is_active = 1';
    let params = [];

    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }

    query += ' ORDER BY usage_count DESC, name ASC';
    const templates = await this.all(query, params);
    
    return templates.map(template => ({
      ...template,
      template_data: JSON.parse(template.template_data)
    }));
  }

  async incrementTemplateUsage(templateId) {
    return await this.run(`
      UPDATE templates 
      SET usage_count = usage_count + 1, updated_at = strftime('%s', 'now')
      WHERE id = ?
    `, [templateId]);
  }

  // 日志记录
  async log(operationType, targetType, targetId, userId, description, metadata = {}) {
    return await this.run(`
      INSERT INTO operation_logs (operation_type, target_type, target_id, user_id, description, metadata)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [operationType, targetType, targetId, userId, description, JSON.stringify(metadata)]);
  }

  // 统计查询
  async getStats() {
    const [totalMarkets, activeMarkets, draftMarkets] = await Promise.all([
      this.get('SELECT COUNT(*) as count FROM markets'),
      this.get('SELECT COUNT(*) as count FROM markets WHERE status = "active"'),
      this.get('SELECT COUNT(*) as count FROM markets WHERE status = "draft"')
    ]);

    const marketsByType = await this.all(`
      SELECT type, COUNT(*) as count 
      FROM markets 
      GROUP BY type 
      ORDER BY count DESC
    `);

    return {
      totalMarkets: totalMarkets.count,
      activeMarkets: activeMarkets.count,
      draftMarkets: draftMarkets.count,
      marketsByType
    };
  }

  // 🚀 性能优化：轻量级市场列表查询（仅查询列表页所需字段）
  async getMarketsListPaginated(filters = {}) {
    const { 
      page = 1, 
      limit = 20, 
      type, 
      category, 
      status, 
      search,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = filters;

    // 查询列表页需要的字段，包含metadata以支持前端显示
    let query = `SELECT 
      market_id, chain_market_id, title, type, category, status, is_hotspot, hotspot_order,
      created_at, updated_at, resolution_time, contract_created, metadata, option_a, option_b
    FROM markets`;
    let countQuery = 'SELECT COUNT(*) as total FROM markets';
    
    const params = [];
    const conditions = [];

    // 构建WHERE条件
    if (type) {
      conditions.push('type = ?');
      params.push(type);
    }

    if (category) {
      conditions.push('category = ?');
      params.push(category);
    }

    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }

    if (search) {
      // 🚀 优化：支持搜索链上ID、标题和数据库ID
      if (isNaN(search)) {
        // 非数字：搜索标题和数据库ID
        conditions.push('(title LIKE ? OR market_id LIKE ?)');
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm);
      } else {
        // 数字：搜索链上ID、标题和数据库ID
        conditions.push('(chain_market_id = ? OR title LIKE ? OR market_id LIKE ?)');
        const searchTerm = `%${search}%`;
        params.push(parseInt(search), searchTerm, searchTerm);
      }
    }

    // 添加WHERE子句
    if (conditions.length > 0) {
      const whereClause = ' WHERE ' + conditions.join(' AND ');
      query += whereClause;
      countQuery += whereClause;
    }

    // 添加排序
    const allowedSortColumns = ['created_at', 'updated_at', 'title', 'type', 'category', 'status', 'hotspot_order'];
    const safeSortBy = allowedSortColumns.includes(sortBy) ? sortBy : 'created_at';
    const safeSortOrder = ['ASC', 'DESC'].includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';
    
    query += ` ORDER BY ${safeSortBy} ${safeSortOrder}`;

    // 添加分页
    const offset = (page - 1) * limit;
    query += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);

    // 执行查询
    const [markets, countResult] = await Promise.all([
      this.all(query, params),
      this.get(countQuery, params.slice(0, -2))
    ]);

    const total = countResult.total;
    const totalPages = Math.ceil(total / limit);

    // 不解析metadata，让前端自己处理
    return {
      data: markets,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    };
  }

  // 优化的分页查询方法（完整字段）
  async getMarketsPaginated(filters = {}) {
    const { 
      page = 1, 
      limit = 20, 
      type, 
      category, 
      status, 
      search,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = filters;

    let query = 'SELECT * FROM markets';
    let countQuery = 'SELECT COUNT(*) as total FROM markets';
    const params = [];
    const conditions = [];

    // 构建WHERE条件
    if (type) {
      conditions.push('type = ?');
      params.push(type);
    }

    if (category) {
      conditions.push('category = ?');
      params.push(category);
    }

    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }

    if (search) {
      // 🚀 优化：支持搜索链上ID、标题、描述等字段
      if (isNaN(search)) {
        // 非数字：搜索文本字段
        conditions.push('(title LIKE ? OR description LIKE ? OR option_a LIKE ? OR option_b LIKE ? OR market_id LIKE ?)');
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
      } else {
        // 数字：优先搜索链上ID，同时搜索文本字段
        conditions.push('(chain_market_id = ? OR title LIKE ? OR description LIKE ? OR option_a LIKE ? OR option_b LIKE ?)');
        const searchTerm = `%${search}%`;
        params.push(parseInt(search), searchTerm, searchTerm, searchTerm, searchTerm);
      }
    }

    // 添加WHERE子句
    if (conditions.length > 0) {
      const whereClause = ' WHERE ' + conditions.join(' AND ');
      query += whereClause;
      countQuery += whereClause;
    }

    // 添加排序
    const allowedSortColumns = ['created_at', 'updated_at', 'title', 'type', 'category', 'status'];
    const safeSortBy = allowedSortColumns.includes(sortBy) ? sortBy : 'created_at';
    const safeSortOrder = ['ASC', 'DESC'].includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';
    
    query += ` ORDER BY ${safeSortBy} ${safeSortOrder}`;

    // 添加分页
    const offset = (page - 1) * limit;
    query += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);

    // 执行查询
    const [markets, countResult] = await Promise.all([
      this.all(query, params),
      this.get(countQuery, params.slice(0, -2)) // 去掉LIMIT和OFFSET参数
    ]);

    const total = countResult.total;
    const totalPages = Math.ceil(total / limit);

    return {
      data: markets,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    };
  }

  // 根据ID快速获取单个市场
  async getMarketById(marketId) {
    const market = await this.get('SELECT * FROM markets WHERE market_id = ? LIMIT 1', [marketId]);
    if (!market) return null;
    
    return {
      ...market,
      metadata: market.metadata ? JSON.parse(market.metadata) : {}
    };
  }

  // 获取市场统计信息
  async getMarketStats() {
    const stats = await this.get(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
        COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft,
        COUNT(CASE WHEN status = 'closed' THEN 1 END) as closed,
        COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved,
        COUNT(CASE WHEN type = 'sports' THEN 1 END) as sports,
        COUNT(CASE WHEN type = 'politics' THEN 1 END) as politics,
        COUNT(CASE WHEN type = 'crypto' THEN 1 END) as crypto
      FROM markets
    `);
    
    return stats;
  }

  isConnected() {
    return this.db !== null;
  }

  async close() {
    if (this.db) {
      return new Promise((resolve) => {
        this.db.close((err) => {
          if (err) {
            console.error('关闭数据库时出错:', err.message);
          }
          this.db = null;
          resolve();
        });
      });
    }
  }
}

module.exports = Database;
