# 如何使用机器人返回餐厅

## ✅ Webhook 验证成功

如果你看到返回 `{"challenge":"test123"}`，说明：
- ✅ 服务器部署成功
- ✅ Webhook 地址配置正确
- ✅ 飞书可以访问你的服务器

## 🎯 如何让机器人返回餐厅

### 方式一：在飞书群聊中使用（正常使用方式）

1. **确保机器人已添加到群聊**
   - 在飞书开放平台 > 机器人页面配置机器人信息
   - 在飞书群聊中添加机器人

2. **在群聊中 @ 机器人**
   - 发送消息：`@今天吃什么`
   - 或者：`@机器人 吃什么`
   - 或者：`@机器人 选一个餐厅`

3. **机器人会自动回复**
   ```
   🎲 今天去吃：**寿司沼津港漕河泾印象城店** 🍽️
   ```

### 方式二：测试接口（用于调试）

你可以直接访问测试接口查看随机餐厅：

```bash
curl https://playgrounds-gamma.vercel.app/test
```

或者访问：
```
https://playgrounds-gamma.vercel.app/test
```

会返回：
```json
{
  "status": "ok",
  "message": "这是一个测试接口，返回随机餐厅",
  "restaurant": "寿司沼津港漕河泾印象城店",
  "all_restaurants": [...],
  "total_count": 45
}
```

## 🔍 检查配置

### 1. 检查环境变量

确保在 Vercel 中配置了：
- `FEISHU_APP_ID` - 你的飞书应用 ID
- `FEISHU_APP_SECRET` - 你的飞书应用密钥

### 2. 检查飞书应用配置

1. **权限配置**
   - 进入飞书开放平台 > 权限管理
   - 确保已开通：
     - `im:message` - 获取与发送单聊、群组消息
     - `im:message:group_at_msg:readonly` - 接收群聊中@机器人消息事件

2. **事件订阅配置**
   - 进入飞书开放平台 > 事件订阅
   - 确保请求地址已配置：`https://playgrounds-gamma.vercel.app/webhook`
   - 确保已添加事件：`im.message.receive_v1`
   - 确保验证成功

3. **机器人配置**
   - 进入飞书开放平台 > 机器人
   - 配置机器人名称和描述
   - 在群聊中添加机器人

### 3. 查看日志

在 Vercel 控制台查看函数日志：
1. 进入项目 > Deployments
2. 选择最新部署
3. 点击 Functions > api/index.js
4. 查看 Logs

当你在群聊中 @ 机器人时，日志中应该显示：
```
收到请求: { method: 'POST', url: '/webhook', ... }
收到URL验证请求, challenge: ...
已回复消息到群 xxx: 餐厅名称
```

## 🐛 如果机器人不响应

### 检查清单

- [ ] 机器人已添加到群聊
- [ ] 事件订阅已配置并验证成功
- [ ] 权限已开通
- [ ] 环境变量已正确配置
- [ ] 服务器日志没有错误

### 常见问题

1. **机器人没有回复**
   - 检查是否真的 @ 了机器人（不是 @ 其他人）
   - 检查服务器日志，看是否收到消息事件
   - 检查 `chat_id` 是否正确获取

2. **收到消息但没有回复**
   - 检查 `APP_ID` 是否正确
   - 检查 mentions 匹配逻辑
   - 查看日志中的错误信息

3. **权限错误**
   - 检查权限是否已开通
   - 检查权限范围是否正确

## 📝 测试步骤

### 完整测试流程

1. **测试健康检查**
   ```bash
   curl https://playgrounds-gamma.vercel.app/health
   ```

2. **测试 Webhook 验证**
   ```bash
   curl -X POST https://playgrounds-gamma.vercel.app/webhook \
     -H "Content-Type: application/json" \
     -d '{"type":"url_verification","challenge":"test123"}'
   ```

3. **测试随机餐厅接口**
   ```bash
   curl https://playgrounds-gamma.vercel.app/test
   ```

4. **在飞书群聊中测试**
   - 在群聊中发送：`@今天吃什么`
   - 等待机器人回复

## 🎉 成功标志

当一切配置正确时：
- ✅ 访问 `/health` 返回正常
- ✅ 访问 `/test` 返回随机餐厅
- ✅ 在群聊中 @ 机器人会收到餐厅推荐

## 📚 相关文档

- [FEISHU_CONFIG.md](./FEISHU_CONFIG.md) - 飞书配置完整指南
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - 故障排查指南
- [README.md](./README.md) - 项目完整说明

