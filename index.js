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
    res.send('Al-Huda Task Bot with Admin Menu & Force Sub is running!');
});

async function checkMembership(userId) {
    try {
        const chatMember = await bot.telegram.getChatMember(CHANNEL_USERNAME, userId);
        const status = chatMember.status;
        return ['member', 'administrator', 'creator'].includes(status);
    } catch (error) {
        console.error('Membership Check Error:', error);
        return false;
    }
}

bot.start(async (ctx) => {
    const userId = ctx.from.id;
    const firstName = ctx.from.first_name || 'à¦¬à§à¦¯à¦¬à¦¹à¦¾à¦°à¦•à¦¾à¦°à§€';
    const username = ctx.from.username || '';

    await User.findOneAndUpdate(
        { telegramId: userId },
        { firstName, username },
        { upsert: true, new: true }
    );

    if (userId === ADMIN_TELEGRAM_ID) {
        return sendMainMenu(ctx, true);
    }

    const isJoined = await checkMembership(userId);
    if (!isJoined) {
        return ctx.reply(
            `à¦¸à§à¦¬à¦¾à¦—à¦¤à¦® ${firstName}!\n\nà¦¬à¦Ÿà¦Ÿà¦¿ à¦¬à§à¦¯à¦¬à¦¹à¦¾à¦° à¦•à¦°à¦¤à§‡ à¦à¦¬à¦‚ à¦†à¦®à¦¾à¦¦à§‡à¦° à¦®à¦¿à¦¨à¦¿ à¦…à§à¦¯à¦¾à¦ªà§‡ à¦ªà§à¦°à¦¬à§‡à¦¶ à¦•à¦°à¦¤à§‡ à¦¹à¦²à§‡ à¦…à¦¬à¦¶à§à¦¯à¦‡ à¦†à¦®à¦¾à¦¦à§‡à¦° à¦…à¦«à¦¿à¦¸à¦¿à§Ÿà¦¾à¦² à¦šà§à¦¯à¦¾à¦¨à§‡à¦² à¦“ à¦—à§à¦°à§à¦ªà§‡ à¦œà§Ÿà§‡à¦¨ à¦•à¦°à¦¤à§‡ à¦¹à¦¬à§‡à¥¤`,
            Markup.inlineKeyboard([
                [Markup.button.url('ðŸ“¢ à¦†à¦®à¦¾à¦¦à§‡à¦° à¦šà§à¦¯à¦¾à¦¨à§‡à¦²', 'https://t.me/AHTG_OFFICIAL')],
                [Markup.button.url('ðŸ‘¥ à¦†à¦®à¦¾à¦¦à§‡à¦° à¦—à§à¦°à§à¦ª', 'https://t.me/+N026NocN90tlMTM1')],
                [Markup.button.callback('âœ… à¦­à§‡à¦°à¦¿à¦«à¦¾à¦‡ à¦•à¦°à§à¦¨', 'verify_membership')]
            ])
        );
    }

    await User.updateOne({ telegramId: userId }, { isVerified: true });
    sendMainMenu(ctx, false);
});

bot.action('verify_membership', async (ctx) => {
    const userId = ctx.from.id;
    const isJoined = await checkMembership(userId);

    if (!isJoined) {
        return ctx.answerCbQuery('à¦†à¦ªà¦¨à¦¿ à¦à¦–à¦¨à§‹ à¦šà§à¦¯à¦¾à¦¨à§‡à¦² à¦¬à¦¾ à¦—à§à¦°à§à¦ªà§‡ à¦œà§Ÿà§‡à¦¨ à¦•à¦°à§‡à¦¨à¦¨à¦¿! à¦¦à§Ÿà¦¾ à¦•à¦°à§‡ à¦œà§Ÿà§‡à¦¨ à¦•à¦°à§‡ à¦†à¦¬à¦¾à¦° à¦šà§‡à¦·à§à¦Ÿà¦¾ à¦•à¦°à§à¦¨à¥¤', { show_alert: true });
    }

    await User.updateOne({ telegramId: userId }, { isVerified: true });
    await ctx.answerCbQuery('à¦­à§‡à¦°à¦¿à¦«à¦¿à¦•à§‡à¦¶à¦¨ à¦¸à¦«à¦² à¦¹à§Ÿà§‡à¦›à§‡!');
    await ctx.deleteMessage();
    sendMainMenu(ctx, userId === ADMIN_TELEGRAM_ID);
});

