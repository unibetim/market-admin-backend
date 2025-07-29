#!/bin/bash
# Fly.io 密钥设置脚本
# 使用方法: ./fly-secrets.sh

echo "🔐 设置 Fly.io 密钥..."

# JWT 密钥 (请修改为你自己的强密码)
fly secrets set JWT_SECRET="your-super-secret-jwt-key-here"

# 管理员密码哈希 (默认密码: admin123)
fly secrets set ADMIN_PASSWORD_HASH='$2a$10$xuyDSvNHp4YLwLvi/Yuvce8o5tYqQlNeKATaDz58lqzh2WGsQv.KW'

# 如果有其他敏感信息，在这里添加
# fly secrets set ANOTHER_SECRET="value"

echo "✅ 密钥设置完成！"
echo ""
echo "查看所有密钥:"
echo "fly secrets list"