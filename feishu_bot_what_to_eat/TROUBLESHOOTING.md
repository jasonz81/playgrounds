# 故障排查指南

## 问题：部署后返回 `{"error":"Not found"}`

### 可能原因和解决方法

#### 1. 路径不匹配

**问题：** Vercel Serverless 函数的路径处理与 Express 不同。

**解决方法：**
- 确保访问的路径是 `/webhook` 而不是 `/api/webhook`
- 检查 `vercel.json` 中的路由配置是否正确

**测试：**
```bash
# 正确的路径
curl -X POST https://your-app.vercel.app/webhook \
  -H "Content-Type: application/json" \
  -d '{"type":"url_verification","challenge":"test123"}'

# 错误的路径（会返回 404）
curl -X POST https://your-app.vercel.app/api/webhook \
  -H "Content-Type: application/json" \
  -d '{"type":"url_verification","challenge":"test123"}'
```

#### 2. 请求方法不正确

**问题：** 飞书 Webhook 必须使用 POST 方法。

**检查：**
```bash
# 使用 GET 会返回 404
curl https://your-app.vercel.app/webhook

# 使用 POST 才正确
curl -X POST https://your-app.vercel.app/webhook \
  -H "Content-Type: application/json" \
  -d '{"type":"url_verification","challenge":"test123"}'
```

#### 3. 请求体格式问题

**问题：** 请求体必须是有效的 JSON。

**检查：**
```bash
# 确保 Content-Type 正确
curl -X POST https://your-app.vercel.app/webhook \
  -H "Content-Type: application/json" \
  -d '{"type":"url_verification","challenge":"test123"}'
```

#### 4. Vercel 函数未正确部署

**检查步骤：**
1. 访问 Vercel 控制台
2. 进入你的项目
3. 查看最新的部署
4. 检查是否有构建错误
5. 查看函数日志

**重新部署：**
```bash
vercel --prod
```

#### 5. 查看详细日志

在 Vercel 控制台查看函数日志：
1. 进入项目 > Deployments
2. 选择最新部署
3. 点击 "Functions" > "api/index.js"
4. 查看 "Logs" 标签

代码中已添加调试日志，会输出：
- 请求方法
- 请求 URL
- 请求路径
- 请求头

### 快速诊断步骤

1. **测试健康检查接口**
   ```bash
   curl https://your-app.vercel.app/health
   ```
   应该返回：
   ```json
   {
     "status": "ok",
     "restaurants_count": 45,
     "timestamp": "2024-01-01T00:00:00.000Z"
   }
   ```

2. **测试 Webhook 验证**
   ```bash
   curl -X POST https://your-app.vercel.app/webhook \
     -H "Content-Type: application/json" \
     -d '{"type":"url_verification","challenge":"test123"}'
   ```
   应该返回：
   ```json
   {"challenge":"test123"}
   ```

3. **检查 Vercel 路由配置**
   
   确保 `vercel.json` 中有：
   ```json
   {
     "routes": [
       {
         "src": "/webhook",
         "dest": "/api/index.js"
       }
     ]
   }
   ```

4. **检查文件结构**
   
   确保项目结构正确：
   ```
   feishu_bot_what_to_eat/
   ├── api/
   │   └── index.js    ← 必须存在
   ├── vercel.json     ← 必须存在
   └── restaurants.json
   ```

### 常见错误信息

#### `{"error":"Not found"}`

- 路径不正确
- 请求方法不正确（应该是 POST）
- 路由配置错误

#### `{"error":"Invalid JSON"}`

- 请求体格式错误
- Content-Type 不是 application/json

#### `{"error":"Invalid token"}`

- Verification Token 不匹配
- 环境变量未正确配置

#### `{"error":"Invalid signature"}`

- Encrypt Key 不匹配
- 签名验证失败

### 调试技巧

1. **添加更多日志**
   
   在 `api/index.js` 中添加：
   ```javascript
   console.log('请求详情:', {
     method: req.method,
     url: req.url,
     body: req.body,
     headers: req.headers
   });
   ```

2. **使用 Vercel CLI 本地测试**
   ```bash
   vercel dev
   ```
   然后在本地测试：
   ```bash
   curl -X POST http://localhost:3000/webhook \
     -H "Content-Type: application/json" \
     -d '{"type":"url_verification","challenge":"test123"}'
   ```

3. **检查环境变量**
   
   在 Vercel 控制台检查环境变量是否正确配置：
   - Settings > Environment Variables
   - 确保所有必需的环境变量都已设置

### 仍然无法解决？

1. 查看 Vercel 函数日志
2. 检查飞书开放平台的错误信息
3. 确认 Webhook 地址格式正确（必须是 HTTPS）
4. 确认服务器可以接收来自飞书的请求

### 联系支持

如果问题仍然存在，请提供：
- Vercel 部署日志
- 函数执行日志
- 测试请求的完整 curl 命令
- 错误信息截图

