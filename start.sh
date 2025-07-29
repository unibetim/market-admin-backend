#!/bin/bash

echo "🚀 启动 OddsMarket 管理后端系统"
echo "================================="

# 检查Node.js版本
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装 Node.js 16+"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "❌ Node.js 版本过低，需要 16+，当前版本: $(node -v)"
    exit 1
fi

echo "✅ Node.js 版本: $(node -v)"

# 检查环境文件
if [ ! -f ".env" ]; then
    echo "📝 创建环境配置文件..."
    cp .env.example .env
    echo "⚠️  请编辑 .env 文件配置必要参数"
fi

# 安装后端依赖
echo "📦 安装后端依赖..."
if [ ! -d "node_modules" ]; then
    npm install
fi

# 安装前端依赖
echo "🎨 安装前端管理界面依赖..."
cd admin-ui
if [ ! -d "node_modules" ]; then
    npm install
fi

# 构建前端
echo "🔨 构建前端管理界面..."
npm run build

cd ..

# 创建必要目录
mkdir -p data
mkdir -p public/logos

# 启动服务
echo "🌟 启动服务..."
echo ""
echo "🌐 管理后台: http://localhost:3001/admin"
echo "🔗 API地址: http://localhost:3001/api"
echo "🔐 默认登录: admin / admin123"
echo ""
echo "按 Ctrl+C 停止服务"
echo "===================="

npm start