const TelegramBot = require('node-telegram-bot-api');
const fetch = require('node-fetch');

// আপনার কনফিগারেশন
const BOT_TOKEN = process.env.BOT_TOKEN || '8651381547:AAF5jgoHUVl8vlTfEe47unNL_9w06YkgxdY';
const RENDER_EXTERNAL_URL = process.env.RENDER_EXTERNAL_URL || 'https://ahtg-bd-bot.onrender.com';
const ADMIN_TELEGRAM_ID = 7689311203;
const PORT = process.env.PORT || 10000;

// আপনার কাস্টম ডোমেইন
const YOUR_DOMAIN = 'alhudatechglobal.shop';
const WEBSITE_API_URL = `https://${YOUR_DOMAIN}/api_register.php`;

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

console.log('Bot is running and connected...');

// /start কমান্ড হ্যান্ডলার (রেফারেল কোডসহ)
bot.onText(/\/start(?:\s+(.+))?/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const username = msg.from.username || 'NoUsername';
    const refCodeFromLink = match[1] ? match[1].trim() : '';

    try {
        const response = await fetch(WEBSITE_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                telegram_id: userId,
                telegram_username: username,
                ref_code: refCodeFromLink
            })
        });

        const data = await response.json();

        if (data.status === 'success' || data.status === 'exists') {
            const keyboard = {
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: '🔗 আমার রেফার লিংক', callback_data: 'get_ref_link' },
                            { text: '👥 মোট রেফার সংখ্যা', callback_data: 'get_ref_count' }
                        ],
                        [
                            { text: '🚀 ওপেন অ্যাপ (ওয়েবসাইট)', web_app: { url: `https://${YOUR_DOMAIN}/support.php` } }
                        ]
                    ]
                }
            };

            bot.sendMessage(chatId, `স্বাগতম! আপনার অ্যাকাউন্ট সফলভাবে যুক্ত হয়েছে।\n\nনিচের বাটনগুলো থেকে আপনার রেফার লিংক ও তথ্য দেখতে পারেন:`, keyboard);
        } else {
            bot.sendMessage(chatId, 'দুঃখিত, ডাটাবেজে রেজিস্ট্রেশন করতে সমস্যা হয়েছে।');
        }
    } catch (error) {
        console.error('API Error:', error);
        bot.sendMessage(chatId, 'সার্ভারে কানেক্ট করতে সমস্যা হচ্ছে।');
    }
});

// বাটন ক্লিক হ্যান্ডলার (Callback Query)
bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const userId = query.from.id;
    const action = query.data;

    try {
        const apiUrl = `${WEBSITE_API_URL}?telegram_id=${userId}`;
        const res = await fetch(apiUrl);
        const data = await res.json();

        if (action === 'get_ref_link') {
            const botInfo = await bot.getMe();
            if (data.referral_code) {
                const refLink = `https://t.me/${botInfo.username}?start=${data.referral_code}`;
                bot.sendMessage(chatId, `📌 আপনার রেফারেল লিংক:\n${refLink}\n\nএই লিংকটি বন্ধুদের সাথে শেয়ার করুন!`);
            } else {
                bot.sendMessage(chatId, 'আপনার রেফার কোড পাওয়া যায়নি। দয়া করে /start দিয়ে আবার চেষ্টা করুন।');
            }
        } 
        else if (action === 'get_ref_count') {
            const refCount = data.ref_count || 0;
            bot.sendMessage(chatId, `👥 আপনার রেফারে মোট ${refCount} জন অ্যাকাউন্ট করেছে।`);
        }

        bot.answerCallbackQuery(query.id);
    } catch (error) {
        console.error('Callback Error:', error);
        bot.sendMessage(chatId, 'তথ্য আনতে সমস্যা হয়েছে।');
    }
});
