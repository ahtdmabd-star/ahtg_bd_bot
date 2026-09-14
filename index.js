// dotenv না থাকলে যেন কোড ক্র্যাশ না করে
try {
    require('dotenv').config();
} catch (e) {
    console.log('dotenv package not found, using system environment variables.');
}

const { Telegraf } = require('telegraf');
const connectDB = require('./config/db');
const User = require('./models/User');
const adminHandler = require('./handlers/adminHandler');

// বট ইনস্ট্যান্স
const bot = new Telegraf(process.env.BOT_TOKEN);
const ADMIN_TELEGRAM_ID = 7689311203;

// ডাটাবেজ কানেকশন
connectDB();

// ==========================================
// 🚀 স্টার্ট কমান্ড (/start)
// ==========================================
bot.start(async (ctx) => {
    try {
        const telegramId = ctx.from.id;
        const firstName = ctx.from.first_name || 'User';
        const username = ctx.from.username || '';
        const startPayload = ctx.startPayload;

        let user = await User.findOne({ telegramId });

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

        if (user.isBlocked) {
            return ctx.reply('❌ আপনার অ্যাকাউন্টটি সাময়িকভাবে ব্লক করা হয়েছে।');
        }

        const isAdmin = Number(telegramId) === Number(ADMIN_TELEGRAM_ID);

        return ctx.reply(
            `👋 **হ্যালো, ${firstName}!**\n\n` +
            `**AL-HUDA TASK** বোটে আপনাকে স্বাগতম।\n\n` +
            `💰 **ব্যালেন্স:** ৳${user.balance || 0}\n` +
            `👥 **রেফারেল:** ${user.totalReferrals || 0} জন\n\n` +
            `কাজ শুরু করতে নিচের বাটন ব্যবহার করুন:`,
            {
                parse_mode: 'Markdown',
                ...adminHandler.showUserPanel(ctx)
            }
        );
    } catch (error) {
        console.error('Start Command Error:', error);
        return ctx.reply('⚠️ একটি সমস্যা দেখা দিয়েছে! আবার চেষ্টা করুন।');
    }
});

// ==========================================
// 👑 অ্যাডমিন প্যানেল ইভেন্ট
// ==========================================
bot.hears('👑 অ্যাডমিন প্যানেল', adminHandler.showAdminPanel);
bot.hears('🔙 ইউজার প্যানেল', adminHandler.showUserPanel);
bot.hears('👥 সকল ইউজার লিস্ট', adminHandler.handleAllUsersList);
bot.hears('🏆 শীর্ষ রেফারেল লিস্ট', adminHandler.handleTopReferrals);

bot.hears('📸 ইনস্টা ম্যানেজমেন্ট', (ctx) => adminHandler.handlePlatformStock(ctx, 'Instagram'));
bot.hears('📧 জিমেইল ম্যানেজমেন্ট', (ctx) => adminHandler.handlePlatformStock(ctx, 'Gmail'));
bot.hears('📘 ফেসবুক ম্যানেজমেন্ট', (ctx) => adminHandler.handlePlatformStock(ctx, 'Facebook'));
bot.hears('🐦 টুইটার (X) ম্যানেজমেন্ট', (ctx) => adminHandler.handlePlatformStock(ctx, 'Twitter'));

bot.hears('💰 উইথড্র ম্যানেজমেন্ট', (ctx) => ctx.reply('💳 প্যান্ডিং উইথড্র সার্ভিস প্রসেসিং অবস্থায় আছে।'));
bot.hears('💵 ইউজার ব্যালেন্স ম্যানেজমেন্ট', (ctx) => ctx.reply('💡 লিখতে ব্যবহার করুন: `/setbalance <telegram_id> <amount>`', { parse_mode: 'Markdown' }));
bot.hears('🚫 ব্লক/আনব্লক ইউজার', (ctx) => ctx.reply('💡 লিখতে ব্যবহার করুন: `/block <telegram_id>` বা `/unblock <telegram_id>`', { parse_mode: 'Markdown' }));
bot.hears('📢 অল ইউজার ব্রডকাস্ট', (ctx) => ctx.reply('💡 লিখতে ব্যবহার করুন: `/broadcast আপনার বার্তা...`', { parse_mode: 'Markdown' }));
bot.hears('✉️ সিঙ্গেল ইউজার মেসেজ', (ctx) => ctx.reply('💡 লিখতে ব্যবহার করুন: `/sendmessage <telegram_id> আপনার বার্তা...`', { parse_mode: 'Markdown' }));

// অ্যাডমিন কমান্ড
bot.command('block', adminHandler.handleBlockUser);
bot.command('unblock', adminHandler.handleUnblockUser);
bot.command('setbalance', adminHandler.handleSetBalance);
bot.command('broadcast', adminHandler.handleBroadcast);
bot.command('sendmessage', adminHandler.handleSingleMessage);

// ==========================================
// 👤 ইউজার বাটন ইভেন্ট
// ==========================================
bot.hears('📸 ইনস্টাগ্রাম কাজ', (ctx) => ctx.reply('📸 ইনস্টাগ্রাম কাজ স্টকে আসার পর চেক করুন।'));
bot.hears('📧 জিমেইল কাজ', (ctx) => ctx.reply('📧 জিমেইল কাজ স্টকে আসার পর চেক করুন।'));
bot.hears('📘 ফেসবুক কাজ', (ctx) => ctx.reply('📘 ফেসবুক কাজ স্টকে আসার পর চেক করুন।'));
bot.hears('🐦 টুইটার (X) কাজ', (ctx) => ctx.reply('🐦 টুইটার কাজ স্টকে আসার পর চেক করুন।'));

bot.hears('👤 প্রোফাইল', async (ctx) => {
    try {
        const user = await User.findOne({ telegramId: ctx.from.id });
        if (!user) return ctx.reply('⚠️ ইউজার প্রোফাইল পাওয়া যায়নি।');
        const refLink = `https://t.me/${ctx.botInfo.username}?start=${user.telegramId}`;
        
        return ctx.reply(
            `👤 **আপনার প্রোফাইল তথ্য:**\n\n` +
            `🆔 **আইডি:** \`${user.telegramId}\`\n` +
            `💰 **ব্যালেন্স:** ৳${user.balance || 0}\n` +
            `👥 **রেফারেল:** ${user.totalReferrals || 0} জন\n\n` +
            `🔗 **রেফারেল লিংক:**\n${refLink}`,
            { parse_mode: 'Markdown' }
        );
    } catch (e) {
        return ctx.reply('❌ প্রোফাইল লোড করতে সমস্যা হয়েছে।');
    }
});

bot.hears('💳 উইথড্র', (ctx) => ctx.reply('💳 সর্বনিম্ন ৳৫০ হলে উইথড্র করতে পারবেন।'));
bot.hears('📢 অফিশিয়াল সাপোর্ট', (ctx) => ctx.reply('📢 সাহায্যের জন্য অ্যাডমিনের সাথে যোগাযোগ করুন।'));

// বট রান
bot.launch().then(() => console.log('🤖 Bot successfully launched!'));

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
