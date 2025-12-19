# 解决"请求3秒超时"问题

## 问题原因

飞书在验证 Webhook 地址时，要求服务器在 **3秒内** 返回响应。如果超时，会报错"请求3秒超时"。

常见原因：
1. **Vercel Serverless 函数冷启动** - 第一次请求需要启动容器（可能需要几秒）
2. **代码中有阻塞操作** - 同步读取文件、复杂计算等
3. **网络延迟** - 服务器响应慢

## 已优化的内容

### 1. 优化验证请求处理

代码已优化，确保验证请求立即返回：
- 移除了不必要的日志输出
- 验证请求优先处理，立即返回
- 不进行任何异步操作

### 2. 解决方案

#### 方案一：预热函数（推荐）

在配置 Webhook 之前，先访问一次接口，让函数"预热"：

```bash
# 访问健康检查接口，预热函数
curl https://playgrounds-gamma.vercel.app/health

# 等待 2-3 秒后，再配置 Webhook
```

#### 方案二：使用 Vercel 的 Edge Functions（更快）

如果仍然超时，可以考虑使用 Edge Functions，但需要修改代码结构。

#### 方案三：多次尝试

1. 先访问健康检查接口预热：`https://playgrounds-gamma.vercel.app/health`
2. 等待 2-3 秒
3. 在飞书开放平台配置 Webhook 地址
4. 如果还是超时，等待 1 分钟后重试

## 详细步骤

### 步骤 1: 预热函数

在配置 Webhook 之前，先访问接口让函数启动：

```bash
# 访问健康检查
curl https://playgrounds-gamma.vercel.app/health

# 访问测试接口
curl https://playgrounds-gamma.vercel.app/test
```

等待 2-3 秒，让函数容器启动完成。

### 步骤 2: 配置 Webhook

1. 登录 [飞书开放平台](https://open.feishu.cn/)
2. 进入你的应用 > 事件订阅
3. 在"请求地址 URL"中填入：`https://playgrounds-gamma.vercel.app/webhook`
4. **立即点击"保存"**（不要等待）

### 步骤 3: 如果仍然超时

#### 方法 A: 使用 curl 测试响应速度

```bash
time curl -X POST https://playgrounds-gamma.vercel.app/webhook \
  -H "Content-Type: application/json" \
  -d '{"type":"url_verification","challenge":"test123"}'
```

查看响应时间，如果超过 2 秒，说明函数启动慢。

#### 方法 B: 检查 Vercel 函数配置

1. 进入 Vercel 控制台
2. 项目 > Settings > Functions
3. 确保函数配置正确
4. 检查是否有构建错误

#### 方法 C: 使用 Vercel Pro 计划

Vercel Pro 计划提供更快的冷启动和更好的性能。

## 验证是否成功

配置后，检查：

1. **飞书开放平台显示"验证成功"**
   - 在事件订阅页面，应该显示绿色的"验证成功"提示

2. **测试 Webhook**
   ```bash
   curl -X POST https://playgrounds-gamma.vercel.app/webhook \
     -H "Content-Type: application/json" \
     -d '{"type":"url_verification","challenge":"test123"}'
   ```
   应该立即返回：`{"challenge":"test123"}`

3. **查看 Vercel 日志**
   - 进入 Vercel 控制台
   - 查看函数日志，确认收到验证请求

## 预防措施

### 1. 保持函数活跃

定期访问接口，保持函数"热"状态：
- 可以设置定时任务（如 cron job）定期访问 `/health` 接口
- 或者使用 Uptime Robot 等监控服务

### 2. 使用 Vercel Cron Jobs

在 `vercel.json` 中添加：

```json
{
  "crons": [{
    "path": "/health",
    "schedule": "*/5 * * * *"
  }]
}
```

这会每 5 分钟访问一次健康检查接口，保持函数活跃。

### 3. 优化代码

- 减少启动时的初始化操作
- 使用懒加载
- 避免在模块加载时进行耗时操作

## 常见问题

### Q: 为什么第一次访问慢？

A: Vercel Serverless 函数使用容器技术，第一次请求需要启动容器（冷启动），可能需要 1-3 秒。后续请求会快很多（热启动，通常 < 100ms）。

### Q: 如何避免冷启动？

A: 
1. 定期访问接口保持函数活跃
2. 使用 Vercel Pro 计划（更快的冷启动）
3. 使用 Edge Functions（更快的启动速度）

### Q: 配置时总是超时怎么办？

A:
1. 先预热函数（访问 `/health` 接口）
2. 等待 2-3 秒
3. 立即配置 Webhook
4. 如果还是超时，等待 1 分钟后重试

### Q: 可以手动触发验证吗？

A: 可以，使用 curl 测试：
```bash
curl -X POST https://playgrounds-gamma.vercel.app/webhook \
  -H "Content-Type: application/json" \
  -d '{"type":"url_verification","challenge":"test123"}'
```

如果返回 `{"challenge":"test123"}`，说明接口正常，问题可能是飞书验证时的网络延迟。

## 成功标志

配置成功后：
- ✅ 飞书开放平台显示"验证成功"
- ✅ 事件订阅页面显示绿色的成功提示
- ✅ 可以正常接收群聊消息

## 需要帮助？

如果问题仍然存在：
1. 查看 Vercel 函数日志
2. 检查网络连接
3. 尝试使用其他部署平台（如 Railway、Render）

