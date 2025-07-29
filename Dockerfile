# 使用 Node.js 18 LTS
FROM node:18-alpine

# 安装构建工具
RUN apk add --no-cache python3 make g++ sqlite

# 设置工作目录
WORKDIR /app

# 复制 package 文件
COPY package*.json ./

# 安装生产依赖
RUN npm ci --only=production

# 复制应用代码
COPY . .

# 构建管理界面
WORKDIR /app/admin-ui
RUN npm ci && npm run build

# 返回主目录
WORKDIR /app

# 创建数据目录
RUN mkdir -p /data

# 暴露端口
EXPOSE 8080

# 启动应用
CMD ["node", "server.js"]