function sendMainMenu(ctx, isAdmin) {
    let keyboard = [
        [Markup.button.webApp('ðŸš€ à¦“à¦ªà§‡à¦¨ à¦Ÿà¦¾à¦¸à§à¦• à¦®à¦¿à¦¨à¦¿ à¦…à§à¦¯à¦¾à¦ª', MINI_APP_URL)]
    ];

    if (isAdmin) {
        keyboard.push([Markup.button.callback('ðŸ‘‘ à¦…à§à¦¯à¦¾à¦¡à¦®à¦¿à¦¨ à¦®à§‡à¦¨à§ à¦ªà§à¦¯à¦¾à¦¨à§‡à¦²', 'admin_menu')]);
    }

    ctx.reply('à¦¸à§à¦¬à¦¾à¦—à¦¤à¦®! à¦¨à¦¿à¦šà§‡à¦° à¦…à¦ªà¦¶à¦¨à¦—à§à¦²à§‹ à¦¥à§‡à¦•à§‡ à¦†à¦ªà¦¨à¦¾à¦° à¦ªà§à¦°à§Ÿà§‹à¦œà¦¨à§€à§Ÿ à¦•à¦¾à¦œà¦Ÿà¦¿ à¦¬à§‡à¦›à§‡ à¦¨à¦¿à¦¨:', Markup.inlineKeyboard(keyboard));
}

bot.action('admin_menu', async (ctx) => {
    if (ctx.from.id !== ADMIN_TELEGRAM_ID) return ctx.answerCbQuery('à¦…à¦¨à§à¦®à¦¤à¦¿ à¦¨à§‡à¦‡!', { show_alert: true });

    await ctx.editMessageText(
        'Al-Huda Task Admin Control Panel\n\nà¦¨à¦¿à¦šà§‡à¦° à¦…à¦ªà¦¶à¦¨à¦—à§à¦²à§‹ à¦¬à§à¦¯à¦¬à¦¹à¦¾à¦° à¦•à¦°à§‡ à¦ªà§à¦°à§‹ à¦¬à¦Ÿ à¦•à¦¨à§à¦Ÿà§à¦°à§‹à¦² à¦•à¦°à§à¦¨:',
        Markup.inlineKeyboard([
            [Markup.button.callback('ðŸ“Š à¦®à§‹à¦Ÿ à¦‡à¦‰à¦œà¦¾à¦° à¦²à¦¿à¦¸à§à¦Ÿ', 'admin_user_list')],
            [Markup.button.callback('ðŸ“¢ à¦¸à¦¬à¦¾à¦‡à¦•à§‡ à¦¨à§‹à¦Ÿà¦¿à¦¶ à¦ªà¦¾à¦ à¦¾à¦¨ (Broadcast)', 'admin_broadcast_prompt')],
            [Markup.button.callback('âœ‰ï¸ à¦¨à¦¿à¦°à§à¦¦à¦¿à¦·à§à¦Ÿ à¦‡à¦‰à¦œà¦¾à¦°à¦•à§‡ à¦®à§‡à¦¸à§‡à¦œ à¦ªà¦¾à¦ à¦¾à¦¨', 'admin_msg_prompt')],
            [Markup.button.callback('ðŸš« à¦‡à¦‰à¦œà¦¾à¦° à¦¬à§à¦¯à¦¾à¦¨/à¦¬à§‡à¦° à¦•à¦°à§‡ à¦¦à¦¿à¦¨', 'admin_ban_prompt')],
            [Markup.button.callback('ðŸ”™ à¦®à§‚à¦² à¦®à§‡à¦¨à§à¦¤à§‡ à¦«à¦¿à¦°à§à¦¨', 'back_home')]
        ])
    );
});

bot.action('admin_user_list', async (ctx) => {
    if (ctx.from.id !== ADMIN_TELEGRAM_ID) return;
    const users = await User.find({});
    let text = `ðŸ“Š à¦®à§‹à¦Ÿ à¦°à§‡à¦œà¦¿à¦¸à§à¦Ÿà¦¾à¦°à§à¦¡ à¦‡à¦‰à¦œà¦¾à¦°: ${users.length} à¦œà¦¨\n\n`;
    users.forEach((u, index) => {
        text += `${index + 1}. ${u.firstName} (ID: \`${u.telegramId}\`)\n`;
    });
    
    if (text.length > 4096) text = text.substring(0, 4000) + '\n...à¦¤à¦¾à¦²à¦¿à¦•à¦¾ à¦¦à§€à¦°à§à¦˜ à¦¹à¦“à§Ÿà¦¾à§Ÿ à¦¸à¦‚à¦•à§à¦·à§‡à¦ª à¦•à¦°à¦¾ à¦¹à¦²à§‹à¥¤';
    
    await ctx.editMessageText(text, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([[Markup.button.callback('â¬…ï¸ à¦¬à§à¦¯à¦¾à¦•', 'admin_menu')]])
    });
});

