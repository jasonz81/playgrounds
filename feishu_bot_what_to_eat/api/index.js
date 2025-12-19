// Vercel Serverless 函数版本
// 这个文件用于 Vercel 部署

const crypto = require('crypto');
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

// 存储tenant_access_token（在 Serverless 环境中使用全局变量）
let tenantAccessToken = '';
let tokenExpireTime = 0;

// 验证飞书请求签名
function verifySignature(timestamp, nonce, body, signature) {
  if (!ENCRYPT_KEY) {
    return true;
  }
  const stringToSign = `${timestamp}${nonce}${ENCRYPT_KEY}${body}`;
  const hash = crypto.createHmac('sha256', ENCRYPT_KEY).update(stringToSign).digest('base64');
  return hash === signature;
}

// 获取tenant_access_token
async function getTenantAccessToken() {
  if (tenantAccessToken && Date.now() < tokenExpireTime) {
    return tenantAccessToken;
  }

  try {
    const response = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        app_id: APP_ID,
        app_secret: APP_SECRET,
      }),
    });

    const data = await response.json();
    if (data.code === 0) {
      tenantAccessToken = data.tenant_access_token;
      tokenExpireTime = Date.now() + (data.expire - 300) * 1000;
      return tenantAccessToken;
    } else {
      console.error('获取token失败:', data);
      throw new Error('获取token失败');
    }
  } catch (error) {
    console.error('获取token异常:', error);
    throw error;
  }
}

// 发送消息到群聊
async function sendMessage(chatId, text) {
  try {
    const token = await getTenantAccessToken();
    
    const response = await fetch(`https://open.feishu.cn/open-apis/im/v1/messages?receive_id_type=chat_id`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        receive_id: chatId,
        msg_type: 'text',
        content: JSON.stringify({
          text: text,
        }),
      }),
    });

    const data = await response.json();
    if (data.code !== 0) {
      console.error('发送消息失败:', data);
    }
    return data;
  } catch (error) {
    console.error('发送消息异常:', error);
    throw error;
  }
}

// 随机选择一个餐厅
function getRandomRestaurant() {
  const restList = getRestaurants();
  const randomIndex = Math.floor(Math.random() * restList.length);
  return restList[randomIndex];
}

// 处理事件
async function handleEvent(eventData) {
  try {
    const { event } = eventData;
    
    if (event.type !== 'message') {
      return;
    }

    if (event.message.message_type !== 'text') {
      return;
    }

    let messageText = '';
    try {
      const content = typeof event.message.content === 'string' 
        ? JSON.parse(event.message.content) 
        : event.message.content;
      messageText = content?.text || '';
    } catch (e) {
      console.error('解析消息内容失败:', e);
      return;
    }

    const mentions = event.message.mentions || [];
    let isMentioned = false;
    
    if (mentions.length > 0) {
      isMentioned = mentions.some(mention => {
        return mention.key === APP_ID || 
               mention.name === '今天吃什么' ||
               mention.id?.open_id === APP_ID;
      });
    }
    
    const isAtInText = messageText.includes('@今天吃什么') || 
                       messageText.includes('@机器人') ||
                       (mentions.length > 0 && !isMentioned);

    if (isMentioned || (isAtInText && messageText.match(/吃|吃什么|选|选择/))) {
      const restaurant = getRandomRestaurant();
      const chatId = event.message.chat_id;
      
      if (!chatId) {
        console.error('无法获取chat_id');
        return;
      }
      
      const replyText = `🎲 今天去吃：**${restaurant}** 🍽️`;
      
      try {
        await sendMessage(chatId, replyText);
        console.log(`已回复消息到群 ${chatId}: ${restaurant}`);
      } catch (error) {
        console.error('发送回复失败:', error);
      }
    }
  } catch (error) {
    console.error('处理事件异常:', error);
  }
}

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

  // 获取请求路径（Vercel 中 req.url 可能包含查询参数，需要解析）
  let pathname = '/';
  try {
    if (req.url) {
      // 移除查询参数
      pathname = req.url.split('?')[0];
    }
  } catch (e) {
    pathname = req.url || '/';
  }

  // 优先处理 POST 请求中的验证请求（必须在最前面，立即返回）
  if (req.method === 'POST' && (pathname === '/webhook' || pathname === '/api/index' || pathname === '/api/webhook')) {
    // 快速解析请求体（不等待异步操作）
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        res.status(400).json({ error: 'Invalid JSON' });
        return;
      }
    }

    // 如果是验证请求，立即返回（不进行任何其他操作）
    if (body && body.type === 'url_verification') {
      const { challenge, token } = body;
      // 立即返回，不进行任何验证或检查
      res.json({ challenge: challenge || '' });
      return;
    }
  }

  // 健康检查 - 支持多种路径格式
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

  // 测试接口：直接返回随机餐厅（用于测试）
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

  // 处理 POST 请求（Webhook）- 验证请求已在上面处理
  // 支持 /webhook 和 /api/index 路径
  if (req.method === 'POST' && (pathname === '/webhook' || pathname === '/api/index' || pathname === '/api/webhook')) {
    try {
      // 确保请求体已解析（验证请求已在上面处理，这里只处理其他类型）
      let body = req.body;
      if (typeof body === 'string') {
        try {
          body = JSON.parse(body);
        } catch (e) {
          res.status(400).json({ error: 'Invalid JSON' });
          return;
        }
      }

      const { type } = body || {};

      // 如果还是验证请求（理论上不会到这里，但保险起见）
      if (type === 'url_verification') {
        res.json({ challenge: body.challenge || '' });
        return;
      }

      // 验证签名
      const timestamp = req.headers['x-lark-request-timestamp'];
      const nonce = req.headers['x-lark-request-nonce'];
      const signature = req.headers['x-lark-signature'];
      const bodyString = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);

      if (ENCRYPT_KEY && !verifySignature(timestamp, nonce, bodyString, signature)) {
        console.error('签名验证失败');
        res.status(403).json({ error: 'Invalid signature' });
        return;
      }

      // 处理事件
      if (type === 'event_callback') {
        await handleEvent(req.body);
      }

      res.json({ code: 0 });
    } catch (error) {
      console.error('处理webhook请求异常:', error);
      res.status(500).json({ error: 'Internal server error', message: error.message });
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

