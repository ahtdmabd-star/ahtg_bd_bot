const { Telegraf } = require('telegraf');
const express = require('express');
const mongoose = require('mongoose');

// কনফিগারেশন ও ক্রেডেনশিয়ালস
const BOT_TOKEN = process.env.BOT_TOKEN || '8651381547:AAF5jgoHUVl8vlTfEe47unNL_9w06YkgxdY';
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://alhudatechglobal_db_user:XW0TalkXq3tov5Cy@cluster0.g7zrokl.mongodb.net/?appName=Cluster0';
const RENDER_EXTERNAL_URL = process.env.RENDER_EXTERNAL_URL || 'https://ahtg-bd-bot.onrender.com';

// আপনার টেলিগ্রাম আইডি এখানে অ্যাডমিন হিসেবে সেট করুন (আপনার আইডি বসিয়ে দেবেন)
const ADMIN_TELEGRAM_ID = 7689311203; // <-- আপনার টেলিগ্রাম ইউজার আইডি এখানে দিন

const bot = new Telegraf(BOT_TOKEN);
const app = express();

// ডাটাবেজ স্কিমা ও মডেল
const userSchema = new mongoose.Schema({
    telegramId: { type: Number, required: true, unique: true },
    firstName: String,
    username: String,
    joinedAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// ডাটাবেজ কানেকশন
mongoose.connect(MONGO_URI)
    .then(() => console.log('MongoDB Connected Successfully!'))
    .catch(err => console.error('MongoDB Connection Error:', err));

// এক্সপ্রেস মিডলওয়্যার
app.use(express.json());

// টেলিগ্রাম ওয়েবহুক রাউট সেটআপ
app.use(bot.webhookCallback(`/webhook/${BOT_TOKEN}`));

// হোম রাউট বা হার্টবিট সার্ভার
app.get('/', (req, res) => {
    res.send('Al-Huda Task Bot is running smoothly via Webhook!');
});

// /start কমান্ড হ্যান্ডলার
bot.start(async (ctx) => {
    try {
        const userId = ctx.from.id;
        const firstName = ctx.from.first_name || '';
        const username = ctx.from.username || '';

        await User.findOneAndUpdate(
            { telegramId: userId },
            { firstName, username },
            { upsert: true, new: true }
        );

        await ctx.reply(`স্বাগতম ${firstName}! আল-হুদা টাস্ক প্ল্যাটফর্মে আপনাকে সফলভাবে রেজিস্টার্ড করা হয়েছে।`, {
            reply_markup: {
                inline_keyboard: [
                    [{ text: "🚀 ওপেন টাস্ক মিনি অ্যাপ", web_app: { url: "আপনার_মিনি_অ্যাপের_লাইভ_লিংক" } }]
                ]
            }
        });
    } catch (error) {
        console.error('Database Save Error:', error);
        await ctx.reply('দুঃখিত, সার্ভারে ডেটা সেভ করার সময় একটি সমস্যা হয়েছে।');
    }
});

// 👑 অ্যাডমিন প্যানেল কমান্ড (/admin)
bot.command('admin', async (ctx) => {
    try {
        if (ctx.from.id !== ADMIN_TELEGRAM_ID) {
            return ctx.reply('দুঃখিত! এই কমান্ডটি শুধু অ্যাডমিনের জন্য।');
        }

        const totalUsers = await User.countDocuments();

        const adminPanelText = `
👑 **Al-Huda Task Admin Panel** 👑

📊 **Total Users:** ${totalUsers}

📌 **Available Commands:**
/broadcast [আপনার মেসেজ] - সকল ইউজারের কাছে মেসেজ পাঠানোর জন্য।
        `;

        await ctx.replyWithMarkdown(adminPanelText);
    } catch (error) {
        console.error('Admin Panel Error:', error);
        ctx.reply('অ্যাডমিন প্যানেল লোড করতে সমস্যা হয়েছে।');
    }
});

// 📢 ব্রডকাস্ট কমান্ড (/broadcast মেসেজ)
bot.command('broadcast', async (ctx) => {
    try {
        if (ctx.from.id !== ADMIN_TELEGRAM_ID) {
            return ctx.reply('দুঃখিত! এই কমান্ডটি শুধু অ্যাডমিনের জন্য।');
        }

        const messageText = ctx.message.text.replace('/broadcast', '').trim();
        if (!messageText) {
            return ctx.reply('দয়া করে ব্রডকাস্ট করার জন্য কোনো মেসেজ লিখুন। যেমন:\n`/broadcast নতুন আপডেট এসেছে!`');
        }

        const users = await User.find({});
        let successCount = 0;
        let failCount = 0;

        await ctx.reply(`📢 ব্রডকাস্ট শুরু হয়েছে মোট ${users.length} জন ইউজারের কাছে...`);

        for (const user of users) {
            try {
                await bot.telegram.sendMessage(user.telegramId, messageText);
                successCount++;
            } catch (err) {
                failCount++;
            }
        }

        await ctx.reply(`✅ ব্রডকাস্ট সম্পন্ন!\nসফলভাবে গেছে: ${successCount} জনের কাছে\nব্যর্থ হয়েছে: ${failCount} জনের কাছে`);
    } catch (error) {
        console.error('Broadcast Error:', error);
        ctx.reply('ব্রডকাস্ট করার সময় একটি সমস্যা হয়েছে।');
    }
});

// পোর্ট নির্ধারণ ও সার্ভার স্টার্ট
const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
    console.log(`Server is running on port ${PORT}`);
    
    if (RENDER_EXTERNAL_URL) {
        const webhookUrl = `${RENDER_EXTERNAL_URL}/webhook/${BOT_TOKEN}`;
        try {
            await bot.telegram.setWebhook(webhookUrl);
            console.log(`Webhook is successfully set to: ${webhookUrl}`);
        } catch (error) {
            console.error('Failed to set webhook:', error);
        }
    }
});
