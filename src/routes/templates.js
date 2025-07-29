const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const router = express.Router();

// 🎯 专业级模板管理系统 v2.0
// 支持版本控制、模板共享、批量操作、高级搜索、统计分析

// 配置文件上传（用于模板资源）
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../..', 'public', 'templates', 'assets');
    
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
  limits: { fileSize: parseInt(process.env.UPLOAD_MAX_SIZE || '10485760') }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/svg+xml', 'application/json', 'text/plain'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`不支持的文件类型: ${file.mimetype}`));
    }
  }
});

/**
 * 🔍 获取模板列表（增强版）
 */
router.get('/', async (req, res) => {
  try {
    const { 
      type, 
      category, 
      search, 
      tags,
      author,
      status = 'active',
      shared,
      version,
      limit = 50, 
      offset = 0,
      sortBy = 'updated_at',
      sortOrder = 'DESC',
      include_stats = false
    } = req.query;

    // 🔧 简化查询，优先使用基础templates表，可选加载统计信息
    let query = `
      SELECT t.*, 
             COALESCE(ts.usage_count, t.usage_count, 0) as usage_count,
             ts.last_used_at,
             ts.avg_rating,
             ts.total_ratings,
             '1.0.0' as version_number,
             '初始版本' as version_notes,
             1 as is_current
      FROM templates t
      LEFT JOIN template_stats ts ON t.id = ts.template_id
      WHERE t.is_active = 1
    `;
    const params = [];

    // 类型过滤
    if (type) {
      query += ' AND t.type = ?';
      params.push(type);
    }

    // 分类过滤
    if (category) {
      query += ' AND t.category = ?';
      params.push(category);
    }

    // 状态过滤
    if (status && status !== 'all') {
      query += ' AND t.status = ?';
      params.push(status);
    }

    // 共享状态过滤
    if (shared !== undefined) {
      query += ' AND t.is_shared = ?';
      params.push(shared === 'true' ? 1 : 0);
    }

    // 作者过滤
    if (author) {
      query += ' AND t.created_by = ?';
      params.push(author);
    }

    // 搜索功能
    if (search) {
      query += ' AND (t.name LIKE ? OR t.description LIKE ? OR t.tags LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    // 标签过滤
    if (tags) {
      const tagList = tags.split(',').map(tag => tag.trim());
      tagList.forEach(tag => {
        query += ' AND t.tags LIKE ?';
        params.push(`%${tag}%`);
      });
    }

    // 版本过滤
    if (version) {
      query += ' AND tv.version_number = ?';
      params.push(version);
    }

    // 排序
    const validSortFields = ['name', 'created_at', 'updated_at', 'usage_count', 'avg_rating'];
    const validSortOrders = ['ASC', 'DESC'];
    
    if (validSortFields.includes(sortBy) && validSortOrders.includes(sortOrder.toUpperCase())) {
      const sortField = ['usage_count', 'avg_rating'].includes(sortBy) ? `ts.${sortBy}` : `t.${sortBy}`;
      query += ` ORDER BY ${sortField} ${sortOrder.toUpperCase()}`;
    }

    // 分页
    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const templates = await req.app.locals.db.all(query, params);

    // 处理模板数据
    const processedTemplates = templates.map(template => {
      const templateData = typeof template.template_data === 'string' 
        ? JSON.parse(template.template_data) 
        : template.template_data;

      return {
        ...template,
        template_data: templateData,
        tags: template.tags ? template.tags.split(',').map(tag => tag.trim()) : [],
        metadata: {
          usage_count: template.usage_count || 0,
          avg_rating: template.avg_rating || 0,
          total_ratings: template.total_ratings || 0,
          last_used_at: template.last_used_at,
          current_version: template.version_number || '1.0.0'
        }
      };
    });

    // 获取总数
    let countQuery = `
      SELECT COUNT(DISTINCT t.id) as total 
      FROM templates t
      LEFT JOIN template_versions tv ON t.id = tv.template_id AND tv.is_current = 1
      WHERE t.is_active = 1
    `;
    const countParams = [];

    // 应用相同的过滤条件
    if (type) {
      countQuery += ' AND t.type = ?';
      countParams.push(type);
    }
    if (category) {
      countQuery += ' AND t.category = ?';
      countParams.push(category);
    }
    if (status && status !== 'all') {
      countQuery += ' AND t.status = ?';
      countParams.push(status);
    }
    if (shared !== undefined) {
      countQuery += ' AND t.is_shared = ?';
      countParams.push(shared === 'true' ? 1 : 0);
    }
    if (author) {
      countQuery += ' AND t.created_by = ?';
      countParams.push(author);
    }
    if (search) {
      countQuery += ' AND (t.name LIKE ? OR t.description LIKE ? OR t.tags LIKE ?)';
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm, searchTerm, searchTerm);
    }

    const countResult = await req.app.locals.db.get(countQuery, countParams);

    // 可选：包含统计信息
    let stats = null;
    if (include_stats === 'true') {
      stats = await getTemplateStats(req.app.locals.db);
    }

    res.json({
      success: true,
      data: processedTemplates,
      pagination: {
        total: countResult.total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: countResult.total > parseInt(offset) + parseInt(limit)
      },
      stats
    });

  } catch (error) {
    console.error('获取模板列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取模板列表失败',
      error: error.message
    });
  }
});

