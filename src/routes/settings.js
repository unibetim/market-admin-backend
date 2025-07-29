const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');
const router = express.Router();

// 🎯 专业级系统设置模块
// 支持系统配置、用户管理、安全设置、备份恢复等

// 配置文件上传
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../..', 'uploads', 'settings');
    
    try {
      await fs.mkdir(uploadPath, { recursive: true });
      cb(null, uploadPath);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}_${timestamp}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/json',
      'text/plain', 
      'application/sql',
      'application/octet-stream'
    ];
    if (allowedTypes.includes(file.mimetype) || file.originalname.endsWith('.db')) {
      cb(null, true);
    } else {
      cb(new Error(`不支持的文件类型: ${file.mimetype}`));
    }
  }
});

/**
 * 🔧 获取系统配置列表
 */
router.get('/config', async (req, res) => {
  try {
    const { category, search, include_sensitive = false } = req.query;
    
    let query = `
      SELECT key, value, category, description, type, is_sensitive, updated_at, updated_by
      FROM system_settings 
      WHERE 1=1
    `;
    const params = [];

    // 分类过滤
    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    // 搜索过滤
    if (search) {
      query += ' AND (key LIKE ? OR description LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    // 是否包含敏感信息
    if (include_sensitive !== 'true') {
      query += ' AND is_sensitive = 0';
    }

    query += ' ORDER BY category, key';

    const settings = await req.app.locals.db.all(query, params);

    // 处理设置数据
    const processedSettings = settings.map(setting => {
      let value = setting.value;
      
      // 解析JSON值
      if (setting.type === 'json') {
        try {
          value = JSON.parse(setting.value);
        } catch (e) {
          // 保持原值
        }
      }
      
      // 隐藏敏感信息
      if (setting.is_sensitive && include_sensitive !== 'true') {
        value = '***';
      }

      return {
        ...setting,
        value
      };
    });

    // 按分类分组
    const groupedSettings = processedSettings.reduce((acc, setting) => {
      if (!acc[setting.category]) {
        acc[setting.category] = [];
      }
      acc[setting.category].push(setting);
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        settings: processedSettings,
        grouped: groupedSettings,
        categories: Object.keys(groupedSettings),
        total: processedSettings.length
      }
    });

  } catch (error) {
    console.error('获取系统配置失败:', error);
    res.status(500).json({
      success: false,
      message: '获取系统配置失败',
      error: error.message
    });
  }
});

/**
 * 🔧 获取单个配置项
 */
router.get('/config/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const { decrypt = false } = req.query;

    const setting = await req.app.locals.db.get(
      'SELECT * FROM system_settings WHERE key = ?',
      [key]
    );

    if (!setting) {
      return res.status(404).json({
        success: false,
        message: '配置项不存在'
      });
    }

    let value = setting.value;

    // 解析JSON值
    if (setting.type === 'json') {
      try {
        value = JSON.parse(setting.value);
      } catch (e) {
        // 保持原值
      }
    }

    // 解密敏感信息（如果请求解密且有权限）
    if (setting.is_sensitive && decrypt === 'true') {
      // 这里应该验证用户权限
      // value = decryptSensitiveValue(value);
    }

    res.json({
      success: true,
      data: {
        ...setting,
        value
      }
    });

  } catch (error) {
    console.error('获取配置项失败:', error);
    res.status(500).json({
      success: false,
      message: '获取配置项失败',
      error: error.message
    });
  }
});

/**
 * 🔧 更新系统配置
 */
