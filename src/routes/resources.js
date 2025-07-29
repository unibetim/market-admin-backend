const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const router = express.Router();

// 🎯 专业级资源管理系统
// 支持文件上传、搜索、批量操作、元数据管理

// 配置文件上传存储
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const { type, category } = req.body;
    const uploadPath = path.join(__dirname, '../..', 'public', 'logos', type || 'general', category || 'default');
    
    try {
      await fs.mkdir(uploadPath, { recursive: true });
      cb(null, uploadPath);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = file.originalname.replace(ext, '').replace(/[^a-zA-Z0-9_-]/g, '_');
    cb(null, `${name}_${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.UPLOAD_MAX_SIZE || '5242880') // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = (process.env.UPLOAD_ALLOWED_TYPES || 'image/jpeg,image/png,image/svg+xml,image/webp').split(',');
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`不支持的文件类型: ${file.mimetype}`));
    }
  }
});

/**
 * 🧪 测试路由
 */
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Test route working!' });
});

/**
 * 🏈 获取体育联赛列表
 */
router.get('/leagues', async (req, res) => {
  try {
    const { sport } = req.query;
    
    if (!sport) {
      return res.status(400).json({
        success: false,
        message: '请指定运动类型'
      });
    }

    // 根据运动类型返回联赛数据
    const sportsData = {
      football: {
        leagues: [
          { id: 'premier-league', name: '英超联赛', displayName: 'Premier League' },
          { id: 'la-liga', name: '西甲联赛', displayName: 'La Liga' },
          { id: 'bundesliga', name: '德甲联赛', displayName: 'Bundesliga' },
          { id: 'serie-a', name: '意甲联赛', displayName: 'Serie A' },
          { id: 'ligue-1', name: '法甲联赛', displayName: 'Ligue 1' }
        ]
      },
      basketball: {
        leagues: [
          { id: 'nba', name: 'NBA联赛', displayName: 'NBA' },
          { id: 'euroleague', name: '欧洲联赛', displayName: 'EuroLeague' },
          { id: 'cba', name: 'CBA联赛', displayName: 'CBA' }
        ]
      }
    };

    const leagues = sportsData[sport]?.leagues || [];

    res.json({
      success: true,
      data: leagues
    });

  } catch (error) {
    console.error('获取联赛列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取联赛列表失败',
      error: error.message
    });
  }
});

/**
 * 🏃 获取球队列表
 */
router.get('/teams', async (req, res) => {
  try {
    const { sport, league } = req.query;
    
    if (!sport || !league) {
      return res.status(400).json({
        success: false,
        message: '请指定运动类型和联赛'
      });
    }

    // 根据运动类型和联赛返回球队数据
    const teamsData = {
      football: {
        'premier-league': [
          { id: 'arsenal', name: 'Arsenal', displayName: '阿森纳', logoUrl: '/static/logos/football/premier-league/Arsenal.svg' },
          { id: 'chelsea', name: 'Chelsea', displayName: '切尔西', logoUrl: '/static/logos/football/premier-league/Chelsea.svg' },
          { id: 'liverpool', name: 'Liverpool', displayName: '利物浦', logoUrl: '/static/logos/football/premier-league/Liverpool.svg' },
          { id: 'manchester-city', name: 'Manchester City', displayName: '曼城', logoUrl: '/static/logos/football/premier-league/Manchester_City.svg' },
          { id: 'manchester-united', name: 'Manchester United', displayName: '曼联', logoUrl: '/static/logos/football/premier-league/Manchester_United.svg' },
          { id: 'tottenham', name: 'Tottenham Hotspur', displayName: '热刺', logoUrl: '/static/logos/football/premier-league/Tottenham_Hotspur.png' }
        ],
        'la-liga': [
          { id: 'real-madrid', name: 'Real Madrid', displayName: '皇家马德里', logoUrl: '/static/logos/football/la-liga/Real_Madrid.svg' },
          { id: 'barcelona', name: 'Barcelona', displayName: '巴塞罗那', logoUrl: '/static/logos/football/la-liga/Barcelona.svg' },
          { id: 'atletico-madrid', name: 'Atletico Madrid', displayName: '马德里竞技', logoUrl: '/static/logos/football/la-liga/Atletico_Madrid.svg' }
        ]
      },
      basketball: {
        'nba': [
          { id: 'lakers', name: 'Los Angeles Lakers', displayName: '洛杉矶湖人', logoUrl: '/static/logos/basketball/nba/LA_Lakers.svg' },
          { id: 'warriors', name: 'Golden State Warriors', displayName: '金州勇士', logoUrl: '/static/logos/basketball/nba/Golden_State_Warriors.svg' },
          { id: 'celtics', name: 'Boston Celtics', displayName: '波士顿凯尔特人', logoUrl: '/static/logos/basketball/nba/Boston_Celtics.svg' }
        ]
      }
    };

    const teams = teamsData[sport]?.[league] || [];

    res.json({
      success: true,
      data: teams
    });

  } catch (error) {
    console.error('获取球队列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取球队列表失败',
      error: error.message
    });
  }
});

/**
 * 📊 获取让分/盘口列表
 */
router.get('/handicaps', async (req, res) => {
  try {
    const { sport } = req.query;
    console.log('🏈 Handicaps API called with sport:', sport);
    
    // 足球让球盘选项 - 二元预测专用
    const footballHandicaps = [
      // 正让球（主队让球）
      { id: '+0.5', name: '主队让0.5球', displayName: '+0.5', value: 0.5 },
      { id: '+1.5', name: '主队让1.5球', displayName: '+1.5', value: 1.5 },
      { id: '+2.5', name: '主队让2.5球', displayName: '+2.5', value: 2.5 },
      { id: '+3.5', name: '主队让3.5球', displayName: '+3.5', value: 3.5 },
      
      // 负让球（客队让球）
      { id: '-0.5', name: '客队让0.5球', displayName: '-0.5', value: -0.5 },
      { id: '-1.5', name: '客队让1.5球', displayName: '-1.5', value: -1.5 },
      { id: '-2.5', name: '客队让2.5球', displayName: '-2.5', value: -2.5 },
      { id: '-3.5', name: '客队让3.5球', displayName: '-3.5', value: -3.5 }
    ];

    // 篮球让分盘选项
    const basketballHandicaps = [
      { id: '+2.5', name: '主队让2.5分', displayName: '+2.5', value: 2.5 },
      { id: '+5.5', name: '主队让5.5分', displayName: '+5.5', value: 5.5 },
      { id: '+8.5', name: '主队让8.5分', displayName: '+8.5', value: 8.5 },
      { id: '+11.5', name: '主队让11.5分', displayName: '+11.5', value: 11.5 },
      { id: '-2.5', name: '客队让2.5分', displayName: '-2.5', value: -2.5 },
      { id: '-5.5', name: '客队让5.5分', displayName: '-5.5', value: -5.5 },
      { id: '-8.5', name: '客队让8.5分', displayName: '-8.5', value: -8.5 },
      { id: '-11.5', name: '客队让11.5分', displayName: '-11.5', value: -11.5 }
    ];

    // 根据运动类型返回对应的让分选项
    let handicaps = [];
    if (sport === 'football') {
      handicaps = footballHandicaps;
    } else if (sport === 'basketball') {
      handicaps = basketballHandicaps;
    } else {
      // 默认返回通用盘口类型
      handicaps = [
        { id: 'win', name: '胜负盘', displayName: '胜负' },
        { id: 'handicap', name: '让分盘', displayName: '让分' },
        { id: 'total', name: '大小分', displayName: '总分' }
      ];
    }

    res.json({
      success: true,
      data: handicaps
    });

  } catch (error) {
    console.error('获取让分列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取让分列表失败',
      error: error.message
    });
  }
});

/**
 * 🔍 获取资源列表（支持搜索和过滤）
 */
router.get('/', async (req, res) => {
  try {
    const { 
      type, 
      category, 
      search, 
      limit = 50, 
      offset = 0,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;

    let query = 'SELECT * FROM resources WHERE 1=1';
    const params = [];

    // 类型过滤
    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }

    // 分类过滤
    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    // 搜索功能
    if (search) {
      query += ' AND (name LIKE ? OR display_name LIKE ? OR tags LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    // 排序
    const validSortFields = ['name', 'created_at', 'updated_at', 'file_size'];
    const validSortOrders = ['ASC', 'DESC'];
    
    if (validSortFields.includes(sortBy) && validSortOrders.includes(sortOrder.toUpperCase())) {
      query += ` ORDER BY ${sortBy} ${sortOrder.toUpperCase()}`;
    }

    // 分页
    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const resources = await req.app.locals.db.all(query, params);

    // 获取总数
    let countQuery = 'SELECT COUNT(*) as total FROM resources WHERE 1=1';
    const countParams = [];

    if (type) {
      countQuery += ' AND type = ?';
      countParams.push(type);
    }
    if (category) {
      countQuery += ' AND category = ?';
      countParams.push(category);
    }
    if (search) {
      countQuery += ' AND (name LIKE ? OR display_name LIKE ? OR tags LIKE ?)';
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm, searchTerm, searchTerm);
    }

    const countResult = await req.app.locals.db.get(countQuery, countParams);

    res.json({
      success: true,
      data: resources,
      pagination: {
        total: countResult.total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: countResult.total > parseInt(offset) + parseInt(limit)
      }
    });

  } catch (error) {
    console.error('获取资源列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取资源列表失败',
      error: error.message
    });
  }
});

/**
 * 📤 单文件上传
 */
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '未选择文件'
      });
    }

    const { type, category, displayName, tags } = req.body;
    const file = req.file;

    // 生成资源路径
    const relativePath = path.relative(
      path.join(__dirname, '../..', 'public'),
      file.path
    ).replace(/\\/g, '/');
    const resourcePath = `/static/${relativePath}`;

    // 保存到数据库
    const result = await req.app.locals.db.run(`
      INSERT INTO resources (type, category, name, display_name, file_path, file_size, mime_type, tags)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      type || 'general',
      category || 'default',
      file.originalname,
      displayName || file.originalname,
      resourcePath,
      file.size,
      file.mimetype,
      tags || ''
    ]);

    // 记录操作日志
    await req.app.locals.db.log(
      'upload_resource',
      'resource',
      result.id.toString(),
      'admin',
      `上传资源: ${file.originalname}`,
      { type, category, fileSize: file.size, mimetype: file.mimetype }
    );

    res.status(201).json({
      success: true,
      message: '文件上传成功',
      data: {
        id: result.id,
        name: file.originalname,
        displayName: displayName || file.originalname,
        path: resourcePath,
        size: file.size,
        type: file.mimetype,
        url: `${req.protocol}://${req.get('host')}${resourcePath}`
      }
    });

  } catch (error) {
    console.error('文件上传失败:', error);
    res.status(500).json({
      success: false,
      message: '文件上传失败',
      error: error.message
    });
  }
});

