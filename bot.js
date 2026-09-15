const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const mongoose = require('mongoose');

// Hardcoded Configuration Credentials
const BOT_TOKEN = '8651381547:AAET-bOtXeJEZR5S-s4zVSConRPZ_hhystI';
const MONGO_URI = 'mongodb+srv://alhudatechglobal_db_user:XW0TalkXq3tov5Cy@cluster0.g7zrokl.mongodb.net/?appName=Cluster0';
const API_URL = 'http://if0_42924321_twdb.infinityfreeapp.com/api.php'; // Ensure your domain matches InfinityFree
const MINI_APP_URL = 'http://if0_42924321_twdb.infinityfreeapp.com/index.php';

const ADMIN_ID = '7689311203'; 
const REQUIRED_CHANNEL = '@AHTG_OFFICIAL';
const REQUIRED_GROUP_INVITE = 'https://t.me/+N026NocN90tlMTM1';

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// MongoDB Connection
mongoose.connect(MONGO_URI)
  .then(() => console.log("MongoDB Connected Successfully"))
  .catch(err => console.error("MongoDB Error:", err));

const BotUserSchema = new mongoose.Schema({
    telegram_id: { type: String, unique: true, required: true },
    joined_at: { type: Date, default: Date.now }
});
const BotUser = mongoose.model('BotUser', BotUserSchema);

// /start Command Handler
bot.onText(/\/start(?:\s+(.+))?/, async (msg, match) => {
    const chatId = msg.chat.id;
    const telegramId = msg.from.id.toString();
    const refBy = match[1] ? match[1].trim() : '';

    await BotUser.updateOne({ telegram_id: telegramId }, { telegram_id: telegramId }, { upsert: true });
    checkAndProcessUser(chatId, telegramId, msg.from, refBy);
});

// Verification and Processing Engine
async function checkAndProcessUser(chatId, telegramId, userObj, refBy) {
    try {
        const channelMember = await bot.getChatMember(REQUIRED_CHANNEL, telegramId);
        const isSubscribed = ['creator', 'administrator', 'member'].includes(channelMember.status);

        if (!isSubscribed) {
            return bot.sendMessage(chatId, `⚠️ **Access Denied!**\n\nYou must join our Channel and Group to access the Mini App.\n\nClick "Verify ✅" after joining.`, {
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

        // Register to InfinityFree MySQL
        const params = new URLSearchParams();
        params.append('telegram_id', telegramId);
        params.append('first_name', userObj.first_name || '');
        params.append('username', userObj.username || '');
        params.append('referred_by', refBy);

        const response = await axios.post(`${API_URL}?action=register`, params);

        if (response.data.status === 'success') {
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
        }
    } catch (error) {
        console.error(error);
        bot.sendMessage(chatId, "⚠️ Verification Error. Please make sure you joined the channel/group and try again.");
    }
}

// Callback Listener
bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const telegramId = query.from.id.toString();
    const data = query.data;

    if (data.startsWith('verify_')) {
        const refBy = data.split('_')[1] || "";
        bot.answerCallbackQuery(query.id, { text: "Checking membership..." });
        checkAndProcessUser(chatId, telegramId, query.from, refBy);
    }

    if (data === "admin_broadcast" && telegramId === ADMIN_ID) {
        bot.answerCallbackQuery(query.id);
        bot.sendMessage(chatId, "📢 Send your notice text in the following format:\n\n`/sendnotice Your Message Here`", { parse_mode: 'Markdown' });
    }
});

// Admin Broadcast Command (/sendnotice Message)
bot.onText(/\/sendnotice (.+)/, async (msg, match) => {
    const telegramId = msg.from.id.toString();
    if (telegramId !== ADMIN_ID) return;

    const noticeMessage = match[1];
    const users = await BotUser.find({});
    
    let successCount = 0;
    bot.sendMessage(telegramId, `⏳ Sending notice to ${users.length} users...`);

    for (let u of users) {
        try {
            await bot.sendMessage(u.telegram_id, `📢 **OFFICIAL NOTICE**\n\n${noticeMessage}`, { parse_mode: 'Markdown' });
            successCount++;
        } catch (e) {
            // Skips blocked users
        }
    }

    bot.sendMessage(telegramId, `✅ Notice delivered to ${successCount} users.`);
});

