require('dotenv').config();
const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const https = require('https');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 10000;
const BOT_TOKEN = process.env.BOT_TOKEN || '8651381547:AAET-bOtXeJEZR5S-s4zVSConRPZ_hhystI';
const PHP_API_URL = 'https://alhudatechglobal.shop/bot_api.php';
const SECRET_KEY = 'my_telegram_bot_secret_key_123';
const ADMIN_ID = 7689311203;

if (!BOT_TOKEN) {
    console.error("❌ Error: BOT_TOKEN is missing!");
    process.exit(1);
}

// SSL Certificate Bypass (InfinityFree SSL issue resolve করার জন্য)
const axiosInstance = axios.create({
    httpsAgent: new https.Agent({  
        rejectUnauthorized: false
    })
});

// Create Telegram Bot Instance
const bot = new TelegramBot(BOT_TOKEN, { polling: false });

// 409 Conflict এড়াতে পুরানো Webhook মুছে Polling স্টার্ট করা
bot.deleteWebHook().then(() => {
    console.log('✅ Old Webhook Cleared!');
    bot.startPolling();
}).catch(err => {
    console.error('Webhook Clear Error:', err.message);
    bot.startPolling();
});

// Render Server Keep-Alive
app.get('/', (req, res) => {
    res.send('AHTG Bot Server Live and Running!');
});

app.listen(PORT, () => {
    console.log(`Server successfully started on port ${PORT}`);
});

// ==========================================
// 🚀 ১. /start কমান্ড
// ==========================================
bot.onText(/\/start(?:\s+(.+))?/, async (msg, match) => {
    const chatId = msg.chat.id;
    const telegramId = msg.from.id;
    const firstName = msg.from.first_name || 'User';
    const username = msg.from.username || '';
    const startPayload = match ? match[1].trim() : '';

    try {
        // Axios Instance দিয়ে SSL bypass করে PHP API-তে ডাটা পাঠানো
        const response = await axiosInstance.post(PHP_API_URL, {
            secret_key: SECRET_KEY,
            action: 'sync_user',
            telegram_id: telegramId,
            first_name: firstName,
            username: username,
            referral_code: startPayload // রেফারকারী ইউজারের আইডি/কোড
        });

        const me = await bot.getMe();
        
        // রেফারেল লিংক ফিক্স: API থেকে রেফ কোড না এলে ইউজারের নিজের Telegram ID ব্যবহার হবে
        const userRefCode = (response.data && response.data.referral_code && response.data.referral_code !== 'N/A') 
                            ? response.data.referral_code 
                            : telegramId;
                            
        const botRefLink = `https://t.me/${me.username}?start=${userRefCode}`;
        const webAppUrl = `https://alhudatechglobal.shop/auto_login.php?telegram_id=${telegramId}`;
        const adminWebAppUrl = `https://alhudatechglobal.shop/admin/index.php?telegram_id=${telegramId}`;

        const welcomeText = 
            `✨ *স্বাগতম, ${firstName}!* ✨\n\n` +
            `🏆 *AL-HUDA TASK GLOBAL*-এ আপনাকে অভিনন্দন।\n` +
            `সোশাল মিডিয়া টাস্ক সম্পন্ন করে সরাসরি আয় করুন।\n\n` +
            `🔗 *আপনার রেফারেল লিংক:*\n\`${botRefLink}\`\n\n` +
            `👇 *ওয়েবসাইটে কাজ শুরু করতে নিচের বাটনটি চাপুন:*`;

        const keyboard = [
            [{ text: '🚀 Open Task Web App', web_app: { url: webAppUrl } }],
            [
                { text: '📢 Channel', url: 'https://t.me/AHTG_OFFICIAL' },
                { text: '💬 Group', url: 'https://t.me/+N026NocN90tlMTM1' }
            ]
        ];

        // এডমিন বাটনে ক্লিক করলে সরাসরি এডমিন প্যানেল Web App ওপেন হবে
        if (telegramId === ADMIN_ID) {
            keyboard.push([{ text: '📊 Admin Stats', web_app: { url: adminWebAppUrl } }]);
        }

        await bot.sendMessage(chatId, welcomeText, {
            parse_mode: 'Markdown',
            reply_markup: { inline_keyboard: keyboard }
        });

    } catch (error) {
        console.error('Start Command Error:', error.message);
        
        // API ডাউন থাকলেও যেন ইউজার সঠিক রেফারেল লিংক পায়
        const me = await bot.getMe();
        const fallbackRefLink = `https://t.me/${me.username}?start=${telegramId}`;
        const webAppUrl = `https://alhudatechglobal.shop/auto_login.php?telegram_id=${telegramId}`;

        const welcomeTextFallback = 
            `✨ *স্বাগতম, ${firstName}!* ✨\n\n` +
            `🏆 *AL-HUDA TASK GLOBAL*-এ আপনাকে অভিনন্দন।\n` +
            `সোশাল মিডিয়া টাস্ক সম্পন্ন করে সরাসরি আয় করুন।\n\n` +
            `🔗 *আপনার রেফারেল লিংক:*\n\`${fallbackRefLink}\`\n\n` +
            `👇 *ওয়েবসাইটে কাজ শুরু করতে নিচের বাটনটি চাপুন:*`;

        const keyboard = [
            [{ text: '🚀 Open Task Web App', web_app: { url: webAppUrl } }],
            [
                { text: '📢 Channel', url: 'https://t.me/AHTG_OFFICIAL' },
                { text: '💬 Group', url: 'https://t.me/+N026NocN90tlMTM1' }
            ]
        ];

        if (telegramId === ADMIN_ID) {
            keyboard.push([{ text: '📊 Admin Stats', web_app: { url: `https://alhudatechglobal.shop/admin/index.php?telegram_id=${telegramId}` } }]);
        }

        await bot.sendMessage(chatId, welcomeTextFallback, {
            parse_mode: 'Markdown',
            reply_markup: { inline_keyboard: keyboard }
        });
    }
});

