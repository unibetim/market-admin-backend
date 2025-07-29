const jwt = require('jsonwebtoken');

// JWT认证中间件
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      message: '访问令牌缺失，请先登录',
      code: 'AUTH_TOKEN_MISSING'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: '令牌无效或已过期',
        code: 'AUTH_TOKEN_INVALID'
      });
    }
    
    req.user = user;
    next();
  });
};

// 可选认证中间件 - 有token就验证，没有token就跳过
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.user = null;
    return next();
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      req.user = null;
    } else {
      req.user = user;
    }
    next();
  });
};

// 管理员权限验证
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: '需要登录访问',
      code: 'AUTH_REQUIRED'
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: '需要管理员权限',
      code: 'AUTH_ADMIN_REQUIRED'
    });
  }

  next();
};

// 生成JWT令牌
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user.id, 
      username: user.username, 
      role: user.role || 'user' 
    },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '24h' }
  );
};

// 验证令牌（不通过中间件，直接验证）
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
  } catch (error) {
    return null;
  }
};

module.exports = {
  authenticateToken,
  optionalAuth,
  requireAdmin,
  generateToken,
  verifyToken
};