/**
 * 📤 批量文件上传
 */
router.post('/upload/batch', upload.array('files', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: '未选择文件'
      });
    }

    const { type, category, tags } = req.body;
    const uploadedFiles = [];
    const errors = [];

    for (const file of req.files) {
      try {
        const relativePath = path.relative(
          path.join(__dirname, '../..', 'public'),
          file.path
        ).replace(/\\/g, '/');
        const resourcePath = `/static/${relativePath}`;

        const result = await req.app.locals.db.run(`
          INSERT INTO resources (type, category, name, display_name, file_path, file_size, mime_type, tags)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          type || 'general',
          category || 'default',
          file.originalname,
          file.originalname,
          resourcePath,
          file.size,
          file.mimetype,
          tags || ''
        ]);

        uploadedFiles.push({
          id: result.id,
          name: file.originalname,
          path: resourcePath,
          size: file.size,
          url: `${req.protocol}://${req.get('host')}${resourcePath}`
        });

      } catch (error) {
        errors.push({
          file: file.originalname,
          error: error.message
        });
      }
    }

    // 记录批量上传日志
    await req.app.locals.db.log(
      'batch_upload_resources',
      'resource',
      'batch',
      'admin',
      `批量上传 ${uploadedFiles.length} 个文件`,
      { 
        successCount: uploadedFiles.length, 
        errorCount: errors.length,
        type, 
        category 
      }
    );

    res.status(201).json({
      success: true,
      message: `批量上传完成：成功 ${uploadedFiles.length} 个，失败 ${errors.length} 个`,
      data: {
        uploaded: uploadedFiles,
        errors: errors
      }
    });

  } catch (error) {
    console.error('批量上传失败:', error);
    res.status(500).json({
      success: false,
      message: '批量上传失败',
      error: error.message
    });
  }
});

