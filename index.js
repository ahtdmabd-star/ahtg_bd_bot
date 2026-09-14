require('dotenv').config();
const { Telegraf } = require('telegraf');
const express = require('express');
const connectDB = require('./config/db');

// Models & Handlers Import
const { handleStart } = require('./handlers/startHandler');
const { handleProfile } = require('./handlers/profileHandler');
const { handleInstaTask } = require('./handlers/instaHandler');
const { handleRedeemGiftCard } = require('./handlers/walletHandler');
const { handleAdminPanel, handleCreateGiftCard } = require('./handlers/adminHandler');

const bot = new Telegraf(process.env.BOT_TOKEN);
const app = express();
const PORT = process.env.PORT || 10000;

// Connect Database
connectDB();

// Express App Keep-Alive
app.get('/', (req, res) => {
    res.send('AL-HUDA TECH BD Bot Server is Running Live!');
});

// Bot Commands Setup
bot.start(handleStart);

// Action & Menu Buttons
bot.hears('👤 প্রোফাইল', handleProfile);
bot.hears('📸 ইন্সটাগ্রাম কাজ', handleInstaTask);

// Admin Commands
bot.command('admin', handleAdminPanel);
bot.command('creategift', handleCreateGiftCard);

// Text Handlers (Gift Card Redeem Check)
bot.on('text', (ctx, next) => {
    const text = ctx.message.text.trim();
    if (text.startsWith('CLAIM-') || text.startsWith('GIFT-')) {
        return handleRedeemGiftCard(ctx, text);
    }
    return next();
});

// Launch Bot
bot.launch().then(() => {
    console.log('🤖 Telegram Bot Successfully Launched!');
}).catch((err) => {
    console.error('Error Launching Bot:', err);
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