bot.action('admin_broadcast_prompt', async (ctx) => {
    if (ctx.from.id !== ADMIN_TELEGRAM_ID) return;
    await ctx.editMessageText(
        'ðŸ“¢ à¦¸à¦•à¦² à¦‡à¦‰à¦œà¦¾à¦°à§‡à¦° à¦•à¦¾à¦›à§‡ à¦¨à§‹à¦Ÿà¦¿à¦¶ à¦ªà¦¾à¦ à¦¾à¦¤à§‡ à¦šà§à¦¯à¦¾à¦Ÿà§‡ à¦à¦‡ à¦•à¦®à¦¾à¦¨à§à¦¡à¦Ÿà¦¿ à¦²à¦¿à¦–à§à¦¨:\n\n/broadcast à¦†à¦ªà¦¨à¦¾à¦° à¦¨à§‹à¦Ÿà¦¿à¦¶à§‡à¦° à¦²à§‡à¦–à¦¾',
        Markup.inlineKeyboard([[Markup.button.callback('â¬…ï¸ à¦¬à§à¦¯à¦¾à¦•', 'admin_menu')]])
    );
});

bot.action('admin_msg_prompt', async (ctx) => {
    if (ctx.from.id !== ADMIN_TELEGRAM_ID) return;
    await ctx.editMessageText(
        'âœ‰ï¸ à¦¨à¦¿à¦°à§à¦¦à¦¿à¦·à§à¦Ÿ à¦•à§‹à¦¨à§‹ à¦‡à¦‰à¦œà¦¾à¦°à¦•à§‡ à¦®à§‡à¦¸à§‡à¦œ à¦ªà¦¾à¦ à¦¾à¦¤à§‡ à¦šà§à¦¯à¦¾à¦Ÿà§‡ à¦à¦‡ à¦•à¦®à¦¾à¦¨à§à¦¡à¦Ÿà¦¿ à¦²à¦¿à¦–à§à¦¨:\n\n/sendmsg [à¦‡à¦‰à¦œà¦¾à¦°_à¦†à¦‡à¦¡à¦¿] [à¦†à¦ªà¦¨à¦¾à¦°_à¦®à§‡à¦¸à§‡à¦œ]',
        Markup.inlineKeyboard([[Markup.button.callback('â¬…ï¸ à¦¬à§à¦¯à¦¾à¦•', 'admin_menu')]])
    );
});

bot.action('admin_ban_prompt', async (ctx) => {
    if (ctx.from.id !== ADMIN_TELEGRAM_ID) return;
    await ctx.editMessageText(
        'ðŸš« à¦•à§‹à¦¨à§‹ à¦‡à¦‰à¦œà¦¾à¦°à¦•à§‡ à¦¬à¦Ÿà¦•à§‡ à¦¬à§à¦¯à¦¾à¦¨ à¦¬à¦¾ à¦¬à¦¾à¦¦ à¦¦à¦¿à¦¤à§‡ à¦šà§à¦¯à¦¾à¦Ÿà§‡ à¦à¦‡ à¦•à¦®à¦¾à¦¨à§à¦¡à¦Ÿà¦¿ à¦²à¦¿à¦–à§à¦¨:\n\n/ban [à¦‡à¦‰à¦œà¦¾à¦°_à¦†à¦‡à¦¡à¦¿]',
        Markup.inlineKeyboard([[Markup.button.callback('â¬…ï¸ à¦¬à§à¦¯à¦¾à¦•', 'admin_menu')]])
    );
});

bot.action('back_home', async (ctx) => {
    await ctx.deleteMessage();
    sendMainMenu(ctx, ctx.from.id === ADMIN_TELEGRAM_ID);
});