/**
 * 🔍 获取单个资源详情 (需要是数字ID)
 */
router.get('/:resourceId(\\d+)', async (req, res) => {
  try {
    const { resourceId } = req.params;

    const resource = await req.app.locals.db.get(
      'SELECT * FROM resources WHERE id = ?',
      [resourceId]
    );

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: '资源不存在'
      });
    }

    // 检查文件是否仍然存在
    const fullPath = path.join(__dirname, '../..', 'public', resource.file_path.replace('/static/', ''));
    let fileExists = false;
    try {
      await fs.access(fullPath);
      fileExists = true;
    } catch (error) {
      // 文件不存在
    }

    res.json({
      success: true,
      data: {
        ...resource,
        fileExists,
        fullUrl: `${req.protocol}://${req.get('host')}${resource.file_path}`
      }
    });

  } catch (error) {
    console.error('获取资源详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取资源详情失败',
      error: error.message
    });
  }
});

/**
 * ✏️ 更新资源元数据
 */
router.put('/:resourceId(\\d+)', async (req, res) => {
  try {
    const { resourceId } = req.params;
    const { displayName, tags, category } = req.body;

    // 检查资源是否存在
    const resource = await req.app.locals.db.get(
      'SELECT * FROM resources WHERE id = ?',
      [resourceId]
    );

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: '资源不存在'
      });
    }

    // 更新资源信息
    await req.app.locals.db.run(`
      UPDATE resources 
      SET display_name = ?, tags = ?, category = ?, updated_at = strftime('%s', 'now')
      WHERE id = ?
    `, [displayName || resource.display_name, tags || resource.tags, category || resource.category, resourceId]);

    // 记录操作日志
    await req.app.locals.db.log(
      'update_resource',
      'resource',
      resourceId,
      'admin',
      `更新资源元数据: ${resource.name}`,
      { displayName, tags, category }
    );

    res.json({
      success: true,
      message: '资源更新成功',
      data: {
        id: resourceId,
        displayName,
        tags,
        category
      }
    });

  } catch (error) {
    console.error('更新资源失败:', error);
    res.status(500).json({
      success: false,
      message: '更新资源失败',
      error: error.message
    });
  }
});

