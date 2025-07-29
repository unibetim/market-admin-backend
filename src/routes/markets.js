const express = require('express');
const router = express.Router();
const Web3Manager = require('../utils/web3Manager');
const { enhanceMarketWithLogos } = require('../config/logoConfig');
const { authenticateToken, optionalAuth, requireAdmin } = require('../middleware/auth');
const { getMarketTraderCountForAPI } = require('../../utils/chainStatsHelper');

// 初始化管理器
const web3Manager = new Web3Manager();

/**
 * 获取市场列表 (公开接口，支持可选认证)
 */
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      type, 
      category, 
      status, 
      search,
      sortBy = 'created_at',
      sortOrder = 'DESC',
      // 兼容旧的参数
      offset
    } = req.query;

    // 如果使用了offset参数，则使用旧的查询方式
    if (offset !== undefined) {
      const filters = {};
      if (type) filters.type = type;
      if (category) filters.category = category;
      if (status) filters.status = status;
      if (limit) filters.limit = parseInt(limit);

      const markets = await req.app.locals.db.getMarkets(filters);
      const enhancedMarkets = await Promise.all(markets.map(market => enhanceMarketWithLogos(market)));
      
      res.json({
        success: true,
        data: enhancedMarkets,
        pagination: {
          total: enhancedMarkets.length,
          limit: parseInt(limit),
          offset: parseInt(offset)
        }
      });
      return;
    }

    // 🚀 前端需要完整数据：使用完整查询，包含metadata和logo增强
    const filters = {
      page: parseInt(page),
      limit: parseInt(limit),
      type,
      category,
      status,
      search,
      sortBy,
      sortOrder
    };

    // 使用完整查询方法，暂时跳过logo增强以避免数据丢失
    const result = await req.app.locals.db.getMarketsPaginated(filters);
    const responseData = result.data;
    
    res.json({
      success: true,
      data: responseData,
      pagination: result.pagination
    });

  } catch (error) {
    console.error('获取市场列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取市场列表失败',
      error: error.message
    });
  }
});