/**
 * 🔍 获取单个模板详情（包含版本历史）
 */
router.get('/:templateId', async (req, res) => {
  try {
    const { templateId } = req.params;
    const { version, include_versions = false } = req.query;

    // 获取模板基本信息
    const template = await req.app.locals.db.get(`
      SELECT t.*, 
             COALESCE(ts.usage_count, t.usage_count, 0) as usage_count,
             ts.last_used_at,
             ts.avg_rating,
             ts.total_ratings,
             '1.0.0' as version_number,
             '初始版本' as version_notes,
             1 as is_current
      FROM templates t
      LEFT JOIN template_stats ts ON t.id = ts.template_id
      WHERE t.id = ? AND t.is_active = 1
    `, [templateId]);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: '模板不存在'
      });
    }

    const processedTemplate = {
      ...template,
      template_data: typeof template.template_data === 'string' 
        ? JSON.parse(template.template_data) 
        : template.template_data,
      tags: template.tags ? template.tags.split(',').map(tag => tag.trim()) : [],
      metadata: {
        usage_count: template.usage_count || 0,
        avg_rating: template.avg_rating || 0,
        total_ratings: template.total_ratings || 0,
        last_used_at: template.last_used_at,
        current_version: template.version_number || '1.0.0'
      }
    };

    // 可选：包含版本历史
    if (include_versions === 'true') {
      const versions = await req.app.locals.db.all(`
        SELECT version_number, version_notes, created_at, is_current
        FROM template_versions 
        WHERE template_id = ?
        ORDER BY created_at DESC
      `, [templateId]);
      
      processedTemplate.versions = versions;
    }

    res.json({
      success: true,
      data: processedTemplate
    });

  } catch (error) {
    console.error('获取模板详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取模板详情失败',
      error: error.message
    });
  }
});

/**
 * 📝 创建模板（增强版）
 */
