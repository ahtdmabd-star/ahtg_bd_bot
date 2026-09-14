const { Telegraf, Markup } = require('telegraf');
const express = require('express');
const connectDB = require('./config/db');

// Config Values
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

// Connect Database
connectDB();

app.use(express.json());
app.use(bot.webhookCallback(`/webhook/${BOT_TOKEN}`));

// Express Webhook & Ping Server
app.get('/', (req, res) => {
    res.send('Al-Huda Task Bot Server is Live!');
});

// Bot Commands Setup
bot.start(handleStart);

// Main Keyboards Action Listeners
bot.hears(['👤 প্রোফাইল', '👤 Profile'], handleProfile);
bot.hears(['📸 ইন্সটাগ্রাম কাজ', '📸 Insta Task'], handleInstaTask);

// Admin Action Listeners & Commands
bot.hears(['👑 অ্যাডমিন প্যানেল', '👑 Admin Panel'], (ctx) => {
    if (ctx.from.id === ADMIN_TELEGRAM_ID) {
        return handleAdminPanel(ctx);
    }
});
bot.command('admin', (ctx) => {
    if (ctx.from.id === ADMIN_TELEGRAM_ID) {
        return handleAdminPanel(ctx);
    }
});
bot.command('creategift', (ctx) => {
    if (ctx.from.id === ADMIN_TELEGRAM_ID) {
        return handleCreateGiftCard(ctx);
    }
});

// Text Event Handling (Gift Card Redeem Auto-Detect)
bot.on('text', (ctx, next) => {
    const text = ctx.message.text.trim();
    if (text.startsWith('CLAIM-') || text.startsWith('GIFT-')) {
        return handleRedeemGiftCard(ctx, text);
    }
    return next();
});

// Start Webhook Server
app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
    if (RENDER_EXTERNAL_URL) {
        try {
            await bot.telegram.setWebhook(`${RENDER_EXTERNAL_URL}/webhook/${BOT_TOKEN}`);
            console.log('Webhook Successfully Configured!');
        } catch (err) {
            console.error('Webhook Setup Error:', err.message);
        }
    }
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
