require('dotenv').config();
const { Telegraf } = require('telegraf');
const mongoose = require('mongoose');

// ডাটাবেজ কানেকশন কনফিগারেশন
const connectDB = require('./config/db');

// হ্যান্ডলার ফাইল ইম্পোর্ট
const adminHandler = require('./handlers/adminHandler');

// বট ইনস্ট্যান্স তৈরি
const bot = new Telegraf(process.env.BOT_TOKEN);

// এডমিন টেলিগ্রাম আইডি
const ADMIN_TELEGRAM_ID = 7689311203;

// Mongoose User Schema (Safe Fallback)
const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({
    telegramId: Number,
    firstName: String,
    username: String,
    balance: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 },
    totalWithdraw: { type: Number, default: 0 },
    totalReferrals: { type: Number, default: 0 },
    referredBy: { type: Number, default: null },
    isBlocked: { type: Boolean, default: false },
    joinedAt: { type: Date, default: Date.now }
}));

// ১. ডাটাবেজ কানেক্ট করা
connectDB();

// ==========================================
// 🚀 স্টার্ট কমান্ড (/start)
// ==========================================
bot.start(async (ctx) => {
    try {
        const telegramId = ctx.from.id;
        const firstName = ctx.from.first_name || 'User';
        const username = ctx.from.username || '';
        const startPayload = ctx.startPayload; // রেফারেল আইডি

        let user = await User.findOne({ telegramId });

        // নতুন ইউজার রেজিস্টার
        if (!user) {
            let referrerId = null;
            if (startPayload && !isNaN(startPayload) && Number(startPayload) !== telegramId) {
                const referrer = await User.findOne({ telegramId: Number(startPayload) });
                if (referrer) {
                    referrerId = referrer.telegramId;
                    await User.updateOne({ telegramId: referrer.telegramId }, { $inc: { totalReferrals: 1 } });
                }
            }

            user = new User({
                telegramId,
                firstName,
                username,
                referredBy: referrerId
            });
            await user.save();
        }

        // ইউজার ব্লকড থাকলে সার্ভিস বন্ধ
        if (user.isBlocked) {
            return ctx.reply('❌ আপনার অ্যাকাউন্টটি সাময়িকভাবে ব্লক করা হয়েছে। সহায়তার জন্য অ্যাডমিনের সাথে যোগাযোগ করুন।');
        }

        const isAdmin = Number(telegramId) === Number(ADMIN_TELEGRAM_ID);

        // শুভেচ্ছা বার্তা
        return ctx.reply(
            `👋 **হ্যালো, ${firstName}!**\n\n` +
            `**AL-HUDA TASK** বোটে আপনাকে স্বাগতম। এখান থেকে আপনি সোশাল মিটিয়া টাস্ক সম্পন্ন করে টাকা আয় করতে পারবেন।\n\n` +
            `💰 **আপনার বর্তমান ব্যালেন্স:** ৳${user.balance || 0}\n` +
            `👥 **মোট রেফারেল:** ${user.totalReferrals || 0} জন\n\n` +
            `কাজ শুরু করতে নিচের বাটনগুলো ব্যবহার করুন:`,
            {
                parse_mode: 'Markdown',
                ...adminHandler.showUserPanel ? await adminHandler.showUserPanel(ctx) : {}
            }
        );

    } catch (error) {
        console.error('Start Command Error:', error);
        return ctx.reply('⚠️ একটি সমস্যা দেখা দিয়েছে! অনুগ্রহ করে আবার চেষ্টা করুন।');
    }
});

// ==========================================
// 👑 এডমিন প্যানেল নেভিগেশন ও একশন
// ==========================================
bot.hears('👑 অ্যাডমিন প্যানেল', adminHandler.showAdminPanel);
bot.hears('🔙 ইউজার প্যানেল', adminHandler.showUserPanel);
bot.hears('👥 সকল ইউজার লিস্ট', adminHandler.handleAllUsersList);
bot.hears('🏆 শীর্ষ রেফারেল লিস্ট', adminHandler.handleTopReferrals);

// স্টক ও প্ল্যাটফর্ম ম্যানেজমেন্ট
bot.hears('📸 ইনস্টা ম্যানেজমেন্ট', (ctx) => adminHandler.handlePlatformStock(ctx, 'Instagram'));
bot.hears('📧 জিমেইল ম্যানেজমেন্ট', (ctx) => adminHandler.handlePlatformStock(ctx, 'Gmail'));
bot.hears('📘 ফেসবুক ম্যানেজমেন্ট', (ctx) => adminHandler.handlePlatformStock(ctx, 'Facebook'));
bot.hears('🐦 টুইটার (X) ম্যানেজমেন্ট', (ctx) => adminHandler.handlePlatformStock(ctx, 'Twitter'));

// এডমিন ইউটিলিটি গাইড বাটন
bot.hears('💰 উইথড্র ম্যানেজমেন্ট', (ctx) => {
    if (Number(ctx.from.id) !== ADMIN_TELEGRAM_ID) return;
    return ctx.reply('💳 **প্যান্ডিং উইথড্র সার্ভিস প্রসেসিং অবস্থায় আছে।**');
});