router.post('/', async (req, res) => {
  try {
    const {
      name,
      type,
      category,
      templateData,
      template_data, // 兼容前端发送的字段名
      description,
      tags = [],
      isShared = false,
      versionNotes = '初始版本',
      metadata = {}
    } = req.body;

    // 兼容处理：优先使用templateData，否则使用template_data
    const finalTemplateData = templateData || template_data;

    // 验证必填字段
    if (!name || !type || !category || !finalTemplateData) {
      return res.status(400).json({
        success: false,
        message: '缺少必填字段',
        required: ['name', 'type', 'category', 'template_data']
      });
    }

    // 检查模板名称是否重复
    const existingTemplate = await req.app.locals.db.get(
      'SELECT id FROM templates WHERE name = ? AND is_active = 1',
      [name]
    );

    if (existingTemplate) {
      return res.status(400).json({
        success: false,
        message: '模板名称已存在'
      });
    }

    // 插入模板主记录
    const result = await req.app.locals.db.run(`
      INSERT INTO templates (
        name, type, category, template_data, description, tags, 
        is_shared, created_by, metadata
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      name, 
      type, 
      category, 
      JSON.stringify(finalTemplateData), 
      description || '', 
      Array.isArray(tags) ? tags.join(',') : tags,
      isShared ? 1 : 0,
      'admin',
      JSON.stringify(metadata)
    ]);

    const templateId = result.id;

    // 尝试创建初始版本记录和统计记录（可选，失败不影响主功能）
    try {
      await req.app.locals.db.run(`
        INSERT INTO template_versions (
          template_id, version_number, version_notes, template_data, is_current
        )
        VALUES (?, ?, ?, ?, 1)
      `, [templateId, '1.0.0', versionNotes, JSON.stringify(finalTemplateData)]);
    } catch (error) {
      console.warn('创建模板版本记录失败:', error.message);
    }

    try {
      await req.app.locals.db.run(`
        INSERT INTO template_stats (template_id, usage_count, total_ratings, avg_rating)
        VALUES (?, 0, 0, 0)
      `, [templateId]);
    } catch (error) {
      console.warn('创建模板统计记录失败:', error.message);
    }

    // 记录操作日志
    await req.app.locals.db.log(
      'create_template',
      'template',
      templateId.toString(),
      'admin',
      `创建模板: ${name}`,
      { type, category, isShared, tags }
    );

    res.status(201).json({
      success: true,
      message: '模板创建成功',
      data: {
        id: templateId,
        name,
        type,
        category,
        version: '1.0.0',
        isShared
      }
    });

  } catch (error) {
    console.error('创建模板失败:', error);
    res.status(500).json({
      success: false,
      message: '创建模板失败',
      error: error.message
    });
  }
});

/**
 * ✏️ 更新模板（支持版本控制）
 */
router.put('/:templateId', async (req, res) => {
  try {
    const { templateId } = req.params;
    const {
      name,
      description,
      tags,
      templateData,
      isShared,
      createNewVersion = false,
      versionNotes = '',
      metadata = {}
    } = req.body;

    // 检查模板是否存在
    const existingTemplate = await req.app.locals.db.get(
      'SELECT * FROM templates WHERE id = ? AND is_active = 1',
      [templateId]
    );

    if (!existingTemplate) {
      return res.status(404).json({
        success: false,
        message: '模板不存在'
      });
    }

    let updates = [];
    let params = [];

    // 构建更新SQL
    if (name) {
      updates.push('name = ?');
      params.push(name);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description);
    }
    if (tags !== undefined) {
      updates.push('tags = ?');
      params.push(Array.isArray(tags) ? tags.join(',') : tags);
    }
    if (isShared !== undefined) {
      updates.push('is_shared = ?');
      params.push(isShared ? 1 : 0);
    }
    if (Object.keys(metadata).length > 0) {
      updates.push('metadata = ?');
      params.push(JSON.stringify(metadata));
    }
    if (templateData && !createNewVersion) {
      updates.push('template_data = ?');
      params.push(JSON.stringify(templateData));
    }

    updates.push('updated_at = strftime(\'%s\', \'now\')');
    params.push(templateId);

    // 更新模板主记录
    if (updates.length > 1) { // 除了updated_at之外还有其他更新
      await req.app.locals.db.run(`
        UPDATE templates SET ${updates.join(', ')} WHERE id = ?
      `, params);
    }

    // 如果需要创建新版本
    if (createNewVersion && templateData) {
      // 获取当前最新版本号
      const currentVersion = await req.app.locals.db.get(`
        SELECT version_number FROM template_versions 
        WHERE template_id = ? AND is_current = 1
      `, [templateId]);

      const newVersion = incrementVersion(currentVersion?.version_number || '1.0.0');

      // 将当前版本设为非当前
      await req.app.locals.db.run(`
        UPDATE template_versions SET is_current = 0 WHERE template_id = ?
      `, [templateId]);

      // 创建新版本
      await req.app.locals.db.run(`
        INSERT INTO template_versions (
          template_id, version_number, version_notes, template_data, is_current
        )
        VALUES (?, ?, ?, ?, 1)
      `, [templateId, newVersion, versionNotes, JSON.stringify(templateData)]);

      // 更新模板主记录的template_data
      await req.app.locals.db.run(`
        UPDATE templates SET template_data = ? WHERE id = ?
      `, [JSON.stringify(templateData), templateId]);
    }

    // 记录操作日志
    await req.app.locals.db.log(
      'update_template',
      'template',
      templateId,
      'admin',
      `更新模板: ${existingTemplate.name}`,
      { createNewVersion, versionNotes }
    );

    res.json({
      success: true,
      message: '模板更新成功',
      data: {
        templateId,
        createNewVersion,
        newVersion: createNewVersion ? incrementVersion(
          await getCurrentVersion(req.app.locals.db, templateId)
        ) : null
      }
    });

  } catch (error) {
    console.error('更新模板失败:', error);
    res.status(500).json({
      success: false,
      message: '更新模板失败',
      error: error.message
    });
  }
});

/**
 * 🔄 复制模板
 */
router.post('/:templateId/duplicate', async (req, res) => {
  try {
    const { templateId } = req.params;
    const { 
      newName, 
      newCategory, 
      copyVersions = false,
      makeShared = false 
    } = req.body;

    // 获取原模板
    const originalTemplate = await req.app.locals.db.get(
      'SELECT * FROM templates WHERE id = ? AND is_active = 1',
      [templateId]
    );

    if (!originalTemplate) {
      return res.status(404).json({
        success: false,
        message: '原模板不存在'
      });
    }

    const duplicateName = newName || `${originalTemplate.name} (副本)`;

    // 创建复制的模板
    const result = await req.app.locals.db.run(`
      INSERT INTO templates (
        name, type, category, template_data, description, tags, 
        is_shared, created_by, metadata
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      duplicateName,
      originalTemplate.type,
      newCategory || originalTemplate.category,
      originalTemplate.template_data,
      originalTemplate.description,
      originalTemplate.tags,
      makeShared ? 1 : 0,
      'admin',
      originalTemplate.metadata
    ]);

    const newTemplateId = result.id;

    // 创建版本记录
    if (copyVersions) {
      // 复制所有版本
      const versions = await req.app.locals.db.all(`
        SELECT * FROM template_versions WHERE template_id = ?
      `, [templateId]);

      for (const version of versions) {
        await req.app.locals.db.run(`
          INSERT INTO template_versions (
            template_id, version_number, version_notes, template_data, is_current
          )
          VALUES (?, ?, ?, ?, ?)
        `, [
          newTemplateId,
          version.version_number,
          version.version_notes,
          version.template_data,
          version.is_current
        ]);
      }
    } else {
      // 只创建当前版本
      await req.app.locals.db.run(`
        INSERT INTO template_versions (
          template_id, version_number, version_notes, template_data, is_current
        )
        VALUES (?, ?, ?, ?, 1)
      `, [newTemplateId, '1.0.0', '从原模板复制', originalTemplate.template_data]);
    }

    // 初始化统计
    await req.app.locals.db.run(`
      INSERT INTO template_stats (template_id, usage_count, total_ratings, avg_rating)
      VALUES (?, 0, 0, 0)
    `, [newTemplateId]);

    // 记录日志
    await req.app.locals.db.log(
      'duplicate_template',
      'template',
      newTemplateId.toString(),
      'admin',
      `复制模板: ${originalTemplate.name} -> ${duplicateName}`,
      { originalTemplateId: templateId, copyVersions }
    );

    res.status(201).json({
      success: true,
      message: '模板复制成功',
      data: {
        originalId: templateId,
        newId: newTemplateId,
        newName: duplicateName
      }
    });

  } catch (error) {
    console.error('复制模板失败:', error);
    res.status(500).json({
      success: false,
      message: '复制模板失败',
      error: error.message
    });
  }
});

