const { Markup } = require('telegraf');
const mongoose = require('mongoose');

const ADMIN_TELEGRAM_ID = 7689311203;

// Mongoose Models Safe Retrieval
const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({
    telegramId: Number,
    firstName: String,
    username: String,
    balance: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 },
    totalWithdraw: { type: Number, default: 0 },
    totalReferrals: { type: Number, default: 0 },
    isBlocked: { type: Boolean, default: false },
    joinedAt: { type: Date, default: Date.now }
}));

const Account = mongoose.models.Account || mongoose.model('Account', new mongoose.Schema({
    platform: String,
    accountData: String,
    isUsed: { type: Boolean, default: false },
    usedBy: Number,
    createdAt: { type: Date, default: Date.now }
}));

// ১. অ্যাডমিন কিবোর্ড
function getAdminMenu() {
    return Markup.keyboard([
        ['📸 ইনস্টা ম্যানেজমেন্ট', '📧 জিমেইল ম্যানেজমেন্ট'],
        ['📘 ফেসবুক ম্যানেজমেন্ট', '🐦 টুইটার (X) ম্যানেজমেন্ট'],
        ['💰 উইথড্র ম্যানেজমেন্ট', '💵 ইউজার ব্যালেন্স ম্যানেজমেন্ট'],
        ['👥 সকল ইউজার লিস্ট', '🏆 শীর্ষ রেফারেল লিস্ট'],
        ['🚫 ব্লক/আনব্লক ইউজার', '📢 অল ইউজার ব্রডকাস্ট'],
        ['✉️ সিঙ্গেল ইউজার মেসেজ', '🔙 ইউজার প্যানেল']
    ]).resize();
}

// ২. ইউজার কিবোর্ড
function getMainMenu(isAdmin = false) {
    const userButtons = [
        ['📸 ইনস্টাগ্রাম কাজ', '📧 জিমেইল কাজ'],
        ['📘 ফেসবুক কাজ', '🐦 টুইটার (X) কাজ'],
        ['👤 প্রোফাইল', '💳 উইথড্র'],
        ['📢 অফিশিয়াল সাপোর্ট']
    ];

    if (isAdmin) {
        userButtons.push(['👑 অ্যাডমিন প্যানেল']);
    }

    return Markup.keyboard(userButtons).resize();
}

// ৩. অ্যাডমিন প্যানেল ওপেন
async function showAdminPanel(ctx) {
    if (!ctx.from || Number(ctx.from.id) !== Number(ADMIN_TELEGRAM_ID)) return;
    return ctx.reply('👑 **অ্যাডমিন কন্ট্রোল প্যানেলে আপনাকে স্বাগতম!**\n\nনিচের বাটনগুলো দিয়ে বটের সার্বিক কার্যকলাপ পরিচালনা করুন:', {
        parse_mode: 'Markdown',
        ...getAdminMenu()
    });
}

// ৪. ইউজার প্যানেলে ব্যাক করা
async function showUserPanel(ctx) {
    if (!ctx.from) return;
    const isAdmin = Number(ctx.from.id) === Number(ADMIN_TELEGRAM_ID);
    return ctx.reply('🔙 **ইউজার প্যানেলে ফিরে এসেছেন।**', getMainMenu(isAdmin));
}

// ৫. সকল ইউজার লিস্ট
async function handleAllUsersList(ctx) {
    if (!ctx.from || Number(ctx.from.id) !== Number(ADMIN_TELEGRAM_ID)) return;
    try {
        const users = await User.find().sort({ joinedAt: -1 }).limit(30);
        const total = await User.countDocuments();
        let msg = `📊 **মোট ইউজার সংখ্যা:** ${total} জন\n\n**সাম্প্রতিক ইউজারগণ:**\n`;

        users.forEach((u, index) => {
            msg += `${index + 1}. ${u.firstName || 'User'} (\`${u.telegramId}\`) - ৳${u.balance || 0} ${u.isBlocked ? '❌ [ব্লকড]' : '✅'}\n`;
        });

        return ctx.reply(msg, { parse_mode: 'Markdown' });
    } catch (err) {
        console.error('All Users Error:', err);
        return ctx.reply('❌ ইউজার লিস্ট আনতে সমস্যা হয়েছে।');
    }
}

// ৬. শীর্ষ রেফারেল লিস্ট
async function handleTopReferrals(ctx) {
    if (!ctx.from || Number(ctx.from.id) !== Number(ADMIN_TELEGRAM_ID)) return;
    try {
        const topUsers = await User.find().sort({ totalReferrals: -1 }).limit(15);
        let msg = `🏆 **শীর্ষ ১৫ জন রেফারেলকারী:**\n\n`;

        topUsers.forEach((u, i) => {
            msg += `${i + 1}. ${u.firstName || 'User'} (\`${u.telegramId}\`) ➔ মোট রেফার: **${u.totalReferrals || 0}** জন\n`;
        });

        return ctx.reply(msg, { parse_mode: 'Markdown' });
    } catch (err) {
        console.error('Top Referrals Error:', err);
        return ctx.reply('❌ রেফারেল লিস্ট আনতে সমস্যা হয়েছে।');
    }
}

