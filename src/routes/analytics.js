const express = require('express');
const router = express.Router();

// 🎯 专业级统计分析系统
// 支持市场分析、用户行为分析、财务统计、趋势预测等

/**
 * 📊 获取总览仪表板数据
 */
router.get('/dashboard/overview', async (req, res) => {
  try {
    const { period = '7d', timezone = 'UTC' } = req.query;
    
    // 计算时间范围
    const timeRange = calculateTimeRange(period);
    
    // 并行获取各种统计数据
    const [
      marketStats,
      userStats,
      financialStats,
      activityStats,
      performanceStats
    ] = await Promise.all([
      getMarketStats(req.app.locals.db, timeRange),
      getUserStats(req.app.locals.db, timeRange),
      getFinancialStats(req.app.locals.db, timeRange),
      getActivityStats(req.app.locals.db, timeRange),
      getPerformanceStats(req.app.locals.db, timeRange)
    ]);

    res.json({
      success: true,
      data: {
        period,
        timeRange,
        market: marketStats,
        user: userStats,
        financial: financialStats,
        activity: activityStats,
        performance: performanceStats,
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('获取总览数据失败:', error);
    res.status(500).json({
      success: false,
      message: '获取总览数据失败',
      error: error.message
    });
  }
});

/**
 * 📈 获取市场趋势分析
 */
router.get('/markets/trends', async (req, res) => {
  try {
    const { 
      period = '30d',
      type,
      category,
      granularity = 'daily',
      metrics = 'volume,liquidity,count'
    } = req.query;

    const timeRange = calculateTimeRange(period);
    const requestedMetrics = metrics.split(',');
    
    // 获取市场趋势数据
    const trendData = await getMarketTrends(
      req.app.locals.db, 
      timeRange,
      { type, category, granularity, metrics: requestedMetrics }
    );

    // 计算趋势指标
    const trendAnalysis = calculateTrendAnalysis(trendData, requestedMetrics);

    res.json({
      success: true,
      data: {
        period,
        granularity,
        metrics: requestedMetrics,
        trends: trendData,
        analysis: trendAnalysis,
        insights: generateTrendInsights(trendAnalysis)
      }
    });

  } catch (error) {
    console.error('获取市场趋势失败:', error);
    res.status(500).json({
      success: false,
      message: '获取市场趋势失败',
      error: error.message
    });
  }
});

/**
 * 👥 获取用户行为分析
 */
router.get('/users/behavior', async (req, res) => {
  try {
    const { 
      period = '7d',
      segment = 'all',
      cohort,
      metrics = 'engagement,retention,conversion'
    } = req.query;

    const timeRange = calculateTimeRange(period);
    const requestedMetrics = metrics.split(',');
    
    // 获取用户行为数据
    const behaviorData = await getUserBehaviorAnalysis(
      req.app.locals.db,
      timeRange,
      { segment, cohort, metrics: requestedMetrics }
    );

    // 生成用户洞察
    const insights = generateUserInsights(behaviorData);

    res.json({
      success: true,
      data: {
        period,
        segment,
        metrics: requestedMetrics,
        behavior: behaviorData,
        insights,
        recommendations: generateUserRecommendations(behaviorData)
      }
    });

  } catch (error) {
    console.error('获取用户行为分析失败:', error);
    res.status(500).json({
      success: false,
      message: '获取用户行为分析失败',
      error: error.message
    });
  }
});

/**
 * 💰 获取财务分析报告
 */
router.get('/financial/report', async (req, res) => {
  try {
    const { 
      period = '30d',
      breakdown = 'daily',
      currency = 'USDC',
      includeProjections = false
    } = req.query;

    const timeRange = calculateTimeRange(period);
    
    // 获取财务数据
    const financialData = await getDetailedFinancialAnalysis(
      req.app.locals.db,
      timeRange,
      { breakdown, currency }
    );

    // 可选：包含预测数据
    let projections = null;
    if (includeProjections === 'true') {
      projections = await generateFinancialProjections(financialData);
    }

    res.json({
      success: true,
      data: {
        period,
        breakdown,
        currency,
        financial: financialData,
        projections,
        insights: generateFinancialInsights(financialData),
        riskAnalysis: calculateRiskMetrics(financialData)
      }
    });

  } catch (error) {
    console.error('获取财务分析失败:', error);
    res.status(500).json({
      success: false,
      message: '获取财务分析失败',
      error: error.message
    });
  }
});

/**
 * 🔥 获取热点数据分析
 */
router.get('/hotspots', async (req, res) => {
  try {
    const { 
      period = '24h',
      limit = 10,
      category = 'all'
    } = req.query;

    const timeRange = calculateTimeRange(period);
    
    // 获取各类热点数据
    const hotspots = await getHotspotAnalysis(
      req.app.locals.db,
      timeRange,
      { limit: parseInt(limit), category }
    );

    res.json({
      success: true,
      data: {
        period,
        hotspots,
        trending: hotspots.trending,
        rising: hotspots.rising,
        declining: hotspots.declining,
        insights: generateHotspotInsights(hotspots)
      }
    });

  } catch (error) {
    console.error('获取热点分析失败:', error);
    res.status(500).json({
      success: false,
      message: '获取热点分析失败',
      error: error.message
    });
  }
});

/**
 * 📊 获取预测准确性分析
 */
router.get('/predictions/accuracy', async (req, res) => {
  try {
    const { 
      period = '30d',
      market_type,
      category,
      min_participants = 10
    } = req.query;

    const timeRange = calculateTimeRange(period);
    
    // 获取预测准确性数据
    const accuracyData = await getPredictionAccuracyAnalysis(
      req.app.locals.db,
      timeRange,
      { market_type, category, min_participants: parseInt(min_participants) }
    );

    res.json({
      success: true,
      data: {
        period,
        accuracy: accuracyData,
        insights: generateAccuracyInsights(accuracyData),
        calibration: calculateCalibrationMetrics(accuracyData)
      }
    });

  } catch (error) {
    console.error('获取预测准确性分析失败:', error);
    res.status(500).json({
      success: false,
      message: '获取预测准确性分析失败',
      error: error.message
    });
  }
});

/**
 * 🎯 获取自定义分析报告
 */
router.post('/custom/report', async (req, res) => {
  try {
    const {
      name,
      description,
      timeRange,
      filters,
      metrics,
      groupBy,
      orderBy,
      limit = 100
    } = req.body;

    // 验证请求参数
    if (!name || !timeRange || !metrics || metrics.length === 0) {
      return res.status(400).json({
        success: false,
        message: '缺少必填参数',
        required: ['name', 'timeRange', 'metrics']
      });
    }

    // 执行自定义分析查询
    const analysisData = await executeCustomAnalysis(
      req.app.locals.db,
      {
        timeRange: calculateTimeRange(timeRange.period, timeRange.start, timeRange.end),
        filters,
        metrics,
        groupBy,
        orderBy,
        limit: parseInt(limit)
      }
    );

    // 生成报告
    const report = {
      id: `custom_${Date.now()}`,
      name,
      description,
      parameters: { timeRange, filters, metrics, groupBy, orderBy, limit },
      data: analysisData.results,
      summary: analysisData.summary,
      insights: generateCustomInsights(analysisData.results, metrics),
      generatedAt: new Date().toISOString()
    };

    // 可选：保存报告到数据库
    if (req.body.save) {
      await saveCustomReport(req.app.locals.db, report, 'admin');
    }

    res.json({
      success: true,
      data: report
    });

  } catch (error) {
    console.error('生成自定义分析报告失败:', error);
    res.status(500).json({
      success: false,
      message: '生成自定义分析报告失败',
      error: error.message
    });
  }
});

/**
 * 📋 获取已保存的分析报告列表
 */
router.get('/reports', async (req, res) => {
  try {
    const { 
      limit = 20, 
      offset = 0,
      type = 'all',
      created_by
    } = req.query;

    let query = `
      SELECT id, name, description, type, parameters, summary, created_by, created_at, updated_at
      FROM analytics_reports 
      WHERE 1=1
    `;
    const params = [];

    if (type !== 'all') {
      query += ' AND type = ?';
      params.push(type);
    }

    if (created_by) {
      query += ' AND created_by = ?';
      params.push(created_by);
    }

    query += ' ORDER BY updated_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const reports = await req.app.locals.db.all(query, params);

    // 获取总数
    let countQuery = 'SELECT COUNT(*) as total FROM analytics_reports WHERE 1=1';
    const countParams = [];

    if (type !== 'all') {
      countQuery += ' AND type = ?';
      countParams.push(type);
    }
    if (created_by) {
      countQuery += ' AND created_by = ?';
      countParams.push(created_by);
    }

    const countResult = await req.app.locals.db.get(countQuery, countParams);

    res.json({
      success: true,
      data: reports.map(report => ({
        ...report,
        parameters: typeof report.parameters === 'string' 
          ? JSON.parse(report.parameters) 
          : report.parameters,
        summary: typeof report.summary === 'string' 
          ? JSON.parse(report.summary) 
          : report.summary
      })),
      pagination: {
        total: countResult.total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: countResult.total > parseInt(offset) + parseInt(limit)
      }
    });

  } catch (error) {
    console.error('获取分析报告列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取分析报告列表失败',
      error: error.message
    });
  }
});

/**
 * 📊 获取实时数据监控
 */
router.get('/realtime/monitor', async (req, res) => {
  try {
    const { 
      metrics = 'active_markets,online_users,current_volume,pending_resolutions',
      refresh_interval = 30
    } = req.query;

    const requestedMetrics = metrics.split(',');
    
    // 获取实时数据
    const realtimeData = await getRealtimeMetrics(
      req.app.locals.db,
      requestedMetrics
    );

    // 添加系统状态信息
    const systemStatus = await getSystemStatus(req.app.locals.db);

    res.json({
      success: true,
      data: {
        metrics: realtimeData,
        system: systemStatus,
        refreshInterval: parseInt(refresh_interval),
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('获取实时监控数据失败:', error);
    res.status(500).json({
      success: false,
      message: '获取实时监控数据失败',
      error: error.message
    });
  }
});

/**
 * 🔍 获取异常检测报告
 */
router.get('/anomalies', async (req, res) => {
  try {
    const { 
      period = '24h',
      severity = 'medium',
      type = 'all'
    } = req.query;

    const timeRange = calculateTimeRange(period);
    
    // 执行异常检测
    const anomalies = await detectAnomalies(
      req.app.locals.db,
      timeRange,
      { severity, type }
    );

    res.json({
      success: true,
      data: {
        period,
        anomalies: anomalies.detected,
        summary: anomalies.summary,
        recommendations: generateAnomalyRecommendations(anomalies.detected)
      }
    });

  } catch (error) {
    console.error('获取异常检测报告失败:', error);
    res.status(500).json({
      success: false,
      message: '获取异常检测报告失败',
      error: error.message
    });
  }
});

// ==================== 辅助函数 ====================

/**
 * 计算时间范围
 */
function calculateTimeRange(period, customStart, customEnd) {
  const now = Math.floor(Date.now() / 1000);
  
  if (customStart && customEnd) {
    return {
      start: Math.floor(new Date(customStart).getTime() / 1000),
      end: Math.floor(new Date(customEnd).getTime() / 1000)
    };
  }
  
  const periodMap = {
    '1h': 3600,
    '6h': 6 * 3600,
    '24h': 24 * 3600,
    '7d': 7 * 24 * 3600,
    '30d': 30 * 24 * 3600,
    '90d': 90 * 24 * 3600,
    '1y': 365 * 24 * 3600
  };
  
  const seconds = periodMap[period] || periodMap['7d'];
  
  return {
    start: now - seconds,
    end: now
  };
}

/**
 * 获取市场统计数据
 */
async function getMarketStats(db, timeRange) {
  try {
    // 总市场数
    const totalMarkets = await db.get(`
      SELECT COUNT(*) as count FROM markets 
      WHERE created_at BETWEEN ? AND ?
    `, [timeRange.start, timeRange.end]);

    // 按状态分组
    const marketsByStatus = await db.all(`
      SELECT status, COUNT(*) as count 
      FROM markets 
      WHERE created_at BETWEEN ? AND ?
      GROUP BY status
    `, [timeRange.start, timeRange.end]);

    // 按类型分组
    const marketsByType = await db.all(`
      SELECT type, COUNT(*) as count 
      FROM markets 
      WHERE created_at BETWEEN ? AND ?
      GROUP BY type
    `, [timeRange.start, timeRange.end]);

    // 总交易量
    const totalVolume = await db.get(`
      SELECT 
        COALESCE(SUM(volume), 0) as total_volume,
        COALESCE(SUM(liquidity), 0) as total_liquidity,
        COALESCE(AVG(volume), 0) as avg_volume
      FROM markets 
      WHERE created_at BETWEEN ? AND ?
    `, [timeRange.start, timeRange.end]);

    return {
      total: totalMarkets.count,
      byStatus: marketsByStatus.reduce((acc, item) => {
        acc[item.status] = item.count;
        return acc;
      }, {}),
      byType: marketsByType.reduce((acc, item) => {
        acc[item.type] = item.count;
        return acc;
      }, {}),
      volume: {
        total: totalVolume.total_volume,
        average: totalVolume.avg_volume,
        totalLiquidity: totalVolume.total_liquidity
      }
    };
  } catch (error) {
    console.error('获取市场统计失败:', error);
    return {
      total: 0,
      byStatus: {},
      byType: {},
      volume: { total: 0, average: 0, totalLiquidity: 0 }
    };
  }
}

/**
 * 获取用户统计数据
 */
async function getUserStats(db, timeRange) {
  try {
    // 注意：这里假设有用户相关的表，实际需要根据数据库结构调整
    const activeUsers = await db.get(`
      SELECT COUNT(DISTINCT created_by) as count 
      FROM action_logs 
      WHERE timestamp BETWEEN ? AND ?
    `, [timeRange.start, timeRange.end]);

    // 新用户
    const newUsers = await db.get(`
      SELECT COUNT(DISTINCT created_by) as count 
      FROM action_logs 
      WHERE action = 'create_market' AND timestamp BETWEEN ? AND ?
    `, [timeRange.start, timeRange.end]);

    // 用户活动
    const userActivity = await db.all(`
      SELECT action, COUNT(*) as count 
      FROM action_logs 
      WHERE timestamp BETWEEN ? AND ?
      GROUP BY action
      ORDER BY count DESC
      LIMIT 10
    `, [timeRange.start, timeRange.end]);

    return {
      active: activeUsers.count,
      new: newUsers.count,
      activity: userActivity
    };
  } catch (error) {
    console.error('获取用户统计失败:', error);
    return {
      active: 0,
      new: 0,
      activity: []
    };
  }
}

/**
 * 获取财务统计数据
 */
async function getFinancialStats(db, timeRange) {
  try {
    // 总收入（手续费）
    const revenue = await db.get(`
      SELECT 
        COALESCE(SUM(CASE WHEN action LIKE '%fee%' THEN CAST(details AS REAL) ELSE 0 END), 0) as total_fees,
        COUNT(CASE WHEN action LIKE '%fee%' THEN 1 END) as fee_transactions
      FROM action_logs 
      WHERE timestamp BETWEEN ? AND ?
    `, [timeRange.start, timeRange.end]);

    // 流动性变化
    const liquidityStats = await db.get(`
      SELECT 
        COALESCE(SUM(liquidity), 0) as total_liquidity,
        COALESCE(AVG(liquidity), 0) as avg_liquidity,
        COUNT(*) as markets_with_liquidity
      FROM markets 
      WHERE created_at BETWEEN ? AND ? AND liquidity > 0
    `, [timeRange.start, timeRange.end]);

    return {
      revenue: {
        totalFees: revenue.total_fees,
        feeTransactions: revenue.fee_transactions
      },
      liquidity: {
        total: liquidityStats.total_liquidity,
        average: liquidityStats.avg_liquidity,
        marketsCount: liquidityStats.markets_with_liquidity
      }
    };
  } catch (error) {
    console.error('获取财务统计失败:', error);
    return {
      revenue: { totalFees: 0, feeTransactions: 0 },
      liquidity: { total: 0, average: 0, marketsCount: 0 }
    };
  }
}

/**
 * 获取活动统计数据
 */
async function getActivityStats(db, timeRange) {
  try {
    // 总活动数
    const totalActivity = await db.get(`
      SELECT COUNT(*) as count 
      FROM action_logs 
      WHERE timestamp BETWEEN ? AND ?
    `, [timeRange.start, timeRange.end]);

    // 按小时分组的活动
    const hourlyActivity = await db.all(`
      SELECT 
        strftime('%H', datetime(timestamp, 'unixepoch')) as hour,
        COUNT(*) as count
      FROM action_logs 
      WHERE timestamp BETWEEN ? AND ?
      GROUP BY hour
      ORDER BY hour
    `, [timeRange.start, timeRange.end]);

    // 最活跃的操作类型
    const topActions = await db.all(`
      SELECT action, COUNT(*) as count 
      FROM action_logs 
      WHERE timestamp BETWEEN ? AND ?
      GROUP BY action
      ORDER BY count DESC
      LIMIT 5
    `, [timeRange.start, timeRange.end]);

    return {
      total: totalActivity.count,
      hourly: hourlyActivity,
      topActions
    };
  } catch (error) {
    console.error('获取活动统计失败:', error);
    return {
      total: 0,
      hourly: [],
      topActions: []
    };
  }
}

/**
 * 获取性能统计数据
 */
async function getPerformanceStats(db, timeRange) {
  try {
    // 数据库大小和行数
    const dbStats = await db.all(`
      SELECT 
        name,
        COUNT(*) as row_count
      FROM sqlite_master 
      WHERE type='table' AND name IN ('markets', 'action_logs', 'templates', 'resources')
    `);

    // 最新的系统操作响应时间（从日志中计算）
    const performanceMetrics = await db.all(`
      SELECT 
        action,
        AVG(CASE WHEN details LIKE '%time%' THEN CAST(substr(details, instr(details, ':')+1) AS REAL) ELSE 0 END) as avg_time
      FROM action_logs 
      WHERE timestamp BETWEEN ? AND ? AND details LIKE '%time%'
      GROUP BY action
      HAVING avg_time > 0
      ORDER BY avg_time DESC
      LIMIT 5
    `, [timeRange.start, timeRange.end]);

    return {
      database: dbStats.reduce((acc, item) => {
        acc[item.name] = item.row_count;
        return acc;
      }, {}),
      responseTime: performanceMetrics
    };
  } catch (error) {
    console.error('获取性能统计失败:', error);
    return {
      database: {},
      responseTime: []
    };
  }
}

/**
 * 获取市场趋势数据
 */
async function getMarketTrends(db, timeRange, options) {
  const { type, category, granularity } = options;
  
  // 根据粒度确定时间分组
  let timeGrouping;
  switch (granularity) {
    case 'hourly':
      timeGrouping = "strftime('%Y-%m-%d %H:00:00', datetime(created_at, 'unixepoch'))";
      break;
    case 'daily':
      timeGrouping = "strftime('%Y-%m-%d', datetime(created_at, 'unixepoch'))";
      break;
    case 'weekly':
      timeGrouping = "strftime('%Y-W%W', datetime(created_at, 'unixepoch'))";
      break;
    case 'monthly':
      timeGrouping = "strftime('%Y-%m', datetime(created_at, 'unixepoch'))";
      break;
    default:
      timeGrouping = "strftime('%Y-%m-%d', datetime(created_at, 'unixepoch'))";
  }

  let query = `
    SELECT 
      ${timeGrouping} as time_period,
      COUNT(*) as market_count,
      COALESCE(SUM(volume), 0) as total_volume,
      COALESCE(SUM(liquidity), 0) as total_liquidity,
      COALESCE(AVG(volume), 0) as avg_volume
    FROM markets 
    WHERE created_at BETWEEN ? AND ?
  `;
  
  const params = [timeRange.start, timeRange.end];
  
  if (type) {
    query += ' AND type = ?';
    params.push(type);
  }
  
  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }
  
  query += ` GROUP BY ${timeGrouping} ORDER BY time_period`;

  return await db.all(query, params);
}

/**
 * 计算趋势分析
 */
function calculateTrendAnalysis(trendData, metrics) {
  if (!trendData || trendData.length < 2) {
    return { trend: 'insufficient_data', change: 0, confidence: 0 };
  }

  const analysis = {};
  
  metrics.forEach(metric => {
    const values = trendData.map(d => d[`total_${metric}`] || d[`${metric}_count`] || 0);
    const firstValue = values[0];
    const lastValue = values[values.length - 1];
    
    if (firstValue === 0) {
      analysis[metric] = { trend: 'new', change: lastValue, confidence: 0.5 };
    } else {
      const change = ((lastValue - firstValue) / firstValue) * 100;
      let trend = 'stable';
      
      if (change > 10) trend = 'increasing';
      else if (change < -10) trend = 'decreasing';
      
      analysis[metric] = {
        trend,
        change: Math.round(change * 100) / 100,
        confidence: Math.min(values.length / 10, 1) // 置信度基于数据点数量
      };
    }
  });
  
  return analysis;
}

/**
 * 生成趋势洞察
 */
function generateTrendInsights(trendAnalysis) {
  const insights = [];
  
  Object.entries(trendAnalysis).forEach(([metric, analysis]) => {
    const { trend, change, confidence } = analysis;
    
    if (confidence < 0.3) {
      insights.push({
        type: 'warning',
        metric,
        message: `${metric}数据样本较少，建议延长观察期间以获得更准确的趋势分析`
      });
    } else if (trend === 'increasing' && change > 20) {
      insights.push({
        type: 'positive',
        metric,
        message: `${metric}呈现强劲增长趋势，增长率为${change.toFixed(1)}%`
      });
    } else if (trend === 'decreasing' && change < -20) {
      insights.push({
        type: 'warning',
        metric,
        message: `${metric}出现显著下降，下降幅度为${Math.abs(change).toFixed(1)}%，需要关注`
      });
    }
  });
  
  return insights;
}

/**
 * 获取实时指标
 */
async function getRealtimeMetrics(db, metrics) {
  const realtimeData = {};
  
  for (const metric of metrics) {
    try {
      switch (metric) {
        case 'active_markets':
          const activeMarkets = await db.get("SELECT COUNT(*) as count FROM markets WHERE status = 'active'");
          realtimeData[metric] = activeMarkets.count;
          break;
          
        case 'online_users':
          // 基于最近5分钟的活动判断在线用户
          const fiveMinutesAgo = Math.floor(Date.now() / 1000) - 300;
          const onlineUsers = await db.get(
            "SELECT COUNT(DISTINCT created_by) as count FROM action_logs WHERE timestamp > ?",
            [fiveMinutesAgo]
          );
          realtimeData[metric] = onlineUsers.count;
          break;
          
        case 'current_volume':
          const currentVolume = await db.get("SELECT COALESCE(SUM(volume), 0) as total FROM markets WHERE status = 'active'");
          realtimeData[metric] = currentVolume.total;
          break;
          
        case 'pending_resolutions':
          const pendingResolutions = await db.get("SELECT COUNT(*) as count FROM markets WHERE status = 'closed'");
          realtimeData[metric] = pendingResolutions.count;
          break;
          
        default:
          realtimeData[metric] = 0;
      }
    } catch (error) {
      console.error(`获取实时指标${metric}失败:`, error);
      realtimeData[metric] = 0;
    }
  }
  
  return realtimeData;
}

/**
 * 获取系统状态
 */
async function getSystemStatus(db) {
  try {
    // 检查数据库连接
    await db.get("SELECT 1");
    
    // 获取最后活动时间
    const lastActivity = await db.get("SELECT MAX(timestamp) as last_activity FROM action_logs");
    
    return {
      database: 'healthy',
      lastActivity: lastActivity.last_activity,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      timestamp: Math.floor(Date.now() / 1000)
    };
  } catch (error) {
    return {
      database: 'error',
      error: error.message,
      timestamp: Math.floor(Date.now() / 1000)
    };
  }
}

/**
 * 检测异常
 */
async function detectAnomalies(db, timeRange, options) {
  // 这是一个简化的异常检测实现
  // 实际生产环境中可能需要更复杂的统计学方法
  
  const anomalies = [];
  const { severity, type } = options;
  
  try {
    // 检测异常高的市场创建频率
    const marketCreationRate = await db.get(`
      SELECT COUNT(*) as count 
      FROM markets 
      WHERE created_at > ?
    `, [timeRange.start]);
    
    // 如果市场创建数量异常高（这里简单设定阈值）
    if (marketCreationRate.count > 100) {
      anomalies.push({
        type: 'high_market_creation',
        severity: 'medium',
        value: marketCreationRate.count,
        threshold: 100,
        description: '市场创建频率异常高',
        detectedAt: new Date().toISOString()
      });
    }
    
    // 检测异常的用户活动
    const userActivity = await db.get(`
      SELECT COUNT(DISTINCT created_by) as unique_users
      FROM action_logs 
      WHERE timestamp > ?
    `, [timeRange.start]);
    
    if (userActivity.unique_users < 5) {
      anomalies.push({
        type: 'low_user_activity',
        severity: 'high',
        value: userActivity.unique_users,
        threshold: 5,
        description: '用户活跃度异常低',
        detectedAt: new Date().toISOString()
      });
    }
    
    return {
      detected: anomalies,
      summary: {
        total: anomalies.length,
        bySeverity: anomalies.reduce((acc, anomaly) => {
          acc[anomaly.severity] = (acc[anomaly.severity] || 0) + 1;
          return acc;
        }, {}),
        detectionPeriod: timeRange
      }
    };
    
  } catch (error) {
    console.error('异常检测失败:', error);
    return { detected: [], summary: { total: 0, bySeverity: {} } };
  }
}

/**
 * 生成异常建议
 */
function generateAnomalyRecommendations(anomalies) {
  const recommendations = [];
  
  anomalies.forEach(anomaly => {
    switch (anomaly.type) {
      case 'high_market_creation':
        recommendations.push({
          priority: 'medium',
          action: 'monitor_quality',
          description: '监控新创建市场的质量，防止垃圾市场',
          targetMetric: 'market_quality_score'
        });
        break;
        
      case 'low_user_activity':
        recommendations.push({
          priority: 'high',
          action: 'engage_users',
          description: '启动用户参与度提升活动，检查系统可用性',
          targetMetric: 'user_engagement_rate'
        });
        break;
        
      default:
        recommendations.push({
          priority: 'low',
          action: 'investigate',
          description: `调查${anomaly.type}异常的根本原因`,
          targetMetric: anomaly.type
        });
    }
  });
  
  return recommendations;
}

module.exports = router;