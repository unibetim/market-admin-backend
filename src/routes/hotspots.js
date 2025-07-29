/**
 * 🔥 热点市场管理 API 路由
 * 提供热点市场的创建、管理和查询功能
 * 
 * 功能特性:
 * - 设置/取消市场热点状态
 * - 批量管理热点市场
 * - 获取热点市场列表
 * - 热点排序管理
 * 
 * @author 专家级后端工程师
 * @version 1.0.0
 */

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

/**
 * GET /api/hotspots
 * 获取热点市场列表（公开接口，无需认证）
 */
router.get('/', async (req, res) => {
  try {
    const { limit = 20, activeOnly = 'true' } = req.query;
    
    const options = {
      limit: parseInt(limit, 10),
      activeOnly: activeOnly === 'true'
    };

    const dbExtensions = req.app.get('dbExtensions');
    const hotspotMarkets = await dbExtensions.getHotspotMarkets(options);

    res.json({
      success: true,
      data: hotspotMarkets,
      total: hotspotMarkets.length,
      timestamp: Date.now()
    });

  } catch (error) {
    console.error('❌ Failed to get hotspot markets:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve hotspot markets',
      message: error.message
    });
  }
});

/**
 * POST /api/hotspots/:marketId
 * 设置市场为热点（需要认证）
 */
router.post('/:marketId', authenticateToken, async (req, res) => {
  try {
    const { marketId } = req.params;
    const { order } = req.body;

    const dbExtensions = req.app.get('dbExtensions');
    const result = await dbExtensions.setMarketHotspot(marketId, order);

    res.json({
      success: true,
      message: `Market ${marketId} set as hotspot`,
      data: result
    });

  } catch (error) {
    console.error('❌ Failed to set market hotspot:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to set market as hotspot',
      message: error.message
    });
  }
});

/**
 * DELETE /api/hotspots/:marketId
 * 取消市场热点状态（需要认证）
 */
router.delete('/:marketId', authenticateToken, async (req, res) => {
  try {
    const { marketId } = req.params;

    const dbExtensions = req.app.get('dbExtensions');
    const result = await dbExtensions.removeMarketHotspot(marketId);

    res.json({
      success: true,
      message: `Market ${marketId} removed from hotspots`,
      data: result
    });

  } catch (error) {
    console.error('❌ Failed to remove market hotspot:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove market from hotspots',
      message: error.message
    });
  }
});

/**
 * PUT /api/hotspots/:marketId/toggle
 * 切换市场热点状态（需要认证）
 */
router.put('/:marketId/toggle', authenticateToken, async (req, res) => {
  try {
    const { marketId } = req.params;

    const dbExtensions = req.app.get('dbExtensions');
    const result = await dbExtensions.toggleMarketHotspot(marketId);

    res.json({
      success: true,
      message: `Market ${marketId} hotspot status toggled`,
      data: result
    });

  } catch (error) {
    console.error('❌ Failed to toggle market hotspot:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to toggle market hotspot status',
      message: error.message
    });
  }
});

/**
 * GET /api/hotspots/:marketId/status
 * 获取市场热点状态（公开接口，无需认证）
 */
router.get('/:marketId/status', async (req, res) => {
  try {
    const { marketId } = req.params;

    const dbExtensions = req.app.get('dbExtensions');
    const status = await dbExtensions.getMarketHotspotStatus(marketId);

    res.json({
      success: true,
      data: status
    });

  } catch (error) {
    console.error('❌ Failed to get market hotspot status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get market hotspot status',
      message: error.message
    });
  }
});

/**
 * PUT /api/hotspots/reorder
 * 批量更新热点市场排序（需要认证）
 */
router.put('/reorder', authenticateToken, async (req, res) => {
  try {
    const { orders } = req.body;

    if (!Array.isArray(orders) || orders.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid orders data',
        message: 'Orders must be a non-empty array'
      });
    }

    // 验证orders格式
    for (const order of orders) {
      if (!order.marketId || typeof order.order !== 'number') {
        return res.status(400).json({
          success: false,
          error: 'Invalid order format',
          message: 'Each order must have marketId and order fields'
        });
      }
    }

    const dbExtensions = req.app.get('dbExtensions');
    const result = await dbExtensions.updateHotspotOrders(orders);

    res.json({
      success: true,
      message: `Updated ${orders.length} market orders`,
      data: result
    });

  } catch (error) {
    console.error('❌ Failed to reorder hotspot markets:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reorder hotspot markets',
      message: error.message
    });
  }
});

/**
 * POST /api/hotspots/batch
 * 批量设置/取消热点（需要认证）
 */
router.post('/batch', authenticateToken, async (req, res) => {
  try {
    const { marketIds, action, startOrder = 1 } = req.body;

    if (!Array.isArray(marketIds) || marketIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid marketIds',
        message: 'marketIds must be a non-empty array'
      });
    }

    if (!['set', 'remove'].includes(action)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid action',
        message: 'action must be either "set" or "remove"'
      });
    }

    const dbExtensions = req.app.get('dbExtensions');
    const results = [];
    let currentOrder = startOrder;

    for (const marketId of marketIds) {
      try {
        let result;
        if (action === 'set') {
          result = await dbExtensions.setMarketHotspot(marketId, currentOrder);
          currentOrder++;
        } else {
          result = await dbExtensions.removeMarketHotspot(marketId);
        }
        results.push({ marketId, success: true, data: result });
      } catch (error) {
        results.push({ 
          marketId, 
          success: false, 
          error: error.message 
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;

    res.json({
      success: failureCount === 0,
      message: `Batch ${action}: ${successCount} succeeded, ${failureCount} failed`,
      data: {
        total: results.length,
        success: successCount,
        failures: failureCount,
        results
      }
    });

  } catch (error) {
    console.error('❌ Failed to batch update hotspots:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to batch update hotspots',
      message: error.message
    });
  }
});

module.exports = router;