// ==========================================
// 📊 ২. এডমিন স্ট্যাটস (Callback Query support)
// ==========================================
bot.on('callback_query', async (query) => {
    if (query.data === 'admin_stats' && query.from.id === ADMIN_ID) {
        try {
            const res = await axiosInstance.post(PHP_API_URL, {
                secret_key: SECRET_KEY,
                action: 'get_stats'
            });

            if (res.data.status === 'success') {
                const stats = res.data.data;
                const statsMsg = 
                    `📊 *AL-HUDA TASK Bot Statistics*\n\n` +
                    `👤 *মোট ইউজার (Total):* ${stats.total_users}\n` +
                    `📅 *এই মাসের ইউজার (Monthly):* ${stats.monthly_users}\n` +
                    `☀️ *আজকের ইউজার (Today):* ${stats.today_users}\n\n` +
                    `📢 *নোটিশ পাঠাতে লিখুন:*\n\`/broadcast আপনার মেসেজ...\``;

                await bot.sendMessage(query.message.chat.id, statsMsg, { parse_mode: 'Markdown' });
            }
        } catch (e) {
            bot.sendMessage(query.message.chat.id, '❌ ডাটা আনতে সমস্যা হয়েছে!');
        }
        bot.answerCallbackQuery(query.id);
    }
});

// ==========================================
// 📢 ৩. ব্রডকাস্ট মেসেজ পাঠানো (/broadcast)
// ==========================================
bot.onText(/\/broadcast (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    if (msg.from.id !== ADMIN_ID) {
        return bot.sendMessage(chatId, '❌ এই কমান্ড কেবল এডমিনের জন্য!');
    }

    const messageText = match[1].trim();
    await bot.sendMessage(chatId, '⏳ সকল ইউজারের কাছে ব্রডকাস্ট নোটিশ পাঠানো শুরু হচ্ছে...');

    try {
        const res = await axiosInstance.post(PHP_API_URL, {
            secret_key: SECRET_KEY,
            action: 'get_all_telegram_ids'
        });

        if (res.data.status === 'success') {
            const users = res.data.users;
            let successCount = 0;

            for (const user of users) {
                try {
                    await bot.sendMessage(user.telegram_id, `📢 *অফিশিয়াল নোটিশ*\n\n${messageText}`, { parse_mode: 'Markdown' });
                    successCount++;
                    await new Promise(resolve => setTimeout(resolve, 50));
                } catch (err) {
                    // Blocked or invalid user
                }
            }
            await bot.sendMessage(chatId, `✅ *ব্রডকাস্ট সম্পন্ন হয়েছে!*\n\nমোট সফল মেসেজ: *${successCount} / ${users.length}*`, { parse_mode: 'Markdown' });
        }
    } catch (e) {
        await bot.sendMessage(chatId, '❌ ব্রডকাস্ট পাঠাতে ব্যর্থ হয়েছে!');
    }
});

// Polling Error Ignore Handler
bot.on('polling_error', (error) => {
    if (error.code !== 'ETELEGRAM' || !error.message.includes('409 Conflict')) {
        console.error('Polling Error:', error.message);
    }
});

console.log('🤖 Bot Engine Listening...');
