const { Telegraf, Markup } = require('telegraf');
const express = require('express');
const connectDB = require('./config/db');

// Config & Environment Constants
const BOT_TOKEN = process.env.BOT_TOKEN || '8651381547:AAF5jgoHUVl8vlTfEe47unNL_9w06YkgxdY';
const RENDER_EXTERNAL_URL = process.env.RENDER_EXTERNAL_URL || 'https://ahtg-bd-bot.onrender.com';
const ADMIN_TELEGRAM_ID = 7689311203;

// Handlers Import
const { handleStart } = require('./handlers/startHandler');
const { handleProfile } = require('./handlers/profileHandler');
const { handleInstaTask } = require('./handlers/instaHandler');
const { handleRedeemGiftCard } = require('./handlers/walletHandler');
const { handleAdminPanel, handleCreateGiftCard } = require('./handlers/adminHandler');

const bot = new Telegraf(BOT_TOKEN);
const app = express();
const PORT = process.env.PORT || 10000;

// Connect MongoDB Atlas
connectDB();

app.use(express.json());
app.use(bot.webhookCallback(`/webhook/${BOT_TOKEN}`));

// 🛡️ Global Error Catching (যাতে যেকোনো এররে বট ক্র্যাশ না করে)
bot.catch((err, ctx) => {
    console.error(`[Telegraf Error] for update ${ctx.updateType}:`, err);
    try {
        ctx.reply('⚠️ সিস্টেমে সাময়িক সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।');
    } catch (e) {
        console.error('Failed to send error reply:', e.message);
    }
});

// Server Keep-Alive Webhook Endpoint
app.get('/', (req, res) => {
    res.send('Al-Huda Task Bot Server is Running Live & Active!');
});

// 🤖 Telegram Bot Action & Command Routing
bot.start(handleStart);

// Main Reply Keyboard Listeners
bot.hears(['👤 প্রোফাইল', '👤 Profile'], handleProfile);
bot.hears(['📸 ইন্সটাগ্রাম কাজ', '📸 Insta Task'], handleInstaTask);

// Admin Control Panel Handlers
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

bot.command('creategift', (ctx) => {
    if (Number(ctx.from.id) === Number(ADMIN_TELEGRAM_ID)) {
        return handleCreateGiftCard(ctx);
    }
});

// Text Event Listener (Gift Card Redeem Code Auto-Detection)
bot.on('text', (ctx, next) => {
    const text = ctx.message.text.trim();
    if (text.startsWith('CLAIM-') || text.startsWith('GIFT-')) {
        return handleRedeemGiftCard(ctx, text);
    }
    return next();
});

// Express Server & Webhook Initialization
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

// Graceful Shutdown Events
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
