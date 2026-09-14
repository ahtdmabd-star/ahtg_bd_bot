const { Telegraf } = require('telegraf');
const express = require('express');
const mongoose = require('mongoose');

// কনফিগারেশন ও ক্রেডেনশিয়ালস
const BOT_TOKEN = process.env.BOT_TOKEN || '8651381547:AAF5jgoHUVl8vlTfEe47unNL_9w06YkgxdY';
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://alhudatechglobal_db_user:XW0TalkXq3tov5Cy@cluster0.g7zrokl.mongodb.net/?appName=Cluster0';
const RENDER_EXTERNAL_URL = process.env.RENDER_EXTERNAL_URL || 'https://ahtg-bd-bot.onrender.com';

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

// টেলিগ্রাম ওয়েবহুক রুট সেটআপ
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

        // ডাটাবেজে ইউজার সেভ বা আপডেট করা
        await User.findOneAndUpdate(
            { telegramId: userId },
            { firstName, username },
            { upsert: true, new: true }
        );

        await ctx.reply(`স্বাগতম ${firstName}! আল-হুদা টাস্ক প্ল্যাটফর্মে আপনাকে সফলভাবে রেজিস্টার্ড করা হয়েছে।`);
    } catch (error) {
        console.error('Database Save Error:', error);
        await ctx.reply('দুঃখিত, সার্ভারে ডেটা সেভ করার সময় একটি সমস্যা হয়েছে। দয়া করে একটু পরে আবার চেষ্টা করুন।');
    }
});

// পোর্ট নির্ধারণ ও সার্ভার স্টার্ট
const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
    console.log(`Server is running on port ${PORT}`);
    
    // রেন্ডার এক্সটার্নাল ইউআরএল দিয়ে টেলিগ্রামে ওয়েবহুক সেট করা
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
