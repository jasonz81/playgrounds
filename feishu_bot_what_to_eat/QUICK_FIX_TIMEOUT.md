# 快速解决飞书验证超时问题

## 问题

健康检查正常，但飞书开放平台配置事件订阅时提示"请求3秒超时"。

## 原因

飞书要求在 **1秒内** 返回验证响应，而不是3秒。如果超时，会报错。

## 已优化的代码

代码已优化，验证请求现在会：
1. **立即处理** - 在函数入口处优先处理
2. **立即返回** - 不进行任何验证、检查或异步操作
3. **最小化处理** - 只返回 challenge 值

## 解决步骤

### 步骤 1: 确保代码已更新

确保 `api/index.js` 中的验证请求处理在最前面，立即返回。

### 步骤 2: 重新部署

```bash
# 提交代码
git add .
git commit -m "Optimize webhook verification for fast response"
git push

# 或者使用 Vercel CLI
vercel --prod
```

### 步骤 3: 预热函数

在配置 Webhook 之前，先访问接口：

```bash
# 访问健康检查，预热函数
curl https://playgrounds-gamma.vercel.app/health

# 立即测试验证接口
curl -X POST https://playgrounds-gamma.vercel.app/webhook \
  -H "Content-Type: application/json" \
  -d '{"type":"url_verification","challenge":"test123"}'
```

应该立即返回：`{"challenge":"test123"}`

### 步骤 4: 立即配置 Webhook

1. **不要等待**，立即打开飞书开放平台
2. 进入应用 > 事件订阅
3. 填入地址：`https://playgrounds-gamma.vercel.app/webhook`
4. **立即点击"保存"**（在函数还"热"的时候）

### 步骤 5: 如果仍然超时

#### 方法 A: 使用 curl 模拟飞书验证

```bash
# 测试响应时间
time curl -X POST https://playgrounds-gamma.vercel.app/webhook \
  -H "Content-Type: application/json" \
  -d '{"type":"url_verification","challenge":"test123","token":"test"}'
```

如果响应时间 < 1 秒，说明接口正常。

#### 方法 B: 检查 Vercel 函数日志

1. 进入 Vercel 控制台
2. 项目 > Deployments > 最新部署
3. Functions > api/index.js > Logs
4. 查看是否有错误或延迟

#### 方法 C: 尝试多次

1. 先访问 `/health` 预热
2. 等待 1-2 秒
3. 立即配置 Webhook
4. 如果超时，等待 30 秒后重试

## 验证请求格式

飞书发送的验证请求格式：

```json
{
  "type": "url_verification",
  "challenge": "随机字符串",
  "token": "验证令牌（如果配置了）"
}
```

服务器必须返回：

```json
{
  "challenge": "相同的随机字符串"
}
```

## 测试命令

### 完整测试流程

```bash
# 1. 预热函数
curl https://playgrounds-gamma.vercel.app/health

# 2. 等待 2 秒

# 3. 测试验证接口（模拟飞书请求）
curl -X POST https://playgrounds-gamma.vercel.app/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "type": "url_verification",
    "challenge": "test_challenge_12345",
    "token": "test_token"
  }'

# 应该立即返回：
# {"challenge":"test_challenge_12345"}
```

## 常见问题

### Q: 为什么健康检查正常，但验证超时？

A: 
- 健康检查是 GET 请求，验证是 POST 请求
- 可能路径匹配有问题
- 可能请求体解析有延迟

### Q: 如何确认验证请求被正确接收？

A: 查看 Vercel 函数日志，应该能看到请求记录。

### Q: 可以跳过 token 验证吗？

A: 可以，代码已优化为立即返回 challenge，不进行 token 验证（如果未配置 VERIFICATION_TOKEN）。

## 成功标志

配置成功后：
- ✅ 飞书开放平台显示"验证成功"（绿色提示）
- ✅ 事件订阅页面显示请求地址已验证
- ✅ 可以添加事件订阅

## 如果问题仍然存在

1. **检查网络** - 确保 Vercel 函数可以快速响应
2. **检查路径** - 确保 Webhook 地址正确：`/webhook`
3. **查看日志** - 检查 Vercel 函数日志是否有错误
4. **尝试其他平台** - 如果 Vercel 持续超时，考虑使用 Railway 或 Render

## 联系支持

如果问题仍然存在，请提供：
- Vercel 函数日志
- curl 测试结果
- 飞书错误信息截图

