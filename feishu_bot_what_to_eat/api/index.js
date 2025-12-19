// Vercel Serverless 函数版本
// 使用飞书官方 SDK 实现回调处理

const { Client, EventDispatcher } = require('@larksuiteoapi/node-sdk');
const fs = require('fs');
const path = require('path');

// 从环境变量读取配置
const APP_ID = process.env.FEISHU_APP_ID || '';
const APP_SECRET = process.env.FEISHU_APP_SECRET || '';
const ENCRYPT_KEY = process.env.FEISHU_ENCRYPT_KEY || '';
const VERIFICATION_TOKEN = process.env.FEISHU_VERIFICATION_TOKEN || '';

// 延迟加载餐厅列表（避免启动时读取文件造成延迟）
let restaurants = null;
function getRestaurants() {
  if (!restaurants) {
    restaurants = JSON.parse(
      fs.readFileSync(path.join(__dirname, '../restaurants.json'), 'utf8')
    );
  }
  return restaurants;
}

// 随机选择一个餐厅
function getRandomRestaurant() {
  const restList = getRestaurants();
  const randomIndex = Math.floor(Math.random() * restList.length);
  return restList[randomIndex];
}

// 初始化飞书客户端
const client = new Client({
  appId: APP_ID,
  appSecret: APP_SECRET,
  appType: 'internal', // 企业自建应用使用 'internal'
  encryptKey: ENCRYPT_KEY || undefined,
  verificationToken: VERIFICATION_TOKEN || undefined,
});

// 初始化事件分发器
const dispatcher = new EventDispatcher({
  encryptKey: ENCRYPT_KEY || undefined,
  verificationToken: VERIFICATION_TOKEN || undefined,
});

// 监听群聊消息事件
dispatcher.register({
  // 接收消息事件
  'im.message.receive_v1': async (data) => {
    try {
      const event = data.event;
      const message = event.message;

      // 只处理文本消息
      if (message.message_type !== 'text') {
        return;
      }

      // 解析消息内容
      let messageText = '';
      try {
        const content = typeof message.content === 'string' 
          ? JSON.parse(message.content) 
          : message.content;
        messageText = content?.text || '';
      } catch (e) {
        console.error('解析消息内容失败:', e);
        return;
      }

      // 检查是否@了机器人
      const mentions = message.mentions || [];
      let isMentioned = false;

      if (mentions.length > 0) {
        isMentioned = mentions.some(mention => {
          return mention.key === APP_ID || 
                 mention.name === '今天吃什么' ||
                 mention.id?.open_id === APP_ID;
        });
      }

      // 检查消息内容
      const isAtInText = messageText.includes('@今天吃什么') || 
                         messageText.includes('@机器人') ||
                         (mentions.length > 0 && !isMentioned);

      // 如果@了机器人，或者消息中包含"吃"、"选"等关键词
      if (isMentioned || (isAtInText && messageText.match(/吃|吃什么|选|选择/))) {
        const restaurant = getRandomRestaurant();
        const chatId = message.chat_id;

        if (!chatId) {
          console.error('无法获取chat_id');
          return;
        }

        const replyText = `🎲 今天去吃：**${restaurant}** 🍽️`;

        try {
          // 使用 SDK 发送消息
          const result = await client.im.message.create({
            params: {
              receive_id_type: 'chat_id',
            },
            data: {
              receive_id: chatId,
              msg_type: 'text',
              content: JSON.stringify({
                text: replyText,
              }),
            },
          });

          if (result.code === 0) {
            console.log(`已回复消息到群 ${chatId}: ${restaurant}`);
          } else {
            console.error('发送消息失败:', result);
          }
        } catch (error) {
          console.error('发送回复失败:', error);
        }
      }
    } catch (error) {
      console.error('处理消息事件异常:', error);
    }
  },
});

// Vercel Serverless 函数入口
module.exports = async (req, res) => {
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-lark-request-timestamp, x-lark-request-nonce, x-lark-signature');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 获取请求路径
  let pathname = '/';
  try {
    if (req.url) {
      pathname = req.url.split('?')[0];
    }
  } catch (e) {
    pathname = req.url || '/';
  }

  // 健康检查
  if (req.method === 'GET' && (pathname === '/health' || pathname === '/api/health' || pathname === '/api/index')) {
    const restList = getRestaurants();
    res.json({ 
      status: 'ok', 
      restaurants_count: restList.length,
      timestamp: new Date().toISOString(),
      path: pathname
    });
    return;
  }

  // 测试接口：直接返回随机餐厅
  if (req.method === 'GET' && (pathname === '/test' || pathname === '/api/test')) {
    const restList = getRestaurants();
    const restaurant = getRandomRestaurant();
    res.json({ 
      status: 'ok',
      message: '这是一个测试接口，返回随机餐厅',
      restaurant: restaurant,
      all_restaurants: restList,
      total_count: restList.length
    });
    return;
  }

  // 处理 POST 请求（Webhook）- 使用 SDK 处理
  if (req.method === 'POST' && (pathname === '/webhook' || pathname === '/api/index' || pathname === '/api/webhook')) {
    try {
      // 使用 SDK 的事件分发器处理请求
      // SDK 会自动处理验证请求和事件回调
      // 注意：在 Vercel Serverless 环境中，需要确保 req 和 res 对象兼容
      await dispatcher.handle(req, res);
    } catch (error) {
      console.error('处理webhook请求异常:', error);
      // 如果 SDK 处理失败，尝试手动处理验证请求
      try {
        let body = req.body;
        if (typeof body === 'string') {
          body = JSON.parse(body);
        }
        if (body && body.type === 'url_verification') {
          res.json({ challenge: body.challenge || '' });
          return;
        }
        res.status(500).json({ error: 'Internal server error', message: error.message });
      } catch (e) {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
    return;
  }

  // 如果路径不匹配，返回 404
  res.status(404).json({ 
    error: 'Not found',
    method: req.method,
    path: pathname,
    url: req.url
  });
};