bot.command('broadcast', async (ctx) => {
    if (ctx.from.id !== ADMIN_TELEGRAM_ID) return;
    const msg = ctx.message.text.replace('/broadcast', '').trim();
    if (!msg) return ctx.reply('à¦¦à§Ÿà¦¾ à¦•à¦°à§‡ à¦®à§‡à¦¸à§‡à¦œ à¦²à¦¿à¦–à§à¦¨à¥¤');

    const users = await User.find({});
    let count = 0;
    for (const u of users) {
        try {
            await bot.telegram.sendMessage(u.telegramId, `ðŸ“¢ à¦…à¦«à¦¿à¦¸à¦¿à§Ÿà¦¾à¦² à¦¨à§‹à¦Ÿà¦¿à¦¶:\n\n${msg}`);
            count++;
        } catch (e) {}
    }
    ctx.reply(`à¦¸à¦«à¦²à¦­à¦¾à¦¬à§‡ ${count} à¦œà¦¨à§‡à¦° à¦•à¦¾à¦›à§‡ à¦¨à§‹à¦Ÿà¦¿à¦¶ à¦ªà¦¾à¦ à¦¾à¦¨à§‹ à¦¹à§Ÿà§‡à¦›à§‡à¥¤`);
});

bot.command('sendmsg', async (ctx) => {
    if (ctx.from.id !== ADMIN_TELEGRAM_ID) return;
    const args = ctx.message.text.split(' ');
    const targetId = args[1];
    const message = args.slice(2).join(' ');

    if (!targetId || !message) {
        return ctx.reply('à¦¸à¦ à¦¿à¦• à¦¨à¦¿à§Ÿà¦®à§‡ à¦²à¦¿à¦–à§à¦¨: /sendmsg [ID] [Message]');
    }

    try {
        await bot.telegram.sendMessage(targetId, `ðŸ“© à¦…à§à¦¯à¦¾à¦¡à¦®à¦¿à¦¨à§‡à¦° à¦¬à¦¾à¦°à§à¦¤à¦¾:\n\n${message}`);
        ctx.reply(`à¦‡à¦‰à¦œà¦¾à¦° ${targetId} à¦à¦° à¦•à¦¾à¦›à§‡ à¦®à§‡à¦¸à§‡à¦œ à¦¸à¦«à¦²à¦­à¦¾à¦¬à§‡ à¦ªà¦¾à¦ à¦¾à¦¨à§‹ à¦¹à§Ÿà§‡à¦›à§‡à¥¤`);
    } catch (e) {
        ctx.reply('à¦®à§‡à¦¸à§‡à¦œ à¦ªà¦¾à¦ à¦¾à¦¨à§‹ à¦¬à§à¦¯à¦°à§à¦¥ à¦¹à§Ÿà§‡à¦›à§‡à¥¤ à¦‡à¦‰à¦œà¦¾à¦° à¦¸à¦®à§à¦­à¦¬à¦¤ à¦¬à¦Ÿ à¦¬à§à¦²à¦• à¦•à¦°à§‡à¦›à§‡ à¦¬à¦¾ à¦†à¦‡à¦¡à¦¿ à¦­à§à¦²à¥¤');
    }
});

bot.command('ban', async (ctx) => {
    if (ctx.from.id !== ADMIN_TELEGRAM_ID) return;
    const targetId = ctx.message.text.split(' ')[1];
    if (!targetId) return ctx.reply('à¦‡à¦‰à¦œà¦¾à¦° à¦†à¦‡à¦¡à¦¿ à¦¦à¦¿à¦¨à¥¤ à¦¯à§‡à¦®à¦¨: /ban 123456789');

    const result = await User.deleteOne({ telegramId: Number(targetId) });
    if (result.deletedCount > 0) {
        ctx.reply(`à¦‡à¦‰à¦œà¦¾à¦° ${targetId} à¦•à§‡ à¦¡à¦¾à¦Ÿà¦¾à¦¬à§‡à¦œ à¦“ à¦¬à¦Ÿ à¦¥à§‡à¦•à§‡ à¦¸à¦«à¦²à¦­à¦¾à¦¬à§‡ à¦…à¦ªà¦¸à¦¾à¦°à¦£ à¦•à¦°à¦¾ à¦¹à§Ÿà§‡à¦›à§‡à¥¤`);
    } else {
        ctx.reply('à¦à¦‡ à¦†à¦‡à¦¡à¦¿ à¦¦à¦¿à§Ÿà§‡ à¦•à§‹à¦¨à§‹ à¦‡à¦‰à¦œà¦¾à¦° à¦ªà¦¾à¦“à§Ÿà¦¾ à¦¯à¦¾à§Ÿà¦¨à¦¿à¥¤');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
    console.log(`Server is running on port ${PORT}`);
    if (RENDER_EXTERNAL_URL) {
        const webhookUrl = `${RENDER_EXTERNAL_URL}/webhook/${BOT_TOKEN}`;
        await bot.telegram.setWebhook(webhookUrl);
        console.log(`Webhook set to: ${webhookUrl}`);
    }
});
