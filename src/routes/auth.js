const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const router = express.Router();

/**
 * 管理员登录
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log('🔐 登录尝试:', { username, passwordLength: password?.length });

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: '用户名和密码不能为空'
      });
    }

    // 验证管理员账户
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;
    const adminDefaultPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'admin123';

    if (username !== adminUsername) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }

    // 验证密码
    let isValidPassword = false;
    if (adminPasswordHash) {
      // 如果设置了密码哈希，使用bcrypt验证
      isValidPassword = await bcrypt.compare(password, adminPasswordHash);
    } else {
      // 否则使用明文密码比较
      isValidPassword = password === adminDefaultPassword;
      console.warn(`⚠️  使用明文密码验证，当前密码: ${adminDefaultPassword}`);
    }

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }

    // 生成JWT令牌
    const token = jwt.sign(
      { 
        username: adminUsername,
        role: 'admin',
        iat: Math.floor(Date.now() / 1000)
      },
      process.env.JWT_SECRET || 'oddsmarket_admin_secret',
      { 
        expiresIn: process.env.JWT_EXPIRES_IN || '24h'
      }
    );

    // 记录登录日志
    await req.app.locals.db.log(
      'admin_login',
      'auth',
      username,
      username,
      '管理员登录成功',
      { ip: req.ip, userAgent: req.get('User-Agent') }
    );

    res.json({
      success: true,
      message: '登录成功',
      data: {
        token,
        user: {
          username: adminUsername,
          role: 'admin'
        }
      }
    });

  } catch (error) {
    console.error('登录失败:', error);
    res.status(500).json({
      success: false,
      message: '登录失败',
      error: error.message
    });
  }
});

/**
 * 验证令牌
 */
router.get('/verify', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: '令牌有效',
    data: {
      user: req.user
    }
  });
});

/**
 * 登出 (主要用于记录日志)
 */
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    // 记录登出日志
    await req.app.locals.db.log(
      'admin_logout',
      'auth',
      req.user.username,
      req.user.username,
      '管理员登出',
      { ip: req.ip }
    );

    res.json({
      success: true,
      message: '登出成功'
    });

  } catch (error) {
    console.error('登出失败:', error);
    res.status(500).json({
      success: false,
      message: '登出失败',
      error: error.message
    });
  }
});

/**
 * 更改密码
 */
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: '当前密码和新密码不能为空'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: '新密码长度至少为6位'
      });
    }

    // 验证当前密码
    const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;
    let isCurrentPasswordValid = false;

    if (adminPasswordHash) {
      isCurrentPasswordValid = await bcrypt.compare(currentPassword, adminPasswordHash);
    } else {
      isCurrentPasswordValid = currentPassword === 'admin123';
    }

    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        success: false,
        message: '当前密码错误'
      });
    }

    // 生成新密码哈希
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    console.log('🔑 新密码哈希已生成，请更新环境变量 ADMIN_PASSWORD_HASH:');
    console.log(newPasswordHash);

    // 记录密码更改日志
    await req.app.locals.db.log(
      'change_password',
      'auth',
      req.user.username,
      req.user.username,
      '管理员更改密码',
      { ip: req.ip }
    );

    res.json({
      success: true,
      message: '密码更改成功，请使用新密码重新登录',
      data: {
        passwordHash: newPasswordHash,
        note: '请将此哈希值设置为环境变量 ADMIN_PASSWORD_HASH'
      }
    });

  } catch (error) {
    console.error('更改密码失败:', error);
    res.status(500).json({
      success: false,
      message: '更改密码失败',
      error: error.message
    });
  }
});

/**
 * JWT认证中间件
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: '缺少访问令牌'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'oddsmarket_admin_secret', (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: '令牌无效或已过期'
      });
    }

    req.user = user;
    next();
  });
}

/**
 * 生成密码哈希工具 (开发用)
 */
router.post('/generate-hash', async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: '密码不能为空'
      });
    }

    const hash = await bcrypt.hash(password, 10);

    res.json({
      success: true,
      message: '密码哈希生成成功',
      data: {
        password,
        hash,
        note: '请将此哈希值设置为环境变量 ADMIN_PASSWORD_HASH'
      }
    });

  } catch (error) {
    console.error('生成密码哈希失败:', error);
    res.status(500).json({
      success: false,
      message: '生成密码哈希失败',
      error: error.message
    });
  }
});

// 导出认证中间件供其他路由使用
router.authenticateToken = authenticateToken;

module.exports = router;