/**
 * 📤 导出模板
 */
router.get('/:templateId/export', async (req, res) => {
  try {
    const { templateId } = req.params;
    const { format = 'json', include_versions = false } = req.query;

    // 获取模板数据
    const template = await req.app.locals.db.get(`
      SELECT t.*, tv.version_number, tv.version_notes
      FROM templates t
      LEFT JOIN template_versions tv ON t.id = tv.template_id AND tv.is_current = 1
      WHERE t.id = ? AND t.is_active = 1
    `, [templateId]);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: '模板不存在'
      });
    }

    let exportData = {
      template: {
        name: template.name,
        type: template.type,
        category: template.category,
        description: template.description,
        tags: template.tags ? template.tags.split(',') : [],
        template_data: typeof template.template_data === 'string' 
          ? JSON.parse(template.template_data) 
          : template.template_data,
        version: template.version_number || '1.0.0',
        version_notes: template.version_notes,
        exported_at: new Date().toISOString(),
        exported_by: 'admin'
      }
    };

    // 可选：包含版本历史
    if (include_versions === 'true') {
      const versions = await req.app.locals.db.all(`
        SELECT version_number, version_notes, template_data, created_at
        FROM template_versions 
        WHERE template_id = ?
        ORDER BY created_at ASC
      `, [templateId]);
      
      exportData.versions = versions.map(v => ({
        version: v.version_number,
        notes: v.version_notes,
        data: typeof v.template_data === 'string' ? JSON.parse(v.template_data) : v.template_data,
        created_at: v.created_at
      }));
    }

    // 根据格式返回
    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="template_${templateId}_${Date.now()}.json"`);
      res.json(exportData);
    } else {
      res.status(400).json({
        success: false,
        message: '不支持的导出格式'
      });
    }

    // 记录导出日志
    await req.app.locals.db.log(
      'export_template',
      'template',
      templateId,
      'admin',
      `导出模板: ${template.name}`,
      { format, include_versions }
    );

  } catch (error) {
    console.error('导出模板失败:', error);
    res.status(500).json({
      success: false,
      message: '导出模板失败',
      error: error.message
    });
  }
});

/**
 * 📥 导入模板
 */
router.post('/import', upload.single('templateFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '请选择模板文件'
      });
    }

    const { override_existing = false, import_versions = false } = req.body;

    // 读取并解析文件
    const fileContent = await fs.readFile(req.file.path, 'utf8');
    const importData = JSON.parse(fileContent);

    if (!importData.template) {
      return res.status(400).json({
        success: false,
        message: '无效的模板文件格式'
      });
    }

    const template = importData.template;

    // 检查是否已存在
    const existingTemplate = await req.app.locals.db.get(
      'SELECT id FROM templates WHERE name = ? AND is_active = 1',
      [template.name]
    );

    if (existingTemplate && !override_existing) {
      return res.status(400).json({
        success: false,
        message: '模板名称已存在，请启用覆盖选项或修改模板名称'
      });
    }

    let templateId;

    if (existingTemplate && override_existing) {
      // 更新现有模板
      templateId = existingTemplate.id;
      
      await req.app.locals.db.run(`
        UPDATE templates SET 
          type = ?, category = ?, template_data = ?, description = ?, tags = ?,
          updated_at = strftime('%s', 'now')
        WHERE id = ?
      `, [
        template.type,
        template.category,
        JSON.stringify(template.template_data),
        template.description,
        Array.isArray(template.tags) ? template.tags.join(',') : template.tags,
        templateId
      ]);
    } else {
      // 创建新模板
      const result = await req.app.locals.db.run(`
        INSERT INTO templates (
          name, type, category, template_data, description, tags, 
          is_shared, created_by
        )
        VALUES (?, ?, ?, ?, ?, ?, 0, ?)
      `, [
        template.name,
        template.type,
        template.category,
        JSON.stringify(template.template_data),
        template.description,
        Array.isArray(template.tags) ? template.tags.join(',') : template.tags,
        'admin'
      ]);

      templateId = result.id;

      // 初始化统计
      await req.app.locals.db.run(`
        INSERT INTO template_stats (template_id, usage_count, total_ratings, avg_rating)
        VALUES (?, 0, 0, 0)
      `, [templateId]);
    }

    // 处理版本导入
    if (import_versions && importData.versions) {
      // 删除现有版本
      await req.app.locals.db.run(
        'DELETE FROM template_versions WHERE template_id = ?',
        [templateId]
      );

      // 导入所有版本
      for (let i = 0; i < importData.versions.length; i++) {
        const version = importData.versions[i];
        const isLatest = i === importData.versions.length - 1;
        
        await req.app.locals.db.run(`
          INSERT INTO template_versions (
            template_id, version_number, version_notes, template_data, is_current
          )
          VALUES (?, ?, ?, ?, ?)
        `, [
          templateId,
          version.version,
          version.notes,
          JSON.stringify(version.data),
          isLatest ? 1 : 0
        ]);
      }
    } else {
      // 创建单个版本
      await req.app.locals.db.run(`
        INSERT OR REPLACE INTO template_versions (
          template_id, version_number, version_notes, template_data, is_current
        )
        VALUES (?, ?, ?, ?, 1)
      `, [
        templateId,
        template.version || '1.0.0',
        template.version_notes || '导入的模板',
        JSON.stringify(template.template_data)
      ]);
    }

    // 清理临时文件
    await fs.unlink(req.file.path);

    // 记录日志
    await req.app.locals.db.log(
      'import_template',
      'template',
      templateId.toString(),
      'admin',
      `导入模板: ${template.name}`,
      { override_existing, import_versions }
    );

    res.status(201).json({
      success: true,
      message: '模板导入成功',
      data: {
        templateId,
        name: template.name,
        isUpdate: !!existingTemplate
      }
    });

  } catch (error) {
    console.error('导入模板失败:', error);
    res.status(500).json({
      success: false,
      message: '导入模板失败',
      error: error.message
    });
  }
});

/**
 * ⭐ 模板评分
 */
router.post('/:templateId/rating', async (req, res) => {
  try {
    const { templateId } = req.params;
    const { rating, comment = '' } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: '评分必须在1-5之间'
      });
    }

    // 检查模板是否存在
    const template = await req.app.locals.db.get(
      'SELECT id FROM templates WHERE id = ? AND is_active = 1',
      [templateId]
    );

    if (!template) {
      return res.status(404).json({
        success: false,
        message: '模板不存在'
      });
    }

    // 添加评分记录
    await req.app.locals.db.run(`
      INSERT INTO template_ratings (template_id, rating, comment, created_by)
      VALUES (?, ?, ?, ?)
    `, [templateId, rating, comment, 'admin']);

    // 更新统计
    await updateTemplateRatingStats(req.app.locals.db, templateId);

    res.json({
      success: true,
      message: '评分提交成功'
    });

  } catch (error) {
    console.error('提交评分失败:', error);
    res.status(500).json({
      success: false,
      message: '提交评分失败',
      error: error.message
    });
  }
});

/**
 * 📊 获取模板统计信息
 */
router.get('/stats/overview', async (req, res) => {
  try {
    const stats = await getTemplateStats(req.app.locals.db);

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('获取模板统计失败:', error);
    res.status(500).json({
      success: false,
      message: '获取模板统计失败',
      error: error.message
    });
  }
});

/**
 * 🗑️ 批量删除模板
 */
router.post('/batch/delete', async (req, res) => {
  try {
    const { templateIds, permanently = false } = req.body;

    if (!templateIds || !Array.isArray(templateIds) || templateIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请提供要删除的模板ID列表'
      });
    }

    const deletedTemplates = [];
    const errors = [];

    for (const templateId of templateIds) {
      try {
        const template = await req.app.locals.db.get(
          'SELECT name FROM templates WHERE id = ? AND is_active = 1',
          [templateId]
        );

        if (!template) {
          errors.push({
            id: templateId,
            error: '模板不存在'
          });
          continue;
        }

        if (permanently) {
          // 永久删除
          await req.app.locals.db.run('DELETE FROM template_versions WHERE template_id = ?', [templateId]);
          await req.app.locals.db.run('DELETE FROM template_stats WHERE template_id = ?', [templateId]);
          await req.app.locals.db.run('DELETE FROM template_ratings WHERE template_id = ?', [templateId]);
          await req.app.locals.db.run('DELETE FROM templates WHERE id = ?', [templateId]);
        } else {
          // 软删除
          await req.app.locals.db.run(`
            UPDATE templates SET is_active = 0, updated_at = strftime('%s', 'now')
            WHERE id = ?
          `, [templateId]);
        }

        deletedTemplates.push({
          id: templateId,
          name: template.name
        });

      } catch (error) {
        errors.push({
          id: templateId,
          error: error.message
        });
      }
    }

    // 记录批量删除日志
    await req.app.locals.db.log(
      'batch_delete_templates',
      'template',
      'batch',
      'admin',
      `批量删除 ${deletedTemplates.length} 个模板`,
      { 
        successCount: deletedTemplates.length, 
        errorCount: errors.length,
        permanently,
        templateIds 
      }
    );

    res.json({
      success: true,
      message: `批量删除完成：成功 ${deletedTemplates.length} 个，失败 ${errors.length} 个`,
      data: {
        deleted: deletedTemplates,
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

// ==================== 已有功能保持不变 ====================

/**
 * 获取体育模板
 */
router.get('/sports', async (req, res) => {
  try {
    const { sport, league } = req.query;
    
    const templates = await req.app.locals.db.getTemplates('sports');
    
    let filteredTemplates = templates;
    
    if (sport) {
      filteredTemplates = filteredTemplates.filter(t => 
        t.template_data.category === sport
      );
    }
    
    if (league) {
      filteredTemplates = filteredTemplates.filter(t => 
        t.template_data.league === league
      );
    }

    res.json({
      success: true,
      data: filteredTemplates
    });

  } catch (error) {
    console.error('获取体育模板失败:', error);
    res.status(500).json({
      success: false,
      message: '获取体育模板失败',
      error: error.message
    });
  }
});

/**
 * 应用模板创建市场
 */
router.post('/:templateId/apply', async (req, res) => {
  try {
    const { templateId } = req.params;
    const { parameters, customizations = {} } = req.body;

    // 获取模板
    const template = await req.app.locals.db.get(`
      SELECT * FROM templates WHERE id = ? AND is_active = 1
    `, [templateId]);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: '模板不存在'
      });
    }

    // 解析模板数据
    const templateData = typeof template.template_data === 'string' 
      ? JSON.parse(template.template_data) 
      : template.template_data;

    // 应用模板参数
    const marketData = applyTemplate(templateData, parameters, customizations);

    // 增加使用计数（优先更新template_stats，否则更新templates表）
    const statsUpdated = await req.app.locals.db.run(`
      UPDATE template_stats SET 
        usage_count = usage_count + 1,
        last_used_at = strftime('%s', 'now')
      WHERE template_id = ?
    `, [templateId]);

    // 如果没有统计记录，更新基础表
    if (statsUpdated.changes === 0) {
      await req.app.locals.db.run(`
        UPDATE templates SET 
          usage_count = usage_count + 1,
          updated_at = strftime('%s', 'now')
        WHERE id = ?
      `, [templateId]);
    }

    // 记录日志
    await req.app.locals.db.log(
      'apply_template',
      'template',
      templateId,
      'admin',
      `应用模板: ${template.name}`,
      { parameters, customizations }
    );

    res.json({
      success: true,
      message: '模板应用成功',
      data: {
        templateId,
        templateName: template.name,
        marketData
      }
    });

  } catch (error) {
    console.error('应用模板失败:', error);
    res.status(500).json({
      success: false,
      message: '应用模板失败',
      error: error.message
    });
  }
});

/**
 * 软删除模板
 */
router.delete('/:templateId', async (req, res) => {
  try {
    const { templateId } = req.params;

    // 软删除：设置is_active = 0
    await req.app.locals.db.run(`
      UPDATE templates SET is_active = 0, updated_at = strftime('%s', 'now')
      WHERE id = ?
    `, [templateId]);

    await req.app.locals.db.log(
      'delete_template',
      'template',
      templateId,
      'admin',
      `删除模板`
    );

    res.json({
      success: true,
      message: '模板删除成功'
    });

  } catch (error) {
    console.error('删除模板失败:', error);
    res.status(500).json({
      success: false,
      message: '删除模板失败',
      error: error.message
    });
  }
});

// ==================== 参数获取函数保持不变 ====================

router.get('/football/parameters', (req, res) => {
  try {
    const parameters = {
      leagues: [
        { id: 'premier-league', name: '英超', displayName: '英格兰足球超级联赛' },
        { id: 'la-liga', name: '西甲', displayName: '西班牙足球甲级联赛' },
        { id: 'bundesliga', name: '德甲', displayName: '德国足球甲级联赛' },
        { id: 'serie-a', name: '意甲', displayName: '意大利足球甲级联赛' },
        { id: 'champions-league', name: '欧冠', displayName: '欧洲冠军联赛' },
        { id: 'europa-league', name: '欧联', displayName: '欧洲联盟杯' },
        { id: 'world-cup', name: '世界杯', displayName: 'FIFA世界杯' },
        { id: 'euro-cup', name: '欧洲杯', displayName: '欧洲足球锦标赛' }
      ],
      handicaps: [
        { value: -3.5, display: '-3.5球', label: '主队让3.5球' },
        { value: -2.5, display: '-2.5球', label: '主队让2.5球' },
        { value: -1.5, display: '-1.5球', label: '主队让1.5球' },
        { value: -0.5, display: '-0.5球', label: '主队让0.5球' },
        { value: 0.5, display: '+0.5球', label: '主队受让0.5球' },
        { value: 1.5, display: '+1.5球', label: '主队受让1.5球' },
        { value: 2.5, display: '+2.5球', label: '主队受让2.5球' },
        { value: 3.5, display: '+3.5球', label: '主队受让3.5球' }
      ],
      marketTypes: [
        { id: 'win-lose', name: '胜负盘', description: '预测比赛获胜方' },
        { id: 'handicap', name: '让球盘', description: '主队让球后的胜负' },
        { id: 'total-goals', name: '大小球', description: '预测总进球数' }
      ]
    };

    res.json({
      success: true,
      data: parameters
    });

  } catch (error) {
    console.error('获取足球参数失败:', error);
    res.status(500).json({
      success: false,
      message: '获取足球参数失败',
      error: error.message
    });
  }
});

router.get('/basketball/parameters', (req, res) => {
  try {
    const parameters = {
      leagues: [
        { id: 'nba', name: 'NBA', displayName: '美国职业篮球联赛' },
        { id: 'cba', name: 'CBA', displayName: '中国男子篮球职业联赛' },
        { id: 'euroleague', name: '欧洲篮球联赛', displayName: 'EuroLeague' }
      ],
      marketTypes: [
        { id: 'win-lose', name: '胜负盘', description: '预测比赛获胜方' },
        { id: 'total-points', name: '大小分', description: '预测总得分' }
      ]
    };

    res.json({
      success: true,
      data: parameters
    });

  } catch (error) {
    console.error('获取篮球参数失败:', error);
    res.status(500).json({
      success: false,
      message: '获取篮球参数失败',
      error: error.message
    });
  }
});

router.get('/finance/parameters', (req, res) => {
  try {
    const parameters = {
      categories: [
        { id: 'crypto', name: '加密货币', icon: '₿' },
        { id: 'stocks', name: '股票', icon: '📈' },
        { id: 'forex', name: '外汇', icon: '💱' },
        { id: 'commodities', name: '大宗商品', icon: '🛢️' }
      ],
      cryptocurrencies: [
        { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC', displayName: '比特币' },
        { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', displayName: '以太坊' },
        { id: 'binancecoin', name: 'BNB', symbol: 'BNB', displayName: '币安币' }
      ],
      priceRanges: [
        { crypto: 'bitcoin', ranges: ['50000', '60000', '70000', '80000', '100000', '120000'] },
        { crypto: 'ethereum', ranges: ['2000', '3000', '4000', '5000', '6000', '8000'] },
        { crypto: 'binancecoin', ranges: ['300', '400', '500', '600', '800', '1000'] }
      ],
      timeframes: [
        { id: '1day', name: '24小时内', display: '24小时' },
        { id: '1week', name: '1周内', display: '1周' },
        { id: '1month', name: '1个月内', display: '1个月' },
        { id: '3months', name: '3个月内', display: '3个月' },
        { id: '1year', name: '1年内', display: '1年' }
      ]
    };

    res.json({
      success: true,
      data: parameters
    });

  } catch (error) {
    console.error('获取财经参数失败:', error);
    res.status(500).json({
      success: false,
      message: '获取财经参数失败',
      error: error.message
    });
  }
});

// ==================== 辅助函数 ====================

/**
 * 应用模板逻辑
 */
function applyTemplate(templateData, parameters, customizations) {
  const {
    type,
    category,
    title_template,
    description_template,
    options
  } = templateData;

  let marketData = {
    type,
    category,
    title: title_template,
    description: description_template,
    optionA: options.optionA,
    optionB: options.optionB,
    ...customizations
  };

  // 替换模板变量
  if (parameters) {
    Object.keys(parameters).forEach(key => {
      const value = parameters[key];
      const placeholder = `{${key}}`;
      
      marketData.title = marketData.title.replace(new RegExp(placeholder, 'g'), value);
      marketData.description = marketData.description.replace(new RegExp(placeholder, 'g'), value);
      marketData.optionA = marketData.optionA.replace(new RegExp(placeholder, 'g'), value);
      marketData.optionB = marketData.optionB.replace(new RegExp(placeholder, 'g'), value);
    });
  }

  return marketData;
}

/**
 * 版本号递增
 */
function incrementVersion(currentVersion) {
  const parts = currentVersion.split('.').map(Number);
  parts[2] = (parts[2] || 0) + 1; // 递增修订号
  return parts.join('.');
}

/**
 * 获取当前版本号
 */
async function getCurrentVersion(db, templateId) {
  const result = await db.get(`
    SELECT version_number FROM template_versions 
    WHERE template_id = ? AND is_current = 1
  `, [templateId]);
  
  return result?.version_number || '1.0.0';
}

/**
 * 获取模板统计信息
 */
async function getTemplateStats(db) {
  // 总数统计
  const totalStats = await db.get('SELECT COUNT(*) as total FROM templates WHERE is_active = 1');
  
  // 按类型统计
  const typeStats = await db.all(`
    SELECT type, COUNT(*) as count
    FROM templates 
    WHERE is_active = 1
    GROUP BY type
  `);

  // 按分类统计
  const categoryStats = await db.all(`
    SELECT category, COUNT(*) as count
    FROM templates 
    WHERE is_active = 1
    GROUP BY category
    ORDER BY count DESC
  `);

  // 使用频率统计
  const usageStats = await db.all(`
    SELECT t.name, ts.usage_count, ts.avg_rating
    FROM templates t
    JOIN template_stats ts ON t.id = ts.template_id
    WHERE t.is_active = 1
    ORDER BY ts.usage_count DESC
    LIMIT 10
  `);

  // 最新模板
  const recentTemplates = await db.all(`
    SELECT name, type, category, created_at
    FROM templates 
    WHERE is_active = 1
    ORDER BY created_at DESC 
    LIMIT 10
  `);

  // 评分统计
  const ratingStats = await db.get(`
    SELECT 
      AVG(ts.avg_rating) as overall_avg_rating,
      COUNT(*) as rated_templates
    FROM template_stats ts
    JOIN templates t ON ts.template_id = t.id
    WHERE t.is_active = 1 AND ts.total_ratings > 0
  `);

  return {
    overview: {
      totalTemplates: totalStats.total,
      ratedTemplates: ratingStats.rated_templates || 0,
      overallAvgRating: ratingStats.overall_avg_rating || 0
    },
    byType: typeStats,
    byCategory: categoryStats,
    mostUsed: usageStats,
    recent: recentTemplates,
    ratings: ratingStats
  };
}

/**
 * 更新模板评分统计
 */
async function updateTemplateRatingStats(db, templateId) {
  const ratingStats = await db.get(`
    SELECT 
      COUNT(*) as total_ratings,
      AVG(rating) as avg_rating
    FROM template_ratings 
    WHERE template_id = ?
  `, [templateId]);

  await db.run(`
    UPDATE template_stats SET 
      total_ratings = ?,
      avg_rating = ?
    WHERE template_id = ?
  `, [ratingStats.total_ratings, ratingStats.avg_rating, templateId]);
}

module.exports = router;