/**
 * 🗑️ 删除资源
 */
router.delete('/:resourceId(\\d+)', async (req, res) => {
  try {
    const { resourceId } = req.params;

    // 获取资源信息
    const resource = await req.app.locals.db.get(
      'SELECT * FROM resources WHERE id = ?',
      [resourceId]
    );

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: '资源不存在'
      });
    }

    // 删除物理文件
    const fullPath = path.join(__dirname, '../..', 'public', resource.file_path.replace('/static/', ''));
    try {
      await fs.unlink(fullPath);
    } catch (error) {
      console.warn('删除物理文件失败:', error.message);
    }

    // 从数据库删除记录
    await req.app.locals.db.run('DELETE FROM resources WHERE id = ?', [resourceId]);

    // 记录操作日志
    await req.app.locals.db.log(
      'delete_resource',
      'resource',
      resourceId,
      'admin',
      `删除资源: ${resource.name}`,
      { originalPath: resource.file_path }
    );

    res.json({
      success: true,
      message: '资源删除成功'
    });

  } catch (error) {
    console.error('删除资源失败:', error);
    res.status(500).json({
      success: false,
      message: '删除资源失败',
      error: error.message
    });
  }
});

/**
 * 🗑️ 批量删除资源
 */
router.post('/batch/delete', async (req, res) => {
  try {
    const { resourceIds } = req.body;

    if (!resourceIds || !Array.isArray(resourceIds) || resourceIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请提供要删除的资源ID列表'
      });
    }

    const deletedResources = [];
    const errors = [];

    for (const resourceId of resourceIds) {
      try {
        // 获取资源信息
        const resource = await req.app.locals.db.get(
          'SELECT * FROM resources WHERE id = ?',
          [resourceId]
        );

        if (!resource) {
          errors.push({
            id: resourceId,
            error: '资源不存在'
          });
          continue;
        }

        // 删除物理文件
        const fullPath = path.join(__dirname, '../..', 'public', resource.file_path.replace('/static/', ''));
        try {
          await fs.unlink(fullPath);
        } catch (error) {
          console.warn('删除物理文件失败:', error.message);
        }

        // 从数据库删除记录
        await req.app.locals.db.run('DELETE FROM resources WHERE id = ?', [resourceId]);

        deletedResources.push({
          id: resourceId,
          name: resource.name
        });

      } catch (error) {
        errors.push({
          id: resourceId,
          error: error.message
        });
      }
    }

    // 记录批量删除日志
    await req.app.locals.db.log(
      'batch_delete_resources',
      'resource',
      'batch',
      'admin',
      `批量删除 ${deletedResources.length} 个资源`,
      { 
        successCount: deletedResources.length, 
        errorCount: errors.length,
        resourceIds 
      }
    );

    res.json({
      success: true,
      message: `批量删除完成：成功 ${deletedResources.length} 个，失败 ${errors.length} 个`,
      data: {
        deleted: deletedResources,
        errors: errors
      }
    });

  } catch (error) {
    console.error('批量删除失败:', error);
    res.status(500).json({
      success: false,
      message: '批量删除失败',
      error: error.message
    });
  }
});

