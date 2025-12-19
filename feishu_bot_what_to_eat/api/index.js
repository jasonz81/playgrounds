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

// 加载餐厅列表
const restaurants = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../restaurants.json'), 'utf8')
);

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
  const randomIndex = Math.floor(Math.random() * restaurants.length);
  return restaurants[randomIndex];
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
    console.error('解析路径失败:', e);
    pathname = req.url || '/';
  }
  
  // 调试日志（生产环境可以移除）
  console.log('收到请求:', {
    method: req.method,
    url: req.url,
    pathname: pathname,
    headers: Object.keys(req.headers)
  });

  // 健康检查 - 支持多种路径格式
  if (req.method === 'GET' && (pathname === '/health' || pathname === '/api/health' || pathname === '/api/index')) {
    res.json({ 
      status: 'ok', 
      restaurants_count: restaurants.length,
      timestamp: new Date().toISOString(),
      path: pathname
    });
    return;
  }

  // 处理 POST 请求（Webhook）
  // 支持 /webhook 和 /api/index 路径
  if (req.method === 'POST' && (pathname === '/webhook' || pathname === '/api/index' || pathname === '/api/webhook')) {
    try {
      // 确保请求体已解析
      let body = req.body;
      if (typeof body === 'string') {
        try {
          body = JSON.parse(body);
        } catch (e) {
          console.error('解析请求体失败:', e);
          res.status(400).json({ error: 'Invalid JSON' });
          return;
        }
      }

      const { type, challenge, token } = body || {};

      // URL验证
      if (type === 'url_verification') {
        console.log('收到URL验证请求, challenge:', challenge);
        if (!VERIFICATION_TOKEN || token === VERIFICATION_TOKEN) {
          res.json({ challenge });
        } else {
          console.error('验证token不匹配, expected:', VERIFICATION_TOKEN, 'got:', token);
          res.status(403).json({ error: 'Invalid token' });
        }
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

