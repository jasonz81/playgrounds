// 配置示例文件
// 复制此文件为 config.js 或使用环境变量

module.exports = {
  // 飞书应用ID
  APP_ID: process.env.FEISHU_APP_ID || 'your_app_id_here',
  
  // 飞书应用密钥
  APP_SECRET: process.env.FEISHU_APP_SECRET || 'your_app_secret_here',
  
  // 加密密钥（如果配置了加密）
  ENCRYPT_KEY: process.env.FEISHU_ENCRYPT_KEY || '',
  
  // 验证令牌（可选）
  VERIFICATION_TOKEN: process.env.FEISHU_VERIFICATION_TOKEN || '',
  
  // 服务器端口
  PORT: process.env.PORT || 3000
};