/**
 * 📊 获取资源统计信息
 */
router.get('/stats/overview', async (req, res) => {
  try {
    // 总数统计
    const totalStats = await req.app.locals.db.get('SELECT COUNT(*) as total FROM resources');
    
    // 按类型统计
    const typeStats = await req.app.locals.db.all(`
      SELECT type, COUNT(*) as count, SUM(file_size) as totalSize
      FROM resources 
      GROUP BY type
    `);

    // 按分类统计
    const categoryStats = await req.app.locals.db.all(`
      SELECT category, COUNT(*) as count
      FROM resources 
      GROUP BY category
      ORDER BY count DESC
    `);

    // 最近上传的资源
    const recentResources = await req.app.locals.db.all(`
      SELECT name, display_name, created_at, file_size, mime_type
      FROM resources 
      ORDER BY created_at DESC 
      LIMIT 10
    `);

    // 文件大小统计
    const sizeStats = await req.app.locals.db.get(`
      SELECT 
        SUM(file_size) as totalSize,
        AVG(file_size) as avgSize,
        MAX(file_size) as maxSize,
        MIN(file_size) as minSize
      FROM resources
    `);

    res.json({
      success: true,
      data: {
        overview: {
          totalResources: totalStats.total,
          totalSize: sizeStats.totalSize || 0,
          averageSize: sizeStats.avgSize || 0,
          largestFile: sizeStats.maxSize || 0,
          smallestFile: sizeStats.minSize || 0
        },
        byType: typeStats,
        byCategory: categoryStats,
        recentUploads: recentResources
      }
    });

  } catch (error) {
    console.error('获取资源统计失败:', error);
    res.status(500).json({
      success: false,
      message: '获取资源统计失败',
      error: error.message
    });
  }
});

/**
 * 🔧 资源文件健康检查
 */
router.post('/check/health', async (req, res) => {
  try {
    const resources = await req.app.locals.db.all('SELECT * FROM resources');
    
    const healthReport = {
      total: resources.length,
      healthy: 0,
      missing: [],
      corrupted: []
    };

    for (const resource of resources) {
      const fullPath = path.join(__dirname, '../..', 'public', resource.file_path.replace('/static/', ''));
      
      try {
        await fs.access(fullPath);
        const stats = await fs.stat(fullPath);
        
        if (stats.size === resource.file_size) {
          healthReport.healthy++;
        } else {
          healthReport.corrupted.push({
            id: resource.id,
            name: resource.name,
            expectedSize: resource.file_size,
            actualSize: stats.size
          });
        }
      } catch (error) {
        healthReport.missing.push({
          id: resource.id,
          name: resource.name,
          path: resource.file_path
        });
      }
    }

    res.json({
      success: true,
      data: healthReport
    });

  } catch (error) {
    console.error('资源健康检查失败:', error);
    res.status(500).json({
      success: false,
      message: '资源健康检查失败',
      error: error.message
    });
  }
});

module.exports = router;// Force reload