bot.hears('💵 ইউজার ব্যালেন্স ম্যানেজমেন্ট', (ctx) => {
    if (Number(ctx.from.id) !== ADMIN_TELEGRAM_ID) return;
    return ctx.reply('💡 **ইউজার ব্যালেন্স আপডেট করতে লিখুন:**\n\`/setbalance <telegram_id> <amount>\`', { parse_mode: 'Markdown' });
});

bot.hears('🚫 ব্লক/আনব্লক ইউজার', (ctx) => {
    if (Number(ctx.from.id) !== ADMIN_TELEGRAM_ID) return;
    return ctx.reply('💡 **ইউজার ব্লক বা আনব্লক করতে লিখুন:**\n\`/block <telegram_id>\`\n\`/unblock <telegram_id>\`', { parse_mode: 'Markdown' });
});

bot.hears('📢 অল ইউজার ব্রডকাস্ট', (ctx) => {
    if (Number(ctx.from.id) !== ADMIN_TELEGRAM_ID) return;
    return ctx.reply('💡 **সকল ইউজারকে মেসেজ পাঠাতে লিখুন:**\n\`/broadcast আপনার নোটিশের টেক্সট...\`', { parse_mode: 'Markdown' });
});

bot.hears('✉️ সিঙ্গেল ইউজার মেসেজ', (ctx) => {
    if (Number(ctx.from.id) !== ADMIN_TELEGRAM_ID) return;
    return ctx.reply('💡 **নির্দিষ্ট ইউজারকে মেসেজ দিতে লিখুন:**\n\`/sendmessage <telegram_id> আপনার বার্তা...\`', { parse_mode: 'Markdown' });
});

// ==========================================
// ⚡ এডমিন টেক্সট কমান্ডসমূহ
// ==========================================
bot.command('block', adminHandler.handleBlockUser);
bot.command('unblock', adminHandler.handleUnblockUser);
bot.command('setbalance', adminHandler.handleSetBalance);
bot.command('broadcast', adminHandler.handleBroadcast);
bot.command('sendmessage', adminHandler.handleSingleMessage);

// ==========================================
// 👤 ইউজার বাটন একশনসমূহ
// ==========================================
bot.hears('📸 ইনস্টাগ্রাম কাজ', (ctx) => ctx.reply('📸 **ইনস্টাগ্রাম কাজ শীঘ্রই চালু হচ্ছে!**'));
bot.hears('📧 জিমেইল কাজ', (ctx) => ctx.reply('📧 **জিমেইল কাজ শীঘ্রই চালু হচ্ছে!**'));
bot.hears('📘 ফেসবুক কাজ', (ctx) => ctx.reply('📘 **ফেসবুক কাজ শীঘ্রই চালু হচ্ছে!**'));
bot.hears('🐦 টুইটার (X) কাজ', (ctx) => ctx.reply('🐦 **টুইটার (X) কাজ শীঘ্রই চালু হচ্ছে!**'));

bot.hears('👤 প্রোফাইল', async (ctx) => {
    try {
        const user = await User.findOne({ telegramId: ctx.from.id });
        if (!user) return ctx.reply('⚠️ ইউজার প্রোফাইল পাওয়া যায়নি।');

        const refLink = `https://t.me/${ctx.botInfo.username}?start=${user.telegramId}`;

        return ctx.reply(
            `👤 **আপনার প্রোফাইল তথ্য:**\n\n` +
            `🆔 **টেলিগ্রাম আইডি:** \`${user.telegramId}\`\n` +
            `💰 **মোট ব্যালেন্স:** ৳${user.balance || 0}\n` +
            `💵 **মোট আয়:** ৳${user.totalEarnings || 0}\n` +
            `💳 **মোট উইথড্র:** ৳${user.totalWithdraw || 0}\n` +
            `👥 **মোট রেফারেল:** ${user.totalReferrals || 0} জন\n\n` +
            `🔗 **আপনার রেফারেল লিংক:**\n${refLink}`,
            { parse_mode: 'Markdown' }
        );
    } catch (e) {
        return ctx.reply('❌ প্রোফাইল লোড করতে সমস্যা হয়েছে।');
    }
});

bot.hears('💳 উইথড্র', (ctx) => {
    return ctx.reply('💳 **উইথড্র সিস্টেম:** সর্বনিম্ন ৳৫০ হলে বিকাশ/নগদে উত্তোলন করতে পারবেন।');
});

bot.hears('📢 অফিশিয়াল সাপোর্ট', (ctx) => {
    return ctx.reply('📢 কোনো সমস্যা বা আলোচনার জন্য আমাদের অফিশিয়াল চ্যানেলে যুক্ত থাকুন অথবা এডমিনকে মেসেজ দিন।');
});

// ==========================================
// 🌐 বট লঞ্চ ও হ্যান্ডলিং
// ==========================================
bot.launch()
    .then(() => console.log('🤖 Bot is successfully running...'))
    .catch((err) => console.error('Bot launch error:', err));

// গ্রেসফুল শাটডাউন
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
