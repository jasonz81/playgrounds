# Vercel 部署指南（推荐替代 PinMe）

由于 PinMe 不支持 Node.js 服务器应用，推荐使用 Vercel 部署，它提供免费的 Serverless 函数支持。

## 快速部署（5分钟）

### 方式一：使用 Vercel CLI

1. **安装 Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **登录 Vercel**
   ```bash
   vercel login
   ```

3. **进入项目目录并部署**
   ```bash
   cd feishu_bot_what_to_eat
   vercel
   ```
   
   首次部署会询问配置，直接回车使用默认值即可。

4. **添加环境变量**
   ```bash
   vercel env add FEISHU_APP_ID production
   # 输入你的 App ID
   
   vercel env add FEISHU_APP_SECRET production
   # 输入你的 App Secret
   
   vercel env add FEISHU_ENCRYPT_KEY production
   # 输入你的 Encrypt Key（可选，直接回车跳过）
   
   vercel env add FEISHU_VERIFICATION_TOKEN production
   # 输入你的 Verification Token（可选，直接回车跳过）
   ```

5. **部署到生产环境**
   ```bash
   vercel --prod
   ```

6. **获取 Webhook 地址**
   
   部署完成后，Vercel 会显示你的项目 URL，例如：
   ```
   https://feishu-bot-what-to-eat.vercel.app
   ```
   
   **你的 Webhook 地址：** `https://feishu-bot-what-to-eat.vercel.app/webhook`

### 方式二：使用 GitHub 集成（推荐）

1. **确保代码已推送到 GitHub**
   ```bash
   git add .
   git commit -m "Add Vercel deployment config"
   git push
   ```

2. **访问 Vercel 网站**
   - 访问 https://vercel.com/
   - 使用 GitHub 账号登录

3. **导入项目**
   - 点击 "Add New..." > "Project"
   - 选择你的 GitHub 仓库 `feishu-bot-what-to-eat`
   - 点击 "Import"

4. **配置项目**
   - Framework Preset: 选择 "Other" 或自动检测
   - Root Directory: `./` (默认)
   - Build Command: 留空（不需要构建）
   - Output Directory: 留空
   - Install Command: `npm install`

5. **添加环境变量**
   在 "Environment Variables" 部分添加：
   - `FEISHU_APP_ID` = 你的 App ID
   - `FEISHU_APP_SECRET` = 你的 App Secret
   - `FEISHU_ENCRYPT_KEY` = 你的 Encrypt Key（可选）
   - `FEISHU_VERIFICATION_TOKEN` = 你的 Verification Token（可选）

6. **部署**
   - 点击 "Deploy"
   - 等待部署完成（约 1-2 分钟）

7. **获取 Webhook 地址**
   
   部署完成后，在项目页面可以看到你的域名：
   ```
   https://feishu-bot-what-to-eat.vercel.app
   ```
   
   **你的 Webhook 地址：** `https://feishu-bot-what-to-eat.vercel.app/webhook`

## 配置飞书应用

1. 登录 [飞书开放平台](https://open.feishu.cn/)
2. 进入你的应用 > 事件订阅
3. 在"请求地址 URL"中填入你的 Webhook 地址：
   ```
   https://your-project.vercel.app/webhook
   ```
4. 添加事件：`im.message.receive_v1`
5. 点击"保存"
6. 飞书会自动验证地址

## 验证部署

### 1. 健康检查
访问：`https://your-project.vercel.app/health`

应该返回：
```json
{
  "status": "ok",
  "restaurants_count": 45,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 2. 测试 Webhook
```bash
curl -X POST https://your-project.vercel.app/webhook \
  -H "Content-Type: application/json" \
  -d '{"type":"url_verification","challenge":"test123"}'
```

应该返回：
```json
{"challenge":"test123"}
```

### 3. 在飞书群聊中测试
在群聊中 @ 机器人，应该会收到随机餐厅推荐。

## 自动部署

使用 GitHub 集成后，每次推送代码到 main 分支，Vercel 会自动重新部署。

## 查看日志

1. 访问 Vercel 控制台
2. 选择你的项目
3. 点击 "Deployments"
4. 选择最新的部署
5. 点击 "Functions" > "api/index.js" 查看日志

## 自定义域名（可选）

1. 在 Vercel 项目设置中
2. 进入 "Domains"
3. 添加你的自定义域名
4. 按照提示配置 DNS

## 优势

✅ **免费** - 个人项目完全免费  
✅ **自动 HTTPS** - 自动配置 SSL 证书  
✅ **全球 CDN** - 快速响应  
✅ **自动部署** - GitHub 集成，推送即部署  
✅ **Serverless** - 按需运行，节省资源  
✅ **稳定可靠** - Vercel 是业界领先的平台  

## 常见问题

### 部署失败

1. 检查环境变量是否正确配置
2. 查看 Vercel 部署日志
3. 确保 `api/index.js` 文件存在

### Webhook 验证失败

1. 确保 Webhook 地址是 HTTPS
2. 检查环境变量 `FEISHU_VERIFICATION_TOKEN` 是否正确
3. 查看 Vercel 函数日志

### 机器人不响应

1. 检查应用权限是否开启
2. 检查事件订阅配置
3. 查看 Vercel 函数日志

## 需要帮助？

- 查看 [README.md](./README.md) 了解完整功能
- 查看 [DEPLOY.md](./DEPLOY.md) 了解其他部署方式
- 查看 [WEBHOOK.md](./WEBHOOK.md) 了解 Webhook 配置

