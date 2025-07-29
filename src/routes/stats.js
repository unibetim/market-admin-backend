const express = require('express');
const router = express.Router();

/**
 * 获取系统统计信息
 */
router.get('/', async (req, res) => {
  try {
    // 获取基础统计
    const basicStats = await req.app.locals.db.getStats();
    
    // 获取最近活动
    const recentLogs = await req.app.locals.db.all(`
      SELECT * FROM operation_logs 
      ORDER BY created_at DESC 
      LIMIT 10
    `);

    // 格式化日志
    const formattedLogs = recentLogs.map(log => ({
      ...log,
      metadata: log.metadata ? JSON.parse(log.metadata) : {},
      created_at_formatted: new Date(log.created_at * 1000).toLocaleString('zh-CN')
    }));

    // 获取每日市场创建统计 (最近7天)
    const dailyStats = await req.app.locals.db.all(`
      SELECT 
        date(created_at, 'unixepoch', 'localtime') as date,
        COUNT(*) as count
      FROM markets 
      WHERE created_at >= strftime('%s', 'now', '-7 days')
      GROUP BY date(created_at, 'unixepoch', 'localtime')
      ORDER BY date DESC
    `);

    // 获取模板使用统计
    const templateStats = await req.app.locals.db.all(`
      SELECT id, name, type, category, usage_count
      FROM templates 
      WHERE is_active = 1
      ORDER BY usage_count DESC
      LIMIT 5
    `);

    res.json({
      success: true,
      data: {
        basic: basicStats,
        recentActivity: formattedLogs,
        dailyCreation: dailyStats,
        popularTemplates: templateStats,
        summary: {
          totalMarkets: basicStats.totalMarkets,
          activeMarkets: basicStats.activeMarkets,
          draftMarkets: basicStats.draftMarkets,
          successRate: basicStats.totalMarkets > 0 
            ? Math.round((basicStats.activeMarkets / basicStats.totalMarkets) * 100) 
            : 0
        }
      }
    });

  } catch (error) {
    console.error('获取统计信息失败:', error);
    res.status(500).json({
      success: false,
      message: '获取统计信息失败',
      error: error.message
    });
  }
});

/**
 * 获取市场类型分布
 */
router.get('/market-distribution', async (req, res) => {
  try {
    const typeDistribution = await req.app.locals.db.all(`
      SELECT 
        type,
        category,
        COUNT(*) as count,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_count
      FROM markets 
      GROUP BY type, category
      ORDER BY count DESC
    `);

    const statusDistribution = await req.app.locals.db.all(`
      SELECT 
        status,
        COUNT(*) as count
      FROM markets 
      GROUP BY status
    `);

    res.json({
      success: true,
      data: {
        byType: typeDistribution,
        byStatus: statusDistribution
      }
    });

  } catch (error) {
    console.error('获取市场分布失败:', error);
    res.status(500).json({
      success: false,
      message: '获取市场分布失败',
      error: error.message
    });
  }
});

/**
 * 获取操作日志
 */
