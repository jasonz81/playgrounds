# 部署指南

本文档详细说明如何将飞书机器人部署到各种平台。

## 部署前准备

1. **确保代码已推送到 GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/your-username/feishu-bot-what-to-eat.git
   git push -u origin main
   ```

2. **准备飞书应用信息**
   - App ID
   - App Secret
   - Encrypt Key (如果配置了加密)
   - Verification Token (如果配置了)

## 平台部署指南

### 1. Railway 部署（推荐，最简单）

**优点：** 免费额度充足，自动部署，配置简单

**步骤：**

1. 访问 https://railway.app/
2. 使用 GitHub 账号登录
3. 点击 "New Project"
4. 选择 "Deploy from GitHub repo"
5. 选择你的仓库
6. Railway 会自动检测并开始部署
7. 在项目设置中添加环境变量：
   ```
   FEISHU_APP_ID=your_app_id
   FEISHU_APP_SECRET=your_app_secret
   FEISHU_ENCRYPT_KEY=your_encrypt_key (可选)
   FEISHU_VERIFICATION_TOKEN=your_token (可选)
   PORT=3000
   ```
8. 等待部署完成
9. 在 "Settings" > "Domains" 中查看生成的域名
10. **Webhook 地址：** `https://your-app.railway.app/webhook`

### 2. Render 部署

**优点：** 免费，支持自动部署

**步骤：**

1. 访问 https://render.com/
2. 使用 GitHub 账号登录
3. 点击 "New" > "Web Service"
4. 连接你的 GitHub 仓库
5. 配置：
   - **Name:** feishu-bot-what-to-eat
   - **Environment:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free
6. 在 "Environment" 中添加环境变量
7. 点击 "Create Web Service"
8. 等待部署完成
9. **Webhook 地址：** `https://your-app.onrender.com/webhook`

**注意：** Render 免费版在无活动时会休眠，首次请求可能需要等待几秒。

### 3. Fly.io 部署

**优点：** 全球 CDN，性能好

**步骤：**

1. 安装 Fly CLI:
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. 登录 Fly.io:
   ```bash
   fly auth login
   ```

3. 在项目目录运行:
   ```bash
   fly launch
   ```
   按提示配置

4. 设置环境变量:
   ```bash
   fly secrets set FEISHU_APP_ID=your_app_id
   fly secrets set FEISHU_APP_SECRET=your_app_secret
   fly secrets set FEISHU_ENCRYPT_KEY=your_key  # 可选
   fly secrets set FEISHU_VERIFICATION_TOKEN=your_token  # 可选
   ```

5. 部署:
   ```bash
   fly deploy
   ```

6. **Webhook 地址：** `https://your-app.fly.dev/webhook`

### 4. Vercel 部署

**注意：** Vercel 主要面向静态网站和 Serverless 函数，对于需要持续运行的服务器应用，建议使用其他平台。

如果使用 Vercel，需要配置为 Serverless 函数。

### 5. 使用 Docker 部署到云服务器

**步骤：**

1. 在服务器上安装 Docker:
   ```bash
   curl -fsSL https://get.docker.com -o get-docker.sh
   sh get-docker.sh
   ```

2. 克隆项目:
   ```bash
   git clone https://github.com/your-username/feishu-bot-what-to-eat.git
   cd feishu-bot-what-to-eat
   ```

3. 构建镜像:
   ```bash
   docker build -t feishu-bot-what-to-eat .
   ```

4. 运行容器:
   ```bash
   docker run -d \
     --name feishu-bot \
     -p 3000:3000 \
     -e FEISHU_APP_ID=your_app_id \
     -e FEISHU_APP_SECRET=your_app_secret \
     -e FEISHU_ENCRYPT_KEY=your_key \
     -e FEISHU_VERIFICATION_TOKEN=your_token \
     --restart unless-stopped \
     feishu-bot-what-to-eat
   ```

5. 配置 Nginx 反向代理（可选）:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

6. **Webhook 地址：** `https://your-domain.com/webhook`

## 配置飞书应用

部署完成后，需要在飞书开放平台配置 Webhook 地址：

1. 登录 [飞书开放平台](https://open.feishu.cn/)
2. 进入你的应用
3. 进入 "事件订阅" 页面
4. 在 "请求地址" 中填入你的 Webhook 地址
5. 点击 "保存"
6. 飞书会发送验证请求，确保服务器正常运行

## 验证部署

1. 访问健康检查接口: `https://your-domain.com/health`
   应该返回：
   ```json
   {
     "status": "ok",
     "restaurants_count": 45,
     "timestamp": "2024-01-01T00:00:00.000Z"
   }
   ```

2. 在飞书群聊中 @ 机器人测试

## 常见问题

### 部署后无法访问

1. 检查服务器是否正常运行
2. 检查防火墙设置
3. 检查环境变量是否正确配置
4. 查看服务器日志

### 飞书无法验证 Webhook

1. 确保 Webhook 地址是 HTTPS（飞书要求）
2. 确保服务器可以接收 POST 请求
3. 检查日志查看飞书的验证请求

### 机器人不响应消息

1. 检查应用权限是否开启
2. 检查事件订阅是否正确配置
3. 检查服务器日志
4. 确认机器人已添加到群聊

## 监控和维护

建议使用以下工具监控服务：

- **Uptime Robot** - 监控服务可用性
- **Logtail** - 日志收集和分析
- **PM2** - 进程管理（如果使用传统服务器）

## 更新部署

代码更新后，不同平台的更新方式：

- **Railway/Render:** 自动从 GitHub 拉取更新
- **Fly.io:** `fly deploy`
- **Docker:** 重新构建和部署镜像

