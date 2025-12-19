# Webhook 地址说明

部署完成后，你需要获取 Webhook 地址并配置到飞书应用中。

## Webhook 地址格式

Webhook 地址格式为：`https://your-domain/webhook`

## 各平台 Webhook 地址示例

### Railway
```
https://your-app-name.railway.app/webhook
```

### Render
```
https://your-app-name.onrender.com/webhook
```

### Fly.io
```
https://your-app-name.fly.dev/webhook
```

### 自定义域名
```
https://your-domain.com/webhook
```

## 如何获取你的 Webhook 地址

### Railway
1. 登录 Railway 控制台
2. 选择你的项目
3. 进入 "Settings" > "Domains"
4. 复制显示的域名
5. 添加 `/webhook` 后缀

### Render
1. 登录 Render 控制台
2. 选择你的服务
3. 在服务概览页面查看 "URL"
4. 添加 `/webhook` 后缀

### Fly.io
1. 运行 `fly status` 查看应用信息
2. 或访问 Fly.io 控制台查看域名
3. 添加 `/webhook` 后缀

## 配置到飞书

1. 登录 [飞书开放平台](https://open.feishu.cn/)
2. 进入你的应用
3. 进入 "事件订阅" 页面
4. 在 "请求地址 URL" 中填入完整的 Webhook 地址
5. 点击 "保存"
6. 飞书会自动验证地址，确保返回 `{"challenge": "xxx"}` 格式

## 测试 Webhook

### 方法一：使用 curl

```bash
curl -X POST https://your-domain.com/webhook \
  -H "Content-Type: application/json" \
  -d '{"type":"url_verification","challenge":"test123"}'
```

应该返回：
```json
{"challenge":"test123"}
```

### 方法二：访问健康检查

```bash
curl https://your-domain.com/health
```

应该返回：
```json
{
  "status": "ok",
  "restaurants_count": 45,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 常见问题

### Webhook 验证失败

1. 确保地址是 HTTPS（飞书要求）
2. 确保服务器正在运行
3. 检查服务器日志
4. 确认 `/webhook` 路径正确

### 无法接收消息

1. 检查事件订阅配置
2. 确认已添加 `im.message.receive_v1` 事件
3. 检查应用权限
4. 确认机器人已添加到群聊

