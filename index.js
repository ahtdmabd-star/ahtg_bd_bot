const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const http = require('http');

// Configuration Credentials
const BOT_TOKEN = '8651381547:AAF2ZnYuSqOttJ1s0c7W9c8RS3S7F5vkpsA'; // প্রয়োজনে নতুন টোকেন দিন

// Live Web App & API Links
const API_URL = 'https://taskwav.site.je/api.php'; 
const MINI_APP_URL = 'https://taskwav.site.je/index.php';

const ADMIN_ID = '7689311203'; 
const REQUIRED_CHANNEL = '@AHTG_OFFICIAL';
const REQUIRED_GROUP_INVITE = 'https://t.me/+N026NocN90tlMTM1';

// Server for Port Scan/Health Check
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('AHTG Bot Active\n');
}).listen(PORT);

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// Error handle for polling
bot.on('polling_error', (error) => {
    console.log(`Polling error: ${error.code}`);
});

// /start Command
bot.onText(/\/start(?:\s+(.+))?/, async (msg, match) => {
    const chatId = msg.chat.id;
    const telegramId = msg.from.id.toString();
    const refBy = match[1] ? match[1].trim() : '';

    checkAndProcessUser(chatId, telegramId, msg.from, refBy);
});

// Check membership and Register
async function checkAndProcessUser(chatId, telegramId, userObj, refBy) {
    try {
        const channelMember = await bot.getChatMember(REQUIRED_CHANNEL, telegramId);
        const isSubscribed = ['creator', 'administrator', 'member'].includes(channelMember.status);

        if (!isSubscribed) {
            return bot.sendMessage(chatId, `⚠️ **Access Denied!**\n\nYou must join our Channel and Group to access the Mini App.`, {
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [
                        [{ text: "📢 Join Official Channel", url: `https://t.me/AHTG_OFFICIAL` }],
                        [{ text: "💬 Join Community Group", url: REQUIRED_GROUP_INVITE }],
                        [{ text: "Verify ✅", callback_data: `verify_${refBy}` }]
                    ]
                }
            });
        }

        // Register User to MySQL
        const params = new URLSearchParams();
        params.append('telegram_id', telegramId);
        params.append('first_name', userObj.first_name || 'User');
        params.append('username', userObj.username || '');
        params.append('referred_by', refBy);

        await axios.post(`${API_URL}?action=register`, params);

        let adminBtn = [];
        if (telegramId === ADMIN_ID) {
            adminBtn = [[{ text: "📢 Admin Broadcast Notice", callback_data: "admin_broadcast" }]];
        }

        bot.sendMessage(chatId, `🎉 **Welcome ${userObj.first_name}!**\n\nYour account is active. Click below to launch the Mini App:`, {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: "🚀 Open Mini App", web_app: { url: `${MINI_APP_URL}?tg_id=${telegramId}` } }],
                    ...adminBtn
                ]
            }
        });

    } catch (error) {
        console.error(error.message);
        bot.sendMessage(chatId, "⚠️ Make sure you have joined our Channel & Group properly, then try again.");
    }
}

// Callback Query Listener
bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const telegramId = query.from.id.toString();
    const data = query.data;

    if (data.startsWith('verify_')) {
        const refBy = data.split('_')[1] || "";
        bot.answerCallbackQuery(query.id, { text: "Checking verification..." });
        checkAndProcessUser(chatId, telegramId, query.from, refBy);
    }
});
