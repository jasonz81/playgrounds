# PinMe 部署说明

## 重要提示

**PinMe 是一个专为静态网站设计的 IPFS 托管平台，不支持 Node.js 服务器应用。**

由于你的飞书机器人需要：
- 持续运行的服务器
- 处理 POST 请求的 Webhook
- 与飞书 API 交互

PinMe 无法满足这些需求。

## 推荐替代方案

### 方案一：Vercel（推荐，免费且简单）

Vercel 支持 Node.js Serverless 函数，非常适合部署飞书机器人。

#### 部署步骤：

1. **安装 Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **登录 Vercel**
   ```bash
   vercel login
   ```

3. **在项目目录部署**
   ```bash
   cd feishu_bot_what_to_eat
   vercel
   ```

4. **配置环境变量**
   ```bash
   vercel env add FEISHU_APP_ID
   vercel env add FEISHU_APP_SECRET
   vercel env add FEISHU_ENCRYPT_KEY  # 可选
   vercel env add FEISHU_VERIFICATION_TOKEN  # 可选
   ```

5. **部署到生产环境**
   ```bash
   vercel --prod
   ```

6. **获取 Webhook 地址**
   
   部署完成后，Vercel 会提供一个 URL，格式为：
   ```
   https://your-project.vercel.app/webhook
   ```

   或者通过 GitHub 集成：
   - 访问 https://vercel.com/
   - 使用 GitHub 登录
   - 点击 "New Project"
   - 导入你的 GitHub 仓库
   - 添加环境变量
   - 自动部署

### 方案二：Railway（最简单）

1. 访问 https://railway.app/
2. 使用 GitHub 登录
3. 点击 "New Project" > "Deploy from GitHub repo"
4. 选择你的仓库
5. 添加环境变量
6. 自动部署完成

**Webhook 地址：** `https://your-app.railway.app/webhook`

### 方案三：Render

1. 访问 https://render.com/
2. 使用 GitHub 登录
3. 点击 "New" > "Web Service"
4. 连接你的仓库
5. 配置环境变量
6. 部署

**Webhook 地址：** `https://your-app.onrender.com/webhook`

## 如果必须使用 PinMe

如果你确实需要使用 PinMe，可以考虑以下方案：

### 方案 A：使用 PinMe + 外部 API

1. 将前端部分部署到 PinMe
2. 使用其他平台（如 Railway、Render）部署后端 API
3. 前端通过 API 调用后端服务

但这会增加复杂性，不推荐。

### 方案 B：重构为静态网站

将机器人改为纯前端应用，但这样会失去服务器端功能，无法实现真正的机器人交互。

## 推荐选择

**强烈推荐使用 Vercel 或 Railway**，因为：
- ✅ 免费
- ✅ 支持 Node.js
- ✅ 自动 HTTPS
- ✅ 易于配置
- ✅ 支持 GitHub 自动部署
- ✅ 提供稳定的 Webhook 地址

## 快速部署命令（Vercel）

```bash
# 1. 安装 Vercel CLI
npm install -g vercel

# 2. 登录
vercel login

# 3. 部署
cd feishu_bot_what_to_eat
vercel

# 4. 添加环境变量（交互式）
vercel env add FEISHU_APP_ID production
vercel env add FEISHU_APP_SECRET production

# 5. 部署到生产
vercel --prod
```

部署完成后，你会得到一个类似这样的 URL：
```
https://feishu-bot-what-to-eat.vercel.app
```

**Webhook 地址：** `https://feishu-bot-what-to-eat.vercel.app/webhook`

## 需要帮助？

如果遇到问题，请查看：
- [README.md](./README.md) - 完整使用说明
- [DEPLOY.md](./DEPLOY.md) - 详细部署指南
- [QUICK_START.md](./QUICK_START.md) - 快速开始