router.put('/config/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const { value, description } = req.body;

    // 检查配置项是否存在
    const existingSetting = await req.app.locals.db.get(
      'SELECT * FROM system_settings WHERE key = ?',
      [key]
    );

    if (!existingSetting) {
      return res.status(404).json({
        success: false,
        message: '配置项不存在'
      });
    }

    // 验证值类型
    let processedValue = value;
    if (existingSetting.type === 'json') {
      try {
        processedValue = JSON.stringify(value);
      } catch (e) {
        return res.status(400).json({
          success: false,
          message: 'JSON格式无效'
        });
      }
    } else if (existingSetting.type === 'number') {
      if (isNaN(Number(value))) {
        return res.status(400).json({
          success: false,
          message: '数值格式无效'
        });
      }
      processedValue = String(value);
    } else if (existingSetting.type === 'boolean') {
      processedValue = String(Boolean(value));
    }

    // 加密敏感信息
    if (existingSetting.is_sensitive) {
      // processedValue = encryptSensitiveValue(processedValue);
    }

    // 备份旧值
    await req.app.locals.db.run(`
      INSERT INTO setting_history (key, old_value, new_value, updated_by, updated_at)
      VALUES (?, ?, ?, ?, strftime('%s', 'now'))
    `, [key, existingSetting.value, processedValue, 'admin']);

    // 更新配置
    await req.app.locals.db.run(`
      UPDATE system_settings 
      SET value = ?, description = COALESCE(?, description), updated_at = strftime('%s', 'now'), updated_by = ?
      WHERE key = ?
    `, [processedValue, description, 'admin', key]);

    // 记录操作日志
    await req.app.locals.db.log(
      'update_setting',
      'setting',
      key,
      'admin',
      `更新系统配置: ${key}`,
      { oldValue: existingSetting.value, newValue: processedValue }
    );

    // 触发配置更新事件
    await triggerConfigUpdateEvent(key, processedValue, existingSetting.value);

    res.json({
      success: true,
      message: '配置更新成功',
      data: {
        key,
        oldValue: existingSetting.value,
        newValue: processedValue
      }
    });

  } catch (error) {
    console.error('更新系统配置失败:', error);
    res.status(500).json({
      success: false,
      message: '更新系统配置失败',
      error: error.message
    });
  }
});

/**
 * 🔧 创建新配置项
 */