// ৭. প্ল্যাটফর্ম স্টক তথ্য
async function handlePlatformStock(ctx, platformName) {
    if (!ctx.from || Number(ctx.from.id) !== Number(ADMIN_TELEGRAM_ID)) return;
    try {
        const pName = platformName.toLowerCase();
        const available = await Account.countDocuments({ platform: pName, isUsed: false });
        const used = await Account.countDocuments({ platform: pName, isUsed: true });

        return ctx.reply(
            `📦 **${platformName} স্টক বিবরণ:**\n\n` +
            `🔹 খালি স্টক: **${available}** টি\n` +
            `🔹 ব্যবহৃত স্টক: **${used}** টি\n\n` +
            `💡 নতুন স্টক যোগ করতে ফরম্যাট:\n\`/add${pName} user1:pass1 user2:pass2\``,
            { parse_mode: 'Markdown' }
        );
    } catch (err) {
        console.error('Platform Stock Error:', err);
        return ctx.reply('❌ স্টক ডেটা আনতে সমস্যা হয়েছে।');
    }
}

// ৮. ইউজার ব্লক করার ফাংশন (/block <id>)
async function handleBlockUser(ctx) {
    if (!ctx.from || Number(ctx.from.id) !== Number(ADMIN_TELEGRAM_ID)) return;
    const parts = ctx.message.text.split(' ');
    const targetId = parts[1];

    if (!targetId) return ctx.reply('⚠️ ব্যবহার: `/block <telegram_id>`', { parse_mode: 'Markdown' });

    await User.updateOne({ telegramId: Number(targetId) }, { isBlocked: true });
    return ctx.reply(`🚫 ইউজার \`${targetId}\` সফলভাবে ব্লক করা হয়েছে!`, { parse_mode: 'Markdown' });
}

// ৯. ইউজার আনব্লক করা (/unblock <id>)
async function handleUnblockUser(ctx) {
    if (!ctx.from || Number(ctx.from.id) !== Number(ADMIN_TELEGRAM_ID)) return;
    const parts = ctx.message.text.split(' ');
    const targetId = parts[1];

    if (!targetId) return ctx.reply('⚠️ ব্যবহার: `/unblock <telegram_id>`', { parse_mode: 'Markdown' });

    await User.updateOne({ telegramId: Number(targetId) }, { isBlocked: false });
    return ctx.reply(`✅ ইউজার \`${targetId}\` আনব্লক করা হয়েছে!`, { parse_mode: 'Markdown' });
}

// ১০. ইউজার ব্যালেন্স এডিট (/setbalance <id> <amount>)
async function handleSetBalance(ctx) {
    if (!ctx.from || Number(ctx.from.id) !== Number(ADMIN_TELEGRAM_ID)) return;
    const parts = ctx.message.text.split(' ');
    const targetId = parts[1];
    const newBalance = parts[2];

    if (!targetId || !newBalance) {
        return ctx.reply('⚠️ ব্যবহার: `/setbalance <telegram_id> <amount>`', { parse_mode: 'Markdown' });
    }

    await User.updateOne({ telegramId: Number(targetId) }, { balance: Number(newBalance) });
    return ctx.reply(`💰 ইউজার \`${targetId}\`-এর নতুন ব্যালেন্স **৳${newBalance}** করা হয়েছে!`, { parse_mode: 'Markdown' });
}

// ১১. অল ইউজার ব্রডকাস্ট (/broadcast <msg>)
async function handleBroadcast(ctx) {
    if (!ctx.from || Number(ctx.from.id) !== Number(ADMIN_TELEGRAM_ID)) return;
    const broadcastMsg = ctx.message.text.replace('/broadcast', '').trim();

    if (!broadcastMsg) {
        return ctx.reply('⚠️ ব্যবহার: `/broadcast আপনার মেসেজ এখানে লিখুন`', { parse_mode: 'Markdown' });
    }

    const users = await User.find({}, 'telegramId');
    let success = 0;
    let failed = 0;

    await ctx.reply(`📢 ${users.length} জন ইউজারের কাছে নোটিশ পাঠানো শুরু হচ্ছে...`);

    for (const u of users) {
        try {
            await ctx.telegram.sendMessage(u.telegramId, `📢 **অফিশিয়াল নোটিশ:**\n\n${broadcastMsg}`, { parse_mode: 'Markdown' });
            success++;
        } catch (e) {
            failed++;
        }
    }

    return ctx.reply(`✅ **ব্রডকাস্ট সম্পন্ন!**\n\n✔ সফল: ${success} জন\n✖ ব্যর্থ: ${failed} জন`);
}

// ১২. নির্দিষ্ট ইউজারকে মেসেজ দেওয়া (/sendmessage <id> <msg>)
async function handleSingleMessage(ctx) {
    if (!ctx.from || Number(ctx.from.id) !== Number(ADMIN_TELEGRAM_ID)) return;
    const parts = ctx.message.text.split(' ');
    const targetId = parts[1];
    const textMsg = parts.slice(2).join(' ');

    if (!targetId || !textMsg) {
        return ctx.reply('⚠️ ব্যবহার: `/sendmessage <telegram_id> আপনার মেসেজ`', { parse_mode: 'Markdown' });
    }

    try {
        await ctx.telegram.sendMessage(Number(targetId), `📩 **এডমিন থেকে মেসেজ:**\n\n${textMsg}`, { parse_mode: 'Markdown' });
        return ctx.reply(`✅ ইউজার \`${targetId}\`-এর কাছে মেসেজটি পাঠানো হয়েছে!`, { parse_mode: 'Markdown' });
    } catch (err) {
        return ctx.reply('❌ মেসেজটি পাঠানো যায়নি।');
    }
}

module.exports = {
    showAdminPanel,
    showUserPanel,
    handleAllUsersList,
    handleTopReferrals,
    handlePlatformStock,
    handleBlockUser,
    handleUnblockUser,
    handleSetBalance,
    handleBroadcast,
    handleSingleMessage
};
