const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const http = require('http');

const BOT_TOKEN = '8651381547:AAF2ZnYuSqOttJ1s0c7W9c8RS3S7F5vkpsA';
const API_URL = 'https://taskwav.site.je/api.php'; 
const MINI_APP_URL = 'https://taskwav.site.je/index.php';

const ADMIN_ID = '7689311203'; 
const REQUIRED_CHANNEL = '@AHTG_OFFICIAL';
const REQUIRED_GROUP = '@AHTG_OFFICIAL_GROUP'; // আপনার গ্রুপের ইউজারনেম দিন (বা ID)

const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('AHTG Bot Engine Active\n');
}).listen(PORT);

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// Check membership function
async function isUserMember(telegramId) {
    try {
        const chMember = await bot.getChatMember(REQUIRED_CHANNEL, telegramId);
        const isChJoined = ['creator', 'administrator', 'member'].includes(chMember.status);
        
        // Group check
        let isGrpJoined = true;
        if(REQUIRED_GROUP && REQUIRED_GROUP !== '') {
            const grpMember = await bot.getChatMember(REQUIRED_GROUP, telegramId);
            isGrpJoined = ['creator', 'administrator', 'member'].includes(grpMember.status);
        }

        return isChJoined && isGrpJoined;
    } catch (e) {
        return false;
    }
}

bot.onText(/\/start(?:\s+(.+))?/, async (msg, match) => {
    const chatId = msg.chat.id;
    const telegramId = msg.from.id.toString();
    const refBy = match[1] ? match[1].trim() : '';

    const joined = await isUserMember(telegramId);

    if (!joined) {
        return bot.sendMessage(chatId, `⚠️ **Access Restricted!**\n\nYou must join our Official Channel and Group to use this app.`, {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: "📢 Join Channel", url: `https://t.me/AHTG_OFFICIAL` }],
                    [{ text: "💬 Join Group", url: `https://t.me/AHTG_OFFICIAL_GROUP` }],
                    [{ text: "Verify ✅", callback_data: `verify_${refBy}` }]
                ]
            }
        });
    }

    // Register user to MySQL
    const params = new URLSearchParams();
    params.append('telegram_id', telegramId);
    params.append('first_name', msg.from.first_name || 'User');
    params.append('username', msg.from.username || '');
    params.append('referred_by', refBy);

    await axios.post(`${API_URL}?action=register`, params);

    bot.sendMessage(chatId, `🎉 **Welcome ${msg.from.first_name}!**\n\nYour account is active. Click below to open the app:`, {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [
                [{ text: "🚀 Open App", web_app: { url: `${MINI_APP_URL}?tg_id=${telegramId}` } }]
            ]
        }
    });
});

bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const telegramId = query.from.id.toString();
    const data = query.data;

    if (data.startsWith('verify_')) {
        const refBy = data.split('_')[1] || "";
        const joined = await isUserMember(telegramId);
        
        if (joined) {
            bot.answerCallbackQuery(query.id, { text: "Verification Successful!" });
            bot.sendMessage(chatId, "✅ Verification Successful! Send /start to launch the app.");
        } else {
            bot.answerCallbackQuery(query.id, { text: "You haven't joined both Channel & Group yet!", show_alert: true });
        }
    }
});
