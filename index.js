const { Telegraf, Markup } = require('telegraf');
const express = require('express');
const mongoose = require('mongoose');

// কনফিগারেশন ও ক্রেডেনশিয়ালস
const BOT_TOKEN = process.env.BOT_TOKEN || '8651381547:AAF5jgoHUVl8vlTfEe47unNL_9w06YkgxdY';
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://alhudatechglobal_db_user:XW0TalkXq3tov5Cy@cluster0.g7zrokl.mongodb.net/?appName=Cluster0';
const RENDER_EXTERNAL_URL = process.env.RENDER_EXTERNAL_URL || 'https://ahtg-bd-bot.onrender.com';

const ADMIN_TELEGRAM_ID = 7689311203; // আপনার আইডি
const CHANNEL_USERNAME = '@AHTG_OFFICIAL'; // আপনার চ্যানেলের ইউজারনেম
const GROUP_CHAT_ID = -100xxxxxxxxxx; // আপনার গ্রুপের চ্যাট আইডি (বা গ্রুপ ইউজারনেম যদি থাকে)

const bot = new Telegraf(BOT_TOKEN);
const app = express();

// ডাটাবেজ স্কিমা ও মডেল
const userSchema = new mongoose.Schema({
    telegramId: { type: Number, required: true, unique: true },
    firstName: String,
    username: String,
    isVerified: { type: Boolean, default: false },
    joinedAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// ডাটাবেজ কানেকশন
mongoose.connect(MONGO_URI)
    .then(() => console.log('MongoDB Connected Successfully!'))
    .catch(err => console.error('MongoDB Connection Error:', err));

// এক্সপ্রেস মিডলওয়্যার
app.use(express.json());
app.use(bot.webhookCallback(`/webhook/${BOT_TOKEN}`));

app.get('/', (req, res) => {
    res.send('Al-Huda Task Bot with Admin Menu & Force Sub is running!');
});

// ইউজার চ্যানেল ও গ্রুপে জয়েন আছে কিনা চেক করার ফাংশন
async function checkMembership(userId) {
    try {
        const channelMember = await bot.telegram.getChatMember(CHANNEL_USERNAME, userId);
        const isChannelMember = ['member', 'administrator', 'creator'].includes(channelMember.status);
        
        // যদি গ্রুপের চ্যাট আইডি সেট করা থাকে তবে গ্রুপ চেকও যুক্ত করতে পারেন
        return isChannelMember;
    } catch (error) {
        return false;
    }
}

// /start কমান্ড হ্যান্ডলার (Force Subscription Check)
bot.start(async (ctx) => {
    const userId = ctx.from.id;
    const firstName = ctx.from.first_name || 'ব্যবহারকারী';
    const username = ctx.from.username || '';

    // ডাটাবেজে ইউজার রেজিস্টার বা আপডেট
    await User.findOneAndUpdate(
        { telegramId: userId },
        { firstName, username },
        { upsert: true, new: true }
    );

    // অ্যাডমিন হলে সরাসরি মেনু বা মেইন পেজ দেখাবে
    if (userId === ADMIN_TELEGRAM_ID) {
        return sendMainMenu(ctx, true);
    }

    // মেম্বারশিপ চেক
    const isJoined = await checkMembership(userId);
    if (!isJoined) {
        return ctx.reply(
            `⚠️ স্বাগতম ${firstName}!\n\nবটটি ব্যবহার করতে এবং আমাদের মিনি অ্যাপে প্রবেশ করতে হলে অবশ্যই আমাদের চ্যানেল ও গ্রুপে জয়েন করতে হবে।`,
            Markup.inlineKeyboard([
                [Markup.button.url('📢 আমাদের চ্যানেল', 'https://t.me/AHTG_OFFICIAL')],
                [Markup.button.url('👥 আমাদের গ্রুপ', 'https://t.me/+N026NocN90tlMTM1')],
                [Markup.button.callback('✅ ভেরিফাই করুন', 'verify_membership')]
            ])
        );
    }

    // ভেরিফাইড হলে মেইন মেনু দেখানো
    await User.updateOne({ telegramId: userId }, { isVerified: true });
    sendMainMenu(ctx, false);
});

// ভেরিফিকেশন বাটন ক্লিক হ্যান্ডলার
bot.action('verify_membership', async (ctx) => {
    const userId = ctx.from.id;
    const isJoined = await checkMembership(userId);

    if (!isJoined) {
        return ctx.answerCbQuery('❌ আপনি এখনো চ্যানেল বা গ্রুপে জয়েন করেননি! দয়া করে জয়েন করে আবার চেষ্টার করুন।', { show_alert: true });
    }

    await User.updateOne({ telegramId: userId }, { isVerified: true });
    await ctx.answerCbQuery('✅ ভেরিফিকেশন সফল হয়েছে!');
    await ctx.deleteMessage();
    sendMainMenu(ctx, userId === ADMIN_TELEGRAM_ID);
});

// মূল মেনু দেখানোর ফাংশন
function sendMainMenu(ctx, isAdmin) {
    let keyboard = [
        [Markup.button.webApp('🚀 ওপেন টাস্ক মিনি অ্যাপ', 'আপনার_মিনি_অ্যাপের_লাইভ_লিংক')]
    ];

    if (isAdmin) {
        keyboard.push([Markup.button.callback('👑 অ্যাডমিন মেনু প্যানেল', 'admin_menu')]);
    }

    ctx.reply('স্বাগতম! নিচের অপশনগুলো থেকে আপনার প্রয়োজনীয় কাজটি বেছে নিন:', Markup.inlineKeyboard(keyboard));
}

// 👑 অ্যাডমিন মেনু ড্যাশবোর্ড
bot.action('admin_menu', async (ctx) => {
    if (ctx.from.id !== ADMIN_TELEGRAM_ID) return ctx.answerCbQuery('অনুমতি নেই!', { show_alert: true });

    await ctx.editMessageText(
        '👑 **Al-Huda Task Admin Control Panel** 👑\n\nনিচের অপশনগুলো ব্যবহার করে পুরো বট কন্ট্রোল করুন:',
        Markup.inlineKeyboard([
            [Markup.button.callback('📊 মোট ইউজার লিস্ট', 'admin_user_list')],
            [Markup.button.callback('📢 সবাইকে নোটিশ পাঠান (Broadcast)', 'admin_broadcast_prompt')],
            [Markup.button.callback('✉️ নির্দিষ্ট ইউজারকে মেসেজ পাঠান', 'admin_msg_prompt')],
            [Markup.button.callback('🚫 ইউজার ব্যান/বের করে দিন', 'admin_ban_prompt')],
            [Markup.button.callback('🔙 মূল মেনুতে ফিরুন', 'back_home')]
        ])
    );
});

// ইউজার লিস্ট দেখার অপশন
bot.action('admin_user_list', async (ctx) => {
    if (ctx.from.id !== ADMIN_TELEGRAM_ID) return;
    const users = await User.find({});
    let text = `📊 **মোট রেজিস্টার্ড ইউজার:** ${users.length} জন\n\n`;
    users.forEach((u, index) => {
        text += `${index + 1}. ${u.firstName} (ID: \`${u.telegramId}\`)\n`;
    });
    
    if (text.length > 4096) text = text.substring(0, 4000) + '\n...তালিকা দীর্ঘ হওয়ায় সংক্ষেপ করা হলো।';
    
    await ctx.editMessageText(text, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([[Markup.button.callback('⬅️ ব্যাক', 'admin_menu')]])
    });
});

// ব্রডকাস্ট বা নোটিশ পাঠানোর নির্দেশিকা
bot.action('admin_broadcast_prompt', async (ctx) => {
    if (ctx.from.id !== ADMIN_TELEGRAM_ID) return;
    await ctx.editMessageText(
        '📢 সকল ইউজারের কাছে নোটিশ পাঠাতে চ্যাটে এই কমান্ডটি লিখুন:\n\n`/broadcast আপনার নোটিশের লেখা`',
        Markup.inlineKeyboard([[Markup.button.callback('⬅️ ব্যাক', 'admin_menu')]])
    );
});

// নির্দিষ্ট ইউজারকে মেসেজ পাঠানোর গাইড
bot.action('admin_msg_prompt', async (ctx) => {
    if (ctx.from.id !== ADMIN_TELEGRAM_ID) return;
    await ctx.editMessageText(
        '✉️ নির্দিষ্ট কোনো ইউজারকে মেসেজ পাঠাতে চ্যাটে এই কমান্ডটি লিখুন:\n\n`/sendmsg [ইউজার_আইডি] [আপনার_মেসেজ]`\nযেমন: `/sendmsg 123456789 কেমন আছেন?`',
        Markup.inlineKeyboard([[Markup.button.callback('⬅️ ব্যাক', 'admin_menu')]])
    );
});

// ইউজার ব্যান বা বের করার গাইড
bot.action('admin_ban_prompt', async (ctx) => {
    if (ctx.from.id !== ADMIN_TELEGRAM_ID) return;
    await ctx.editMessageText(
        '🚫 কোনো ইউজারকে বট থেকে ব্যান বা বাদ দিতে চ্যাটে এই কমান্ডটি লিখুন:\n\n`/ban [ইউজার_আইডি]`\nযেমন: `/ban 123456789`',
        Markup.inlineKeyboard([[Markup.button.callback('⬅️ ব্যাক', 'admin_menu')]])
    );
});

bot.action('back_home', async (ctx) => {
    await ctx.deleteMessage();
    sendMainMenu(ctx, ctx.from.id === ADMIN_TELEGRAM_ID);
});

// 📢 ব্রডকাস্ট কমান্ড এক্সিকিউশন
bot.command('broadcast', async (ctx) => {
    if (ctx.from.id !== ADMIN_TELEGRAM_ID) return;
    const msg = ctx.message.text.replace('/broadcast', '').trim();
    if (!msg) return ctx.reply('দয়া করে মেসেজ লিখুন।');

    const users = await User.find({});
    let count = 0;
    for (const u of users) {
        try {
            await bot.telegram.sendMessage(u.telegramId, `📢 **অফিশিয়াল নোটিশ:**\n\n${msg}`, { parse_mode: 'Markdown' });
            count++;
        } catch (e) {}
    }
    ctx.reply(`✅ সফলভাবে ${count} জনের কাছে নোটিশ পাঠানো হয়েছে।`);
});

// ✉️ নির্দিষ্ট ইউজারকে মেসেজ পাঠানোর কমান্ড
bot.command('sendmsg', async (ctx) => {
    if (ctx.from.id !== ADMIN_TELEGRAM_ID) return;
    const args = ctx.message.text.split(' ');
    const targetId = args[1];
    const message = args.slice(2).join(' ');

    if (!targetId || !message) {
        return ctx.reply('সঠিক নিয়মে লিখুন: `/sendmsg [ID] [Message]`');
    }

    try {
        await bot.telegram.sendMessage(targetId, `📩 **অ্যাডমিনের বার্তা:**\n\n${message}`, { parse_mode: 'Markdown' });
        ctx.reply(`✅ ইউজার ${targetId} এর কাছে মেসেজ সফলভাবে পাঠানো হয়েছে।`);
    } catch (e) {
        ctx.reply('❌ মেসেজ পাঠানো ব্যর্থ হয়েছে। ইউজার সম্ভবত বট ব্লক করেছে বা আইডি ভুল।');
    }
});

// 🚫 ইউজার ব্যান বা ডিলিট করার কমান্ড
bot.command('ban', async (ctx) => {
    if (ctx.from.id !== ADMIN_TELEGRAM_ID) return;
    const targetId = ctx.message.text.split(' ')[1];
    if (!targetId) return ctx.reply('ইউজার আইডি দিন। যেমন: `/ban 123456789`');

    const result = await User.deleteOne({ telegramId: Number(targetId) });
    if (result.deletedCount > 0) {
        ctx.reply(`✅ ইউজার ${targetId} কে ডাটাবেজ ও বট থেকে সফলভাবে অপসারণ করা হয়েছে।`);
    } else {
        ctx.reply('❌ এই আইডি দিয়ে কোনো ইউজার পাওয়া যায়নি।');
    }
});

// পোর্ট নির্ধারণ ও সার্ভার স্টার্ট
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
    console.log(`Server is running on port ${PORT}`);
    if (RENDER_EXTERNAL_URL) {
        const webhookUrl = `${RENDER_EXTERNAL_URL}/webhook/${BOT_TOKEN}`;
        await bot.telegram.setWebhook(webhookUrl);
        console.log(`Webhook set to: ${webhookUrl}`);
    }
});
