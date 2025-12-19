# 使用飞书官方 SDK

项目已改为使用飞书官方 SDK (`@larksuiteoapi/node-sdk`) 实现回调处理。

## 优势

使用官方 SDK 的好处：
- ✅ **自动处理验证请求** - SDK 自动处理 `url_verification` 请求
- ✅ **自动处理加密** - 如果配置了加密，SDK 会自动处理
- ✅ **类型安全** - 更好的类型定义和错误处理
- ✅ **官方维护** - 由飞书官方维护，更新及时
- ✅ **简化代码** - 减少手动处理验证和签名的代码

## 安装依赖

```bash
npm install
```

这会安装 `@larksuiteoapi/node-sdk` 依赖。

## 配置

环境变量配置保持不变：

- `FEISHU_APP_ID` - 飞书应用 ID
- `FEISHU_APP_SECRET` - 飞书应用密钥
- `FEISHU_ENCRYPT_KEY` - 加密密钥（可选）
- `FEISHU_VERIFICATION_TOKEN` - 验证令牌（可选）

## SDK 使用说明

### 1. 客户端初始化

```javascript
const client = new Client({
  appId: APP_ID,
  appSecret: APP_SECRET,
  appType: 'internal', // 企业自建应用
  encryptKey: ENCRYPT_KEY || undefined,
  verificationToken: VERIFICATION_TOKEN || undefined,
});
```

### 2. 事件分发器

```javascript
const dispatcher = new EventDispatcher({
  encryptKey: ENCRYPT_KEY || undefined,
  verificationToken: VERIFICATION_TOKEN || undefined,
});
```

### 3. 注册事件处理器

```javascript
dispatcher.register({
  'im.message.receive_v1': async (data) => {
    // 处理消息事件
  },
});
```

### 4. 处理 Webhook 请求

```javascript
await dispatcher.handle(req, res);
```

SDK 会自动：
- 处理 `url_verification` 验证请求
- 验证签名（如果配置了加密）
- 分发事件到对应的处理器

## 主要改动

### 之前（手动实现）
- 手动解析验证请求
- 手动验证签名
- 手动处理事件分发

### 现在（使用 SDK）
- SDK 自动处理验证请求
- SDK 自动验证签名
- SDK 自动分发事件

## 部署

部署步骤不变：

```bash
# 提交代码
git add .
git commit -m "Use Feishu official SDK"
git push

# 或使用 Vercel CLI
vercel --prod
```

## 验证

部署后，测试验证接口：

```bash
curl -X POST https://your-app.vercel.app/webhook \
  -H "Content-Type: application/json" \
  -d '{"type":"url_verification","challenge":"test123"}'
```

应该返回：`{"challenge":"test123"}`

## 故障排查

### SDK 处理失败

如果 SDK 处理失败，代码会回退到手动处理验证请求，确保验证不会失败。

### 查看日志

在 Vercel 控制台查看函数日志：
1. 项目 > Deployments > 最新部署
2. Functions > api/index.js > Logs

### 常见问题

1. **SDK 版本问题**
   - 确保使用最新版本：`@larksuiteoapi/node-sdk@^1.40.0`

2. **环境变量未配置**
   - 确保在 Vercel 中配置了所有必需的环境变量

3. **事件未触发**
   - 检查事件订阅配置
   - 检查权限是否开通
   - 检查机器人是否已添加到群聊

## 参考文档

- [飞书开放平台文档](https://open.feishu.cn/document/)
- [飞书 Node.js SDK](https://www.npmjs.com/package/@larksuiteoapi/node-sdk)

