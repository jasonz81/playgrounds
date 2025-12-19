# 快速开始 - 5分钟部署

## 步骤 1: 推送到 GitHub

```bash
cd feishu_bot_what_to_eat
git init
git add .
git commit -m "Initial commit: Feishu bot what to eat"
git branch -M main
git remote add origin https://github.com/your-username/feishu-bot-what-to-eat.git
git push -u origin main
```

## 步骤 2: 部署到 Railway（推荐）

1. 访问 https://railway.app/
2. 使用 GitHub 登录
3. 点击 "New Project" > "Deploy from GitHub repo"
4. 选择你的仓库
5. 在项目设置中添加环境变量：
   - `FEISHU_APP_ID` = 你的 App ID
   - `FEISHU_APP_SECRET` = 你的 App Secret
6. 等待部署完成（约 2-3 分钟）
7. 在 Settings > Domains 查看域名

**你的 Webhook 地址：** `https://your-app.railway.app/webhook`

## 步骤 3: 配置飞书应用

1. 登录 https://open.feishu.cn/
2. 进入你的应用 > 事件订阅
3. 请求地址填入：`https://your-app.railway.app/webhook`
4. 添加事件：`im.message.receive_v1`
5. 保存

## 步骤 4: 测试

在飞书群聊中 @ 机器人，应该会收到随机餐厅推荐！

## 其他部署选项

- **Render**: 参考 [DEPLOY.md](./DEPLOY.md)
- **Fly.io**: 参考 [DEPLOY.md](./DEPLOY.md)
- **Docker**: 参考 [DEPLOY.md](./DEPLOY.md)

## 需要帮助？

查看详细文档：
- [README.md](./README.md) - 完整使用说明
- [DEPLOY.md](./DEPLOY.md) - 详细部署指南
- [WEBHOOK.md](./WEBHOOK.md) - Webhook 配置说明