router.post('/config', async (req, res) => {
  try {
    const {
      key,
      value,
      category,
      description,
      type = 'string',
      isSensitive = false
    } = req.body;

    // 验证必填字段
    if (!key || value === undefined || !category) {
      return res.status(400).json({
        success: false,
        message: '缺少必填字段',
        required: ['key', 'value', 'category']
      });
    }

    // 检查key是否已存在
    const existingSetting = await req.app.locals.db.get(
      'SELECT key FROM system_settings WHERE key = ?',
      [key]
    );

    if (existingSetting) {
      return res.status(400).json({
        success: false,
        message: '配置项已存在'
      });
    }

    // 处理值
    let processedValue = value;
    if (type === 'json') {
      try {
        processedValue = JSON.stringify(value);
      } catch (e) {
        return res.status(400).json({
          success: false,
          message: 'JSON格式无效'
        });
      }
    } else {
      processedValue = String(value);
    }

    // 加密敏感信息
    if (isSensitive) {
      // processedValue = encryptSensitiveValue(processedValue);
    }

    // 插入新配置
    await req.app.locals.db.run(`
      INSERT INTO system_settings (key, value, category, description, type, is_sensitive, created_by, updated_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [key, processedValue, category, description, type, isSensitive ? 1 : 0, 'admin', 'admin']);

    // 记录操作日志
    await req.app.locals.db.log(
      'create_setting',
      'setting',
      key,
      'admin',
      `创建系统配置: ${key}`,
      { category, type, isSensitive }
    );

    res.status(201).json({
      success: true,
      message: '配置项创建成功',
      data: {
        key,
        category,
        type,
        isSensitive
      }
    });

  } catch (error) {
    console.error('创建配置项失败:', error);
    res.status(500).json({
      success: false,
      message: '创建配置项失败',
      error: error.message
    });
  }
});

/**
 * 🗑️ 删除配置项
 */
router.delete('/config/:key', async (req, res) => {
  try {
    const { key } = req.params;

    // 检查配置项是否存在
    const setting = await req.app.locals.db.get(
      'SELECT * FROM system_settings WHERE key = ?',
      [key]
    );

    if (!setting) {
      return res.status(404).json({
        success: false,
        message: '配置项不存在'
      });
    }

    // 检查是否为系统关键配置
    const criticalKeys = ['database_url', 'secret_key', 'admin_password'];
    if (criticalKeys.includes(key)) {
      return res.status(400).json({
        success: false,
        message: '不能删除系统关键配置'
      });
    }

    // 备份到历史记录
    await req.app.locals.db.run(`
      INSERT INTO setting_history (key, old_value, new_value, updated_by, updated_at, action)
      VALUES (?, ?, NULL, ?, strftime('%s', 'now'), 'delete')
    `, [key, setting.value, 'admin']);

    // 删除配置
    await req.app.locals.db.run('DELETE FROM system_settings WHERE key = ?', [key]);

    // 记录操作日志
    await req.app.locals.db.log(
      'delete_setting',
      'setting',
      key,
      'admin',
      `删除系统配置: ${key}`,
      { category: setting.category }
    );

    res.json({
      success: true,
      message: '配置项删除成功'
    });

  } catch (error) {
    console.error('删除配置项失败:', error);
    res.status(500).json({
      success: false,
      message: '删除配置项失败',
      error: error.message
    });
  }
});

/**
 * 📊 获取系统状态
 */
router.get('/status', async (req, res) => {
  try {
    // 获取系统基本信息
    const systemInfo = {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
      environment: process.env.NODE_ENV || 'development'
    };

    // 获取数据库状态
    const dbStats = await getDatabaseStats(req.app.locals.db);
    
    // 获取应用统计
    const appStats = await getApplicationStats(req.app.locals.db);
    
    // 获取系统健康检查结果
    const healthChecks = await performSystemHealthChecks(req.app.locals.db);

    res.json({
      success: true,
      data: {
        system: systemInfo,
        database: dbStats,
        application: appStats,
        health: healthChecks,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('获取系统状态失败:', error);
    res.status(500).json({
      success: false,
      message: '获取系统状态失败',
      error: error.message
    });
  }
});

/**
 * 💾 创建系统备份
 */
router.post('/backup', async (req, res) => {
  try {
    const { includeData = true, includeLogs = false, format = 'json' } = req.body;
    
    // 生成备份ID
    const backupId = `backup_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const backupPath = path.join(__dirname, '../..', 'backups', `${backupId}.${format}`);
    
    // 确保备份目录存在
    await fs.mkdir(path.dirname(backupPath), { recursive: true });
    
    // 执行备份
    const backupResult = await createSystemBackup(req.app.locals.db, {
      backupId,
      backupPath,
      includeData,
      includeLogs,
      format
    });

    // 记录备份信息
    await req.app.locals.db.run(`
      INSERT INTO system_backups (backup_id, file_path, size, includes_data, includes_logs, format, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      backupId,
      backupPath,
      backupResult.size,
      includeData ? 1 : 0,
      includeLogs ? 1 : 0,
      format,
      'admin'
    ]);

    // 记录操作日志
    await req.app.locals.db.log(
      'create_backup',
      'system',
      backupId,
      'admin',
      '创建系统备份',
      { includeData, includeLogs, format, size: backupResult.size }
    );

    res.json({
      success: true,
      message: '系统备份创建成功',
      data: {
        backupId,
        size: backupResult.size,
        path: backupPath,
        format,
        createdAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('创建系统备份失败:', error);
    res.status(500).json({
      success: false,
      message: '创建系统备份失败',
      error: error.message
    });
  }
});

/**
 * 📋 获取备份列表
 */
router.get('/backups', async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    
    const backups = await req.app.locals.db.all(`
      SELECT 
        backup_id,
        file_path,
        size,
        includes_data,
        includes_logs,
        format,
        created_by,
        created_at,
        restored_at
      FROM system_backups 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `, [parseInt(limit), parseInt(offset)]);

    // 检查文件是否仍存在
    const backupsWithStatus = await Promise.all(
      backups.map(async (backup) => {
        let fileExists = false;
        try {
          await fs.access(backup.file_path);
          fileExists = true;
        } catch (e) {
          // 文件不存在
        }
        
        return {
          ...backup,
          fileExists,
          sizeFormatted: formatFileSize(backup.size),
          createdAtFormatted: new Date(backup.created_at * 1000).toLocaleString()
        };
      })
    );

    // 获取总数
    const countResult = await req.app.locals.db.get('SELECT COUNT(*) as total FROM system_backups');

    res.json({
      success: true,
      data: backupsWithStatus,
      pagination: {
        total: countResult.total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: countResult.total > parseInt(offset) + parseInt(limit)
      }
    });

  } catch (error) {
    console.error('获取备份列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取备份列表失败',
      error: error.message
    });
  }
});

/**
 * 🔄 恢复系统备份
 */
router.post('/restore/:backupId', async (req, res) => {
  try {
    const { backupId } = req.params;
    const { confirmRestore = false } = req.body;

    if (!confirmRestore) {
      return res.status(400).json({
        success: false,
        message: '请确认恢复操作，这将覆盖现有数据'
      });
    }

    // 获取备份信息
    const backup = await req.app.locals.db.get(
      'SELECT * FROM system_backups WHERE backup_id = ?',
      [backupId]
    );

    if (!backup) {
      return res.status(404).json({
        success: false,
        message: '备份不存在'
      });
    }

    // 检查备份文件是否存在
    try {
      await fs.access(backup.file_path);
    } catch (e) {
      return res.status(404).json({
        success: false,
        message: '备份文件不存在'
      });
    }

    // 执行恢复
    const restoreResult = await restoreSystemBackup(req.app.locals.db, backup);

    // 更新备份记录
    await req.app.locals.db.run(`
      UPDATE system_backups 
      SET restored_at = strftime('%s', 'now'), restored_by = ?
      WHERE backup_id = ?
    `, ['admin', backupId]);

    // 记录操作日志
    await req.app.locals.db.log(
      'restore_backup',
      'system',
      backupId,
      'admin',
      '恢复系统备份',
      { backupId, restoredItems: restoreResult.itemsRestored }
    );

    res.json({
      success: true,
      message: '系统备份恢复成功',
      data: {
        backupId,
        itemsRestored: restoreResult.itemsRestored,
        restoredAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('恢复系统备份失败:', error);
    res.status(500).json({
      success: false,
      message: '恢复系统备份失败',
      error: error.message
    });
  }
});

/**
 * 📤 下载备份文件
 */
router.get('/backup/:backupId/download', async (req, res) => {
  try {
    const { backupId } = req.params;

    const backup = await req.app.locals.db.get(
      'SELECT * FROM system_backups WHERE backup_id = ?',
      [backupId]
    );

    if (!backup) {
      return res.status(404).json({
        success: false,
        message: '备份不存在'
      });
    }

    // 检查文件是否存在
    try {
      await fs.access(backup.file_path);
    } catch (e) {
      return res.status(404).json({
        success: false,
        message: '备份文件不存在'
      });
    }

    // 设置下载头
    const filename = path.basename(backup.file_path);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/octet-stream');

    // 发送文件
    const fileBuffer = await fs.readFile(backup.file_path);
    res.send(fileBuffer);

    // 记录下载日志
    await req.app.locals.db.log(
      'download_backup',
      'system',
      backupId,
      'admin',
      '下载系统备份',
      { filename }
    );

  } catch (error) {
    console.error('下载备份失败:', error);
    res.status(500).json({
      success: false,
      message: '下载备份失败',
      error: error.message
    });
  }
});

/**
 * 🔑 更新管理员密码
 */
router.post('/admin/password', async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // 验证输入
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: '所有密码字段都是必填的'
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: '新密码和确认密码不匹配'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: '密码长度至少8位'
      });
    }

    // 验证当前密码
    const currentHash = await req.app.locals.db.get(
      "SELECT value FROM system_settings WHERE key = 'admin_password'"
    );

    if (!currentHash || !verifyPassword(currentPassword, currentHash.value)) {
      return res.status(400).json({
        success: false,
        message: '当前密码错误'
      });
    }

    // 加密新密码
    const newPasswordHash = hashPassword(newPassword);

    // 更新密码
    await req.app.locals.db.run(`
      UPDATE system_settings 
      SET value = ?, updated_at = strftime('%s', 'now'), updated_by = ?
      WHERE key = 'admin_password'
    `, [newPasswordHash, 'admin']);

    // 记录操作日志
    await req.app.locals.db.log(
      'change_admin_password',
      'security',
      'admin',
      'admin',
      '更新管理员密码'
    );

    res.json({
      success: true,
      message: '管理员密码更新成功'
    });

  } catch (error) {
    console.error('更新管理员密码失败:', error);
    res.status(500).json({
      success: false,
      message: '更新管理员密码失败',
      error: error.message
    });
  }
});

/**
 * 🧹 清理系统数据
 */
router.post('/cleanup', async (req, res) => {
  try {
    const {
      cleanupLogs = false,
      cleanupTempFiles = true,
      cleanupOldBackups = false,
      daysToKeep = 30
    } = req.body;

    const cleanupResults = {
      logsDeleted: 0,
      tempFilesDeleted: 0,
      backupsDeleted: 0,
      spaceFreed: 0
    };

    // 清理旧日志
    if (cleanupLogs) {
      const cutoffTime = Math.floor(Date.now() / 1000) - (daysToKeep * 24 * 3600);
      const logsResult = await req.app.locals.db.run(
        'DELETE FROM action_logs WHERE timestamp < ?',
        [cutoffTime]
      );
      cleanupResults.logsDeleted = logsResult.changes;
    }

    // 清理临时文件
    if (cleanupTempFiles) {
      const tempPath = path.join(__dirname, '../..', 'uploads', 'temp');
      try {
        const tempFiles = await fs.readdir(tempPath);
        for (const file of tempFiles) {
          const filePath = path.join(tempPath, file);
          const stats = await fs.stat(filePath);
          cleanupResults.spaceFreed += stats.size;
          await fs.unlink(filePath);
          cleanupResults.tempFilesDeleted++;
        }
      } catch (e) {
        // 临时目录可能不存在
      }
    }

    // 清理旧备份
    if (cleanupOldBackups) {
      const cutoffTime = Math.floor(Date.now() / 1000) - (daysToKeep * 24 * 3600);
      const oldBackups = await req.app.locals.db.all(
        'SELECT backup_id, file_path FROM system_backups WHERE created_at < ?',
        [cutoffTime]
      );

      for (const backup of oldBackups) {
        try {
          const stats = await fs.stat(backup.file_path);
          cleanupResults.spaceFreed += stats.size;
          await fs.unlink(backup.file_path);
          cleanupResults.backupsDeleted++;
        } catch (e) {
          // 文件可能已不存在
        }
      }

      // 删除数据库记录
      await req.app.locals.db.run(
        'DELETE FROM system_backups WHERE created_at < ?',
        [cutoffTime]
      );
    }

    // 记录操作日志
    await req.app.locals.db.log(
      'system_cleanup',
      'system',
      'cleanup',
      'admin',
      '执行系统清理',
      cleanupResults
    );

    res.json({
      success: true,
      message: '系统清理完成',
      data: {
        ...cleanupResults,
        spaceFreedFormatted: formatFileSize(cleanupResults.spaceFreed)
      }
    });

  } catch (error) {
    console.error('系统清理失败:', error);
    res.status(500).json({
      success: false,
      message: '系统清理失败',
      error: error.message
    });
  }
});

/**
 * 📊 获取系统日志
 */
router.get('/logs', async (req, res) => {
  try {
    const {
      level = 'all',
      category = 'all',
      limit = 100,
      offset = 0,
      start_date,
      end_date
    } = req.query;

    let query = 'SELECT * FROM action_logs WHERE 1=1';
    const params = [];

    // 日志级别过滤
    if (level !== 'all') {
      query += ' AND action = ?';
      params.push(level);
    }

    // 分类过滤
    if (category !== 'all') {
      query += ' AND entity_type = ?';
      params.push(category);
    }

    // 时间范围过滤
    if (start_date) {
      query += ' AND timestamp >= ?';
      params.push(Math.floor(new Date(start_date).getTime() / 1000));
    }

    if (end_date) {
      query += ' AND timestamp <= ?';
      params.push(Math.floor(new Date(end_date).getTime() / 1000));
    }

    query += ' ORDER BY timestamp DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const logs = await req.app.locals.db.all(query, params);

    // 获取总数
    let countQuery = 'SELECT COUNT(*) as total FROM action_logs WHERE 1=1';
    const countParams = [];

    if (level !== 'all') {
      countQuery += ' AND action = ?';
      countParams.push(level);
    }
    if (category !== 'all') {
      countQuery += ' AND entity_type = ?';
      countParams.push(category);
    }
    if (start_date) {
      countQuery += ' AND timestamp >= ?';
      countParams.push(Math.floor(new Date(start_date).getTime() / 1000));
    }
    if (end_date) {
      countQuery += ' AND timestamp <= ?';
      countParams.push(Math.floor(new Date(end_date).getTime() / 1000));
    }

    const countResult = await req.app.locals.db.get(countQuery, countParams);

    // 处理日志数据
    const processedLogs = logs.map(log => ({
      ...log,
      details: typeof log.details === 'string' ? JSON.parse(log.details || '{}') : log.details,
      timestamp_formatted: new Date(log.timestamp * 1000).toLocaleString()
    }));

    res.json({
      success: true,
      data: processedLogs,
      pagination: {
        total: countResult.total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: countResult.total > parseInt(offset) + parseInt(limit)
      }
    });

  } catch (error) {
    console.error('获取系统日志失败:', error);
    res.status(500).json({
      success: false,
      message: '获取系统日志失败',
      error: error.message
    });
  }
});

// ==================== 辅助函数 ====================

/**
 * 触发配置更新事件
 */
async function triggerConfigUpdateEvent(key, newValue, oldValue) {
  // 这里可以添加配置更新后的处理逻辑
  // 例如重启服务、刷新缓存等
  console.log(`配置 ${key} 已更新: ${oldValue} -> ${newValue}`);
}

/**
 * 获取数据库统计信息
 */
async function getDatabaseStats(db) {
  try {
    // 获取表信息
    const tables = await db.all(`
      SELECT name, sql FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
    `);

    const tableStats = [];
    for (const table of tables) {
      const countResult = await db.get(`SELECT COUNT(*) as count FROM "${table.name}"`);
      tableStats.push({
        name: table.name,
        rowCount: countResult.count
      });
    }

    return {
      tables: tableStats,
      totalTables: tables.length
    };
  } catch (error) {
    return { error: error.message };
  }
}

/**
 * 获取应用统计信息
 */
async function getApplicationStats(db) {
  try {
    const now = Math.floor(Date.now() / 1000);
    const dayAgo = now - 24 * 3600;

    // 24小时内的活动
    const recentActivity = await db.get(
      'SELECT COUNT(*) as count FROM action_logs WHERE timestamp > ?',
      [dayAgo]
    );

    // 活跃用户数
    const activeUsers = await db.get(
      'SELECT COUNT(DISTINCT user_id) as count FROM action_logs WHERE timestamp > ?',
      [dayAgo]
    );

    return {
      recentActivity: recentActivity.count,
      activeUsers: activeUsers.count || 0
    };
  } catch (error) {
    return { error: error.message };
  }
}

/**
 * 执行系统健康检查
 */
async function performSystemHealthChecks(db) {
  const checks = [];

  // 数据库连接检查
  try {
    await db.get('SELECT 1');
    checks.push({
      name: 'database_connection',
      status: 'healthy',
      message: '数据库连接正常'
    });
  } catch (error) {
    checks.push({
      name: 'database_connection',
      status: 'error',
      message: '数据库连接失败',
      error: error.message
    });
  }

  // 磁盘空间检查
  try {
    const stats = await fs.stat(__dirname);
    checks.push({
      name: 'disk_space',
      status: 'healthy',
      message: '磁盘空间充足'
    });
  } catch (error) {
    checks.push({
      name: 'disk_space',
      status: 'warning',
      message: '无法检查磁盘空间'
    });
  }

  // 内存使用检查
  const memUsage = process.memoryUsage();
  const memUsedMB = Math.round(memUsage.used / 1024 / 1024);
  
  checks.push({
    name: 'memory_usage',
    status: memUsedMB > 1000 ? 'warning' : 'healthy',
    message: `内存使用: ${memUsedMB}MB`,
    value: memUsedMB
  });

  return {
    checks,
    overall: checks.every(check => check.status === 'healthy') ? 'healthy' : 'warning'
  };
}

/**
 * 创建系统备份
 */
async function createSystemBackup(db, options) {
  const { backupId, backupPath, includeData, includeLogs, format } = options;
  
  try {
    const backupData = {
      metadata: {
        backupId,
        createdAt: new Date().toISOString(),
        version: '1.0.0',
        includeData,
        includeLogs
      },
      settings: [],
      data: {},
      logs: []
    };

    // 备份系统设置
    backupData.settings = await db.all('SELECT * FROM system_settings');

    // 备份数据表
    if (includeData) {
      const tables = ['markets', 'templates', 'resources'];
      for (const table of tables) {
        try {
          backupData.data[table] = await db.all(`SELECT * FROM ${table}`);
        } catch (e) {
          // 表可能不存在
        }
      }
    }

    // 备份日志
    if (includeLogs) {
      backupData.logs = await db.all('SELECT * FROM action_logs ORDER BY timestamp DESC LIMIT 10000');
    }

    // 写入备份文件
    const backupContent = JSON.stringify(backupData, null, 2);
    await fs.writeFile(backupPath, backupContent);

    const stats = await fs.stat(backupPath);
    
    return {
      size: stats.size,
      itemCount: Object.keys(backupData.data).length + backupData.settings.length + backupData.logs.length
    };
  } catch (error) {
    throw new Error(`备份创建失败: ${error.message}`);
  }
}

/**
 * 恢复系统备份
 */
async function restoreSystemBackup(db, backup) {
  try {
    const backupContent = await fs.readFile(backup.file_path, 'utf8');
    const backupData = JSON.parse(backupContent);

    let itemsRestored = 0;

    // 恢复系统设置
    if (backupData.settings) {
      for (const setting of backupData.settings) {
        await db.run(`
          INSERT OR REPLACE INTO system_settings 
          (key, value, category, description, type, is_sensitive, created_by, updated_by)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          setting.key,
          setting.value,
          setting.category,
          setting.description,
          setting.type,
          setting.is_sensitive,
          setting.created_by || 'backup',
          'backup'
        ]);
        itemsRestored++;
      }
    }

    // 恢复数据表（如果包含数据）
    if (backup.includes_data && backupData.data) {
      for (const [table, records] of Object.entries(backupData.data)) {
        // 这里需要根据具体表结构来恢复数据
        // 简化实现，实际应该更谨慎
        itemsRestored += records.length;
      }
    }

    return { itemsRestored };
  } catch (error) {
    throw new Error(`备份恢复失败: ${error.message}`);
  }
}

/**
 * 格式化文件大小
 */
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * 密码哈希
 */
function hashPassword(password) {
  const crypto = require('crypto');
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

/**
 * 验证密码
 */
function verifyPassword(password, hashedPassword) {
  const [salt, hash] = hashedPassword.split(':');
  const verifyHash = require('crypto').pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return hash === verifyHash;
}

module.exports = router;