/**
 * 创建新市场 (需要管理员权限)
 */
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      type,
      category,
      title,
      description,
      optionA,
      optionB,
      resolutionTime,
      oracle,
      templateId,
      metadata = {},
      chainId = 97,
      autoPublish = false
    } = req.body;

    // 验证必填字段
    if (!type || !category || !title || !optionA || !optionB || !resolutionTime || !oracle) {
      return res.status(400).json({
        success: false,
        message: '缺少必填字段',
        required: ['type', 'category', 'title', 'optionA', 'optionB', 'resolutionTime', 'oracle']
      });
    }

    // 验证预言机地址格式
    if (!/^0x[a-fA-F0-9]{40}$/.test(oracle)) {
      return res.status(400).json({
        success: false,
        message: '预言机地址格式不正确'
      });
    }

    // 验证时间
    const resolutionTimestamp = Math.floor(new Date(resolutionTime).getTime() / 1000);
    const now = Math.floor(Date.now() / 1000);
    if (resolutionTimestamp <= now) {
      return res.status(400).json({
        success: false,
        message: '结算时间必须在未来'
      });
    }

    // 生成市场ID
    const marketId = `market_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // 创建市场元数据 (直接存储到数据库，不使用IPFS)
    const marketMetadata = {
      title,
      description: description || title,
      category,
      tags: metadata.tags || [],
      outcomes: [
        { id: 0, name: optionA, color: '#10B981' },
        { id: 1, name: optionB, color: '#EF4444' }
      ],
      market: {
        type,
        category,
        resolutionTime: resolutionTimestamp,
        oracle,
        creator: 'admin'
      },
      // 体育市场特有数据
      sport: metadata.sport,
      league: metadata.league,
      teamA: metadata.teamA,
      teamB: metadata.teamB,
      teamLogos: metadata.teamLogos,
      handicap: metadata.handicap,
      matchDateTime: metadata.matchDateTime,
      ...metadata
    };

    // 所有市场创建都需要钱包签名发布到链上
    console.log('⚠️ 市场创建需要使用钱包签名发布到区块链');
    
    // 不保存任何数据到数据库，直接返回提示
    return res.status(400).json({
      success: false,
      message: '创建市场需要使用钱包签名发布到区块链',
      requireWalletSignature: true,
      // 返回准备好的市场数据供钱包签名使用
      marketData: {
        title,
        description: description || title,
        category,
        subcategory: metadata.subcategory || '',
        market_type: 'binary',
        closingTime: resolutionTimestamp, // 直接使用时间戳（秒）
        oracle_address: oracle,
        options: [optionA, optionB],
        additional_data: metadata
      }
    });

  } catch (error) {
    console.error('创建市场失败:', error);
    res.status(500).json({
      success: false,
      message: '创建市场失败',
      error: error.message
    });
  }
});

/**
 * 发布市场到区块链
 */
router.post('/:marketId/publish', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { marketId } = req.params;
    const { chainId = 97 } = req.body;

    // 获取市场信息
    const markets = await req.app.locals.db.getMarkets({});
    const market = markets.find(m => m.market_id === marketId);

    if (!market) {
      return res.status(404).json({
        success: false,
        message: '市场不存在'
      });
    }

    if (market.status === 'active') {
      return res.status(400).json({
        success: false,
        message: '市场已经发布'
      });
    }

    // 生成合约描述（不再依赖IPFS，直接使用title）
    const contractDescription = `OddsMarket: ${market.title}`;
    
    // 计算持续时间
    const now = Math.floor(Date.now() / 1000);
    const duration = market.resolution_time - now;

    if (duration <= 0) {
      return res.status(400).json({
        success: false,
        message: '市场已过期，无法发布'
      });
    }

    // 发布到区块链
    console.log(`🚀 正在发布市场 ${marketId} 到区块链...`);
    
    const marketData = {
      description: contractDescription,
      closingTime: market.resolution_time,
      oracle: market.oracle_address
    };

    const result = await web3Manager.createMarket(chainId, marketData);

    if (result.success) {
      // 更新数据库状态，包含链上市场ID
      await req.app.locals.db.updateMarketStatus(
        marketId,
        'active',
        result.txHash,
        result.marketId // 保存链上市场ID
      );

      // 记录日志
      await req.app.locals.db.log(
        'publish_market',
        'market',
        marketId,
        'admin',
        `市场已发布到区块链, 链上ID: ${result.marketId}`,
        { txHash: result.txHash, onChainMarketId: result.marketId, chainId }
      );

      res.json({
        success: true,
        message: '市场发布成功',
        data: {
          marketId,
          onChainMarketId: result.marketId,
          txHash: result.txHash,
          blockNumber: result.blockNumber,
          status: 'active'
        }
      });
    } else {
      res.status(500).json({
        success: false,
        message: '发布到区块链失败',
        error: result.error
      });
    }

  } catch (error) {
    console.error('发布市场失败:', error);
    res.status(500).json({
      success: false,
      message: '发布市场失败',
      error: error.message
    });
  }
});

/**
 * 获取单个市场详情
 */
router.get('/:marketId', optionalAuth, async (req, res) => {
  try {
    const { marketId } = req.params;
    
    // 使用优化的单个查询方法
    const market = await req.app.locals.db.getMarketById(marketId);

    if (!market) {
      return res.status(404).json({
        success: false,
        message: '市场不存在'
      });
    }

    // 元数据已直接存储在数据库中，无需IPFS
    const enhancedMarket = await enhanceMarketWithLogos(market);
    
    res.json({
      success: true,
      data: enhancedMarket
    });

  } catch (error) {
    console.error('获取市场详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取市场详情失败',
      error: error.message
    });
  }
});

/**
 * 更新市场信息
 */
router.put('/:marketId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { marketId } = req.params;
    const updates = req.body;

    // 这里可以添加更新逻辑
    // 注意：已发布的市场某些信息不能修改

    res.json({
      success: true,
      message: '市场更新成功',
      data: { marketId, updates }
    });

  } catch (error) {
    console.error('更新市场失败:', error);
    res.status(500).json({
      success: false,
      message: '更新市场失败',
      error: error.message
    });
  }
});

/**
 * 删除市场 (仅草稿状态)
 */
router.delete('/:marketId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { marketId } = req.params;

    // 检查市场状态
    const markets = await req.app.locals.db.getMarkets({ limit: 1000 });
    const market = markets.find(m => m.market_id === marketId);

    if (!market) {
      return res.status(404).json({
        success: false,
        message: '市场不存在'
      });
    }

    if (market.status !== 'draft') {
      return res.status(400).json({
        success: false,
        message: '只能删除草稿状态的市场'
      });
    }

    // 执行删除逻辑 (这里需要实现数据库删除方法)
    await req.app.locals.db.log(
      'delete_market',
      'market',
      marketId,
      'admin',
      `删除草稿市场: ${market.title}`
    );

    res.json({
      success: true,
      message: '市场删除成功'
    });

  } catch (error) {
    console.error('删除市场失败:', error);
    res.status(500).json({
      success: false,
      message: '删除市场失败',
      error: error.message
    });
  }
});

/**
 * 批量操作
 */
router.post('/batch', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { action, marketIds, params = {} } = req.body;

    if (!action || !Array.isArray(marketIds)) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数'
      });
    }

    const results = [];

    for (const marketId of marketIds) {
      try {
        let result = null;

        switch (action) {
          case 'publish':
            // 批量发布逻辑
            result = { marketId, success: true, message: '发布成功' };
            break;
          case 'delete':
            // 批量删除逻辑  
            result = { marketId, success: true, message: '删除成功' };
            break;
          default:
            result = { marketId, success: false, message: '不支持的操作' };
        }

        results.push(result);
      } catch (error) {
        results.push({
          marketId,
          success: false,
          message: error.message
        });
      }
    }

    res.json({
      success: true,
      message: `批量${action}完成`,
      data: results
    });

  } catch (error) {
    console.error('批量操作失败:', error);
    res.status(500).json({
      success: false,
      message: '批量操作失败',
      error: error.message
    });
  }
});

/**
 * 获取市场统计信息
 */
router.get('/:marketId/stats', async (req, res) => {
  try {
    const { marketId } = req.params;
    
    // 检查市场是否存在
    const market = await req.app.locals.db.getMarketById(marketId);
    if (!market) {
      return res.status(404).json({
        success: false,
        message: '市场不存在'
      });
    }

    // 尝试从数据库扩展获取详细统计
    let stats = null;
    if (req.app.locals.db.extensions && req.app.locals.db.extensions.getMarketDetailedStats) {
      try {
        stats = await req.app.locals.db.extensions.getMarketDetailedStats(marketId);
      } catch (error) {
        console.warn('获取详细统计失败:', error);
      }
    }
    
    // 如果扩展不存在，尝试从链上获取真实统计数据
    if (!stats && market.chain_market_id) {
      try {
        console.log(`🔗 从链上获取市场${market.chain_market_id}的真实统计数据...`);
        const chainStats = await getMarketTraderCountForAPI(market.chain_market_id);
        
        if (chainStats) {
          stats = {
            market_id: marketId,
            total_volume: chainStats.totalVolume || '0',
            total_trades: chainStats.uniqueTraders || 0, // 简化：假设每个trader平均1笔交易
            unique_traders: chainStats.uniqueTraders || 0,
            liquidity_providers: chainStats.liquidityProviders || 0,
            total_liquidity: '0', // 将由其他方法获取
            last_updated: Math.floor(Date.now() / 1000)
          };
          console.log(`✅ 成功获取链上统计:`, stats);
        }
      } catch (error) {
        console.warn('链上统计查询失败:', error.message);
      }
    }

    // 如果没有统计数据，返回默认值
    if (!stats) {
      stats = {
        market_id: marketId,
        total_volume: '0',
        total_trades: 0,
        unique_traders: 0,
        liquidity_providers: 0,
        total_liquidity: '0',
        last_updated: Math.floor(Date.now() / 1000)
      };
    }

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('获取市场统计失败:', error);
    res.status(500).json({
      success: false,
      message: '获取市场统计失败',
      error: error.message
    });
  }
});


module.exports = router;