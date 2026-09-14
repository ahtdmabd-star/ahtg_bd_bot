const { Telegraf, Markup } = require('telegraf');
const express = require('express');
const mongoose = require('mongoose');

const BOT_TOKEN = process.env.BOT_TOKEN || '8651381547:AAF5jgoHUVl8vlTfEe47unNL_9w06YkgxdY';
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://alhudatechglobal_db_user:XW0TalkXq3tov5Cy@cluster0.g7zrokl.mongodb.net/?appName=Cluster0';
const RENDER_EXTERNAL_URL = process.env.RENDER_EXTERNAL_URL || 'https://ahtg-bd-bot.onrender.com';

const ADMIN_TELEGRAM_ID = 7689311203;
const CHANNEL_USERNAME = '@AHTG_OFFICIAL';
const MINI_APP_URL = 'https://alhudatechglobal.shop/dashboard.php';

const bot = new Telegraf(BOT_TOKEN);
const app = express();

const userSchema = new mongoose.Schema({
    telegramId: { type: Number, required: true, unique: true },
    firstName: String,
    username: String,
    isVerified: { type: Boolean, default: false },
    joinedAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

mongoose.connect(MONGO_URI)
    .then(() => console.log('MongoDB Connected Successfully!'))
    .catch(err => console.error('MongoDB Connection Error:', err));

app.use(express.json());
app.use(bot.webhookCallback(`/webhook/${BOT_TOKEN}`));

app.get('/', (req, res) => {
    res.send('Al-Huda Task Bot is running!');
});

async function checkMembership(userId) {
    try {
        const chatMember = await bot.telegram.getChatMember(CHANNEL_USERNAME, userId);
        return ['member', 'administrator', 'creator'].includes(chatMember.status);
    } catch (error) {
        return false;
    }
}

// মূল স্টার্টিং পয়েন্ট
bot.start(async (ctx) => {
    const userId = ctx.from.id;
    const firstName = ctx.from.first_name || 'User';
    const username = ctx.from.username || '';

    await User.findOneAndUpdate(
        { telegramId: userId },
        { firstName, username },
        { upsert: true, new: true }
    );

    const isJoined = await checkMembership(userId);
    if (!isJoined && userId !== ADMIN_TELEGRAM_ID) {
        return ctx.reply(
            `Welcome ${firstName}!\n\nবটটি ব্যবহার করতে আমাদের অফিশিয়াল চ্যানেল ও গ্রুপে জয়েন করুন।`,
            Markup.inlineKeyboard([
                [Markup.button.url('📢 Join Channel', 'https://t.me/AHTG_OFFICIAL')],
                [Markup.button.url('👥 Join Group', 'https://t.me/+N026NocN90tlMTM1')],
                [Markup.button.callback('✅ Verify Membership', 'verify_membership')]
            ])
        );
    }

    await User.updateOne({ telegramId: userId }, { isVerified: true });
    sendMainMenu(ctx, userId === ADMIN_TELEGRAM_ID);
});

bot.action('verify_membership', async (ctx) => {
    const userId = ctx.from.id;
    const isJoined = await checkMembership(userId);

    if (!isJoined) {
        return ctx.answerCbQuery('আপনি এখনো জয়েন করেননি! জয়েন করে আবার চেষ্টা করুন।', { show_alert: true });
    }

    await User.updateOne({ telegramId: userId }, { isVerified: true });
    await ctx.answerCbQuery('ভেরিফিকেশন সফল হয়েছে!');
    await ctx.deleteMessage();
    sendMainMenu(ctx, userId === ADMIN_TELEGRAM_ID);
});

// স্থায়ী রিপ্লাই কিবোর্ড (নিচের বাটন)
function sendMainMenu(ctx, isAdmin) {
    let keyboard = [
        [Markup.button.webApp('🚀 Open Mini App', MINI_APP_URL)],
        ['📋 Task List', '👤 Profile'],
        ['💳 Withdraw', '📢 Support']
    ];

    if (isAdmin) {
        keyboard.push(['👑 Admin Panel']);
    }

    ctx.reply(
        'স্বাগতম! নিচের বাটনগুলো দিয়ে আপনার সার্ভিস বেছে নিন:',
        Markup.keyboard(keyboard).resize()
    );
}

// বাটন একশনসমূহ (Text Event Listeners)
bot.hears('🚀 Open Mini App', (ctx) => {
    ctx.reply('নিচের বাটনে চাপ দিয়ে অ্যাপ খুলুন:', Markup.inlineKeyboard([
        [Markup.button.webApp('🚀 Open App', MINI_APP_URL)]
    ]));
});

bot.hears('📋 Task List', (ctx) => {
    ctx.reply('টাস্ক সম্পন্ন করতে মিনি অ্যাপ ব্যবহার করুন:', Markup.inlineKeyboard([
        [Markup.button.webApp('🚀 Open Tasks', MINI_APP_URL)]
    ]));
});

bot.hears('👤 Profile', async (ctx) => {
    const user = await User.findOne({ telegramId: ctx.from.id });
    ctx.reply(
        `👤 **প্রোফাইল ইনফো:**\n\n` +
        `নাম: ${ctx.from.first_name}\n` +
        `আইডি: \`${ctx.from.id}\`\n` +
        `স্ট্যাটাস: ${user && user.isVerified ? '✅ Verified' : '❌ Unverified'}`,
        { parse_mode: 'Markdown' }
    );
});

bot.hears('💳 Withdraw', (ctx) => {
    ctx.reply('উইথড্র করতে ড্যাশবোর্ডে প্রবেশ করুন:', Markup.inlineKeyboard([
        [Markup.button.webApp('💳 Withdraw Dashboard', MINI_APP_URL)]
    ]));
});

bot.hears('📢 Support', (ctx) => {
    ctx.reply('সাহায্যের জন্য হেল্প গ্রুপে যোগাযোগ করুন:', Markup.inlineKeyboard([
        [Markup.button.url('👥 Support Group', 'https://t.me/+N026NocN90tlMTM1')]
    ]));
});

bot.hears('👑 Admin Panel', (ctx) => {
    if (ctx.from.id !== ADMIN_TELEGRAM_ID) return;
    ctx.reply(
        'Admin Control Panel:',
        Markup.inlineKeyboard([
            [Markup.button.callback('📊 User List', 'admin_user_list')],
            [Markup.button.callback('📢 Broadcast', 'admin_broadcast_prompt')]
        ])
    );
});

bot.action('admin_user_list', async (ctx) => {
    if (ctx.from.id !== ADMIN_TELEGRAM_ID) return;
    const users = await User.find({});
    ctx.reply(`📊 মোট ইউজার: ${users.length} জন`);
});

bot.action('admin_broadcast_prompt', async (ctx) => {
    if (ctx.from.id !== ADMIN_TELEGRAM_ID) return;
    ctx.reply('নোটিশ পাঠাতে লিখুন:\n\n/broadcast আপনার মেসেজ');
});

bot.command('broadcast', async (ctx) => {
    if (ctx.from.id !== ADMIN_TELEGRAM_ID) return;
    const msg = ctx.message.text.replace('/broadcast', '').trim();
    if (!msg) return ctx.reply('মেসেজ লিখুন।');

    const users = await User.find({});
    let count = 0;
    for (const u of users) {
        try {
            await bot.telegram.sendMessage(u.telegramId, `📢 Notice:\n\n${msg}`);
            count++;
        } catch (e) {}
    }
    ctx.reply(`সফলভাবে ${count} জনকে পাঠানো হয়েছে।`);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
    if (RENDER_EXTERNAL_URL) {
        await bot.telegram.setWebhook(`${RENDER_EXTERNAL_URL}/webhook/${BOT_TOKEN}`);
    }
});
