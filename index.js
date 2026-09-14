const { Telegraf } = require('telegraf');
const express = require('express');
const connectDB = require('./config/db');

// Config Constants
const BOT_TOKEN = process.env.BOT_TOKEN || '8651381547:AAF5jgoHUVl8vlTfEe47unNL_9w06YkgxdY';
const RENDER_EXTERNAL_URL = process.env.RENDER_EXTERNAL_URL || 'https://ahtg-bd-bot.onrender.com';
const ADMIN_TELEGRAM_ID = 7689311203;

// Handlers Import
const { handleStart } = require('./handlers/startHandler');
const { handleProfile } = require('./handlers/profileHandler');
const { handleInstaTask } = require('./handlers/instaHandler');
const { handleRedeemGiftCard } = require('./handlers/walletHandler');
const { 
    handleAdminPanel, 
    handleCreateGiftCard, 
    handleAddInstaStock, 
    handleDocumentUpload 
} = require('./handlers/adminHandler');

const bot = new Telegraf(BOT_TOKEN);
const app = express();
const PORT = process.env.PORT || 10000;

// Connect MongoDB Atlas
connectDB();

app.use(express.json());
app.use(bot.webhookCallback(`/webhook/${BOT_TOKEN}`));

// 🛡️ Global Error Catching
bot.catch((err, ctx) => {
    console.error(`[Telegraf Error] for update ${ctx.updateType}:`, err);
    try {
        ctx.reply('⚠️ সিস্টেমে সাময়িক সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।');
    } catch (e) {
        console.error('Failed to send error reply:', e.message);
    }
});

// Keep-Alive Webhook Endpoint
app.get('/', (req, res) => {
    res.send('Al-Huda Task Bot Server is Running Live!');
});

// 🤖 Telegram Bot Routing
bot.start(handleStart);

// Main Reply Keyboard Listeners
bot.hears(['👤 প্রোফাইল', '👤 Profile'], handleProfile);
bot.hears(['📸 ইন্সটাগ্রাম কাজ', '📸 Insta Task'], handleInstaTask);

// 🔄 অন্যান্য সোশ্যাল মিডিয়া কাজের নোটিশ
const upcomingTaskNotice = (ctx) => {
    return ctx.reply('⏳ এই কাজটি খুব শীঘ্রই চালু হতে যাচ্ছে! অনুগ্রহ করে অপেক্ষা করুন এবং অন্যান্য কাজগুলো সম্পন্ন করুন।');
};

bot.hears(['📧 জিমেইল কাজ', '📧 Gmail Task'], upcomingTaskNotice);
bot.hears(['📘 ফেসবুক কাজ', '📘 Facebook Task'], upcomingTaskNotice);
bot.hears(['🐦 টুইটার (X) কাজ', '🐦 Twitter Task'], upcomingTaskNotice);

// Admin Control Panel Handlers & Commands
bot.hears(['👑 অ্যাডমিন প্যানেল', '👑 Admin Panel'], (ctx) => {
    if (Number(ctx.from.id) === Number(ADMIN_TELEGRAM_ID)) {
        return handleAdminPanel(ctx);
    }
});

bot.command('admin', (ctx) => {
    if (Number(ctx.from.id) === Number(ADMIN_TELEGRAM_ID)) {
        return handleAdminPanel(ctx);
    }
});

bot.command('addinsta', (ctx) => {
    if (Number(ctx.from.id) === Number(ADMIN_TELEGRAM_ID)) {
        return handleAddInstaStock(ctx);
    }
});

bot.command('creategift', (ctx) => {
    if (Number(ctx.from.id) === Number(ADMIN_TELEGRAM_ID)) {
        return handleCreateGiftCard(ctx);
    }
});

// Document/File Listener for Bulk Upload
bot.on('document', (ctx) => {
    if (Number(ctx.from.id) === Number(ADMIN_TELEGRAM_ID)) {
        return handleDocumentUpload(ctx);
    }
});

// Text Event Listener for Gift Cards
bot.on('text', (ctx, next) => {
    const text = ctx.message.text.trim();
    if (text.startsWith('CLAIM-') || text.startsWith('GIFT-')) {
        return handleRedeemGiftCard(ctx, text);
    }
    return next();
});

// Express Server Setup
app.listen(PORT, async () => {
    console.log(`Server successfully started on port ${PORT}`);
    if (RENDER_EXTERNAL_URL) {
        try {
            await bot.telegram.setWebhook(`${RENDER_EXTERNAL_URL}/webhook/${BOT_TOKEN}`);
            console.log('Webhook successfully registered on Telegram!');
        } catch (err) {
            console.error('Webhook Setup Error:', err.message);
        }
    }
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