router.get('/logs', async (req, res) => {
  try {
    const { 
      type, 
      target_type, 
      limit = 50, 
      offset = 0,
      start_date,
      end_date 
    } = req.query;

    let query = 'SELECT * FROM operation_logs WHERE 1=1';
    let params = [];

    if (type) {
      query += ' AND operation_type = ?';
      params.push(type);
    }

    if (target_type) {
      query += ' AND target_type = ?';
      params.push(target_type);
    }

    if (start_date) {
      query += ' AND created_at >= ?';
      params.push(Math.floor(new Date(start_date).getTime() / 1000));
    }

    if (end_date) {
      query += ' AND created_at <= ?';
      params.push(Math.floor(new Date(end_date).getTime() / 1000));
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const logs = await req.app.locals.db.all(query, params);

    // 格式化日志
    const formattedLogs = logs.map(log => ({
      ...log,
      metadata: log.metadata ? JSON.parse(log.metadata) : {},
      created_at_formatted: new Date(log.created_at * 1000).toLocaleString('zh-CN')
    }));

    // 获取总数
    let countQuery = 'SELECT COUNT(*) as total FROM operation_logs WHERE 1=1';
    let countParams = [];

    if (type) {
      countQuery += ' AND operation_type = ?';
      countParams.push(type);
    }

    if (target_type) {
      countQuery += ' AND target_type = ?';
      countParams.push(target_type);
    }

    if (start_date) {
      countQuery += ' AND created_at >= ?';
      countParams.push(Math.floor(new Date(start_date).getTime() / 1000));
    }

    if (end_date) {
      countQuery += ' AND created_at <= ?';
      countParams.push(Math.floor(new Date(end_date).getTime() / 1000));
    }

    const countResult = await req.app.locals.db.get(countQuery, countParams);

    res.json({
      success: true,
      data: formattedLogs,
      pagination: {
        total: countResult.total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: countResult.total > (parseInt(offset) + parseInt(limit))
      }
    });

  } catch (error) {
    console.error('获取操作日志失败:', error);
    res.status(500).json({
      success: false,
      message: '获取操作日志失败',
      error: error.message
    });
  }
});

/**
 * 获取系统性能信息
 */
router.get('/performance', async (req, res) => {
  try {
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();
    
    // 数据库状态
    const dbStats = {
      connected: req.app.locals.db.isConnected(),
      tablesCount: 5, // 我们有5个主要表
    };

    // IPFS性能 (如果有的话)
    const IPFSManager = require('../utils/ipfsManager');
    const ipfsManager = new IPFSManager();
    const ipfsStats = ipfsManager.getCacheInfo();

    // Web3状态
    const Web3Manager = require('../utils/web3Manager');
    const web3Manager = new Web3Manager();
    const networkStatus = await web3Manager.getNetworkStatus(97);

    res.json({
      success: true,
      data: {
        system: {
          uptime: Math.floor(uptime),
          uptimeFormatted: formatUptime(uptime),
          nodeVersion: process.version,
          platform: process.platform,
          arch: process.arch
        },
        memory: {
          rss: Math.round(memoryUsage.rss / 1024 / 1024),
          heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
          heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
          external: Math.round(memoryUsage.external / 1024 / 1024)
        },
        database: dbStats,
        ipfs: ipfsStats,
        blockchain: networkStatus
      }
    });

  } catch (error) {
    console.error('获取性能信息失败:', error);
    res.status(500).json({
      success: false,
      message: '获取性能信息失败',
      error: error.message
    });
  }
});

/**
 * 格式化运行时间
 */
function formatUptime(seconds) {
  const days = Math.floor(seconds / (24 * 60 * 60));
  const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((seconds % (60 * 60)) / 60);
  
  if (days > 0) {
    return `${days}天 ${hours}小时 ${minutes}分钟`;
  } else if (hours > 0) {
    return `${hours}小时 ${minutes}分钟`;
  } else {
    return `${minutes}分钟`;
  }
}

/**
 * 清理旧日志
 */
router.post('/cleanup-logs', async (req, res) => {
  try {
    const { days = 30 } = req.body;
    
    const cutoffTime = Math.floor(Date.now() / 1000) - (days * 24 * 60 * 60);
    
    const result = await req.app.locals.db.run(`
      DELETE FROM operation_logs 
      WHERE created_at < ?
    `, [cutoffTime]);

    await req.app.locals.db.log(
      'cleanup_logs',
      'system',
      'logs',
      'admin',
      `清理${days}天前的日志，删除${result.changes}条记录`
    );

    res.json({
      success: true,
      message: '日志清理完成',
      data: {
        deletedCount: result.changes,
        cutoffDays: days
      }
    });

  } catch (error) {
    console.error('清理日志失败:', error);
    res.status(500).json({
      success: false,
      message: '清理日志失败',
      error: error.message
    });
  }
});

/**
 * 导出统计数据
 */
router.get('/export', async (req, res) => {
  try {
    const { format = 'json', type = 'basic' } = req.query;

    let data = {};

    switch (type) {
      case 'basic':
        data = await req.app.locals.db.getStats();
        break;
      case 'markets':
        data = await req.app.locals.db.getMarkets();
        break;
      case 'logs':
        data = await req.app.locals.db.all(`
          SELECT * FROM operation_logs 
          ORDER BY created_at DESC 
          LIMIT 1000
        `);
        break;
      default:
        data = await req.app.locals.db.getStats();
    }

    if (format === 'csv') {
      // 这里可以实现CSV导出逻辑
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="stats_${type}_${Date.now()}.csv"`);
      res.send('CSV format not implemented yet');
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="stats_${type}_${Date.now()}.json"`);
      res.json({
        success: true,
        exportTime: new Date().toISOString(),
        type,
        data
      });
    }

  } catch (error) {
    console.error('导出统计数据失败:', error);
    res.status(500).json({
      success: false,
      message: '导出统计数据失败',
      error: error.message
    });
  }
});

module.exports = router;