const express = require('express');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// 从环境变量或配置文件读取
const APP_ID = process.env.FEISHU_APP_ID || '';
const APP_SECRET = process.env.FEISHU_APP_SECRET || '';
const ENCRYPT_KEY = process.env.FEISHU_ENCRYPT_KEY || '';
const VERIFICATION_TOKEN = process.env.FEISHU_VERIFICATION_TOKEN || '';

// 加载餐厅列表
const restaurants = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'restaurants.json'), 'utf8')
);

// 存储tenant_access_token
let tenantAccessToken = '';
let tokenExpireTime = 0;

// 中间件
app.use(express.json());

// 验证飞书请求签名
function verifySignature(timestamp, nonce, body, signature) {
  if (!ENCRYPT_KEY) {
    return true; // 如果没有配置加密密钥，跳过验证
  }
  
  const stringToSign = `${timestamp}${nonce}${ENCRYPT_KEY}${body}`;
  const hash = crypto.createHmac('sha256', ENCRYPT_KEY).update(stringToSign).digest('base64');
  return hash === signature;
}

// 获取tenant_access_token
async function getTenantAccessToken() {
  // 如果token还有效，直接返回
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
      // token有效期通常是7200秒，提前5分钟刷新
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

// 处理URL验证（飞书机器人配置时需要）
app.post('/webhook', (req, res) => {
  try {
    const { type, challenge, token, encrypt } = req.body;

    // URL验证
    if (type === 'url_verification') {
      console.log('收到URL验证请求');
      if (token === VERIFICATION_TOKEN || !VERIFICATION_TOKEN) {
        res.json({ challenge });
      } else {
        console.error('验证token不匹配');
        res.status(403).json({ error: 'Invalid token' });
      }
      return;
    }

    // 验证签名
    const timestamp = req.headers['x-lark-request-timestamp'];
    const nonce = req.headers['x-lark-request-nonce'];
    const signature = req.headers['x-lark-signature'];
    const body = JSON.stringify(req.body);

    if (ENCRYPT_KEY && !verifySignature(timestamp, nonce, body, signature)) {
      console.error('签名验证失败');
      res.status(403).json({ error: 'Invalid signature' });
      return;
    }

    // 处理事件
    if (type === 'event_callback') {
      // 异步处理，不阻塞响应
      handleEvent(req.body).catch(err => {
        console.error('处理事件失败:', err);
      });
    }

    // 立即返回，避免超时
    res.json({ code: 0 });
  } catch (error) {
    console.error('处理webhook请求异常:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 处理事件
async function handleEvent(eventData) {
  try {
    const { event } = eventData;
    
    // 只处理消息事件
    if (event.type !== 'message') {
      return;
    }

    // 只处理文本消息
    if (event.message.message_type !== 'text') {
      return;
    }

    // 解析消息内容
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

    // 检查是否@了机器人
    const mentions = event.message.mentions || [];
    let isMentioned = false;
    
    // 检查mentions中是否包含机器人
    if (mentions.length > 0) {
      // mentions可能包含key（app_id）或name
      isMentioned = mentions.some(mention => {
        return mention.key === APP_ID || 
               mention.name === '今天吃什么' ||
               mention.id?.open_id === APP_ID;
      });
    }
    
    // 检查消息内容是否包含@机器人（备用方案）
    const isAtInText = messageText.includes('@今天吃什么') || 
                       messageText.includes('@机器人') ||
                       (mentions.length > 0 && !isMentioned); // 如果有mentions但没匹配到，可能是@了机器人

    // 如果@了机器人，或者消息中明确提到"吃什么"
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

// 健康检查接口
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    restaurants_count: restaurants.length,
    timestamp: new Date().toISOString()
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`飞书机器人服务器运行在端口 ${PORT}`);
  console.log(`Webhook地址: http://your-domain:${PORT}/webhook`);
  console.log(`餐厅数量: ${restaurants.length}`);
  
  if (!APP_ID || !APP_SECRET) {
    console.warn('⚠️  警告: 未配置 FEISHU_APP_ID 或 FEISHU_APP_SECRET');
    console.warn('请在环境变量中设置这些值，或创建 .env 文件');
  }
});

