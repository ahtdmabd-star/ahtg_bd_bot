const User = require('../models/User');
const Account = require('../models/Account');
const { getAdminMenu } = require('../keyboards/adminMenu');
const { getMainMenu } = require('../keyboards/mainMenu');

const ADMIN_TELEGRAM_ID = 7689311203;

// ১. অ্যাডমিন মেনু ও ইউজার মেনু সুইচার
async function showAdminPanel(ctx) {
    if (Number(ctx.from.id) !== Number(ADMIN_TELEGRAM_ID)) return;
    return ctx.reply('👑 **অ্যাডমিন কন্ট্রোল প্যানেলে আপনাকে স্বাগতম!**\n\nনিচের বাটনগুলো দিয়ে বটের সার্বিক কার্যকলাপ পরিচালনা করুন:', {
        parse_mode: 'Markdown',
        ...getAdminMenu()
    });
}

async function showUserPanel(ctx) {
    const isAdmin = Number(ctx.from.id) === Number(ADMIN_TELEGRAM_ID);
    return ctx.reply('🔙 **ইউজার প্যানেলে ফিরে এসেছেন।**', getMainMenu('bn', isAdmin));
}

// ২. সকল ইউজার লিস্ট
async function handleAllUsersList(ctx) {
    if (Number(ctx.from.id) !== Number(ADMIN_TELEGRAM_ID)) return;
    try {
        const users = await User.find().sort({ joinedAt: -1 }).limit(50);
        const total = await User.countDocuments();
        let msg = `📊 **মোট ইউজার সংখ্যা:** ${total} জন\n\n**সাম্প্রতিক ইউজারগণ:**\n`;

        users.forEach((u, index) => {
            msg += `${index + 1}. ${u.firstName} (${u.telegramId}) - ব্যালেন্স: ৳${u.balance} ${u.isBlocked ? '❌ [ব্লকড]' : '✅'}\n`;
        });

        return ctx.reply(msg, { parse_mode: 'Markdown' });
    } catch (err) {
        console.error(err);
        return ctx.reply('ইউজার লিস্ট আনতে সমস্যা হয়েছে।');
    }
}

// ৩. শীর্ষ রেফারেল লিস্ট
async function handleTopReferrals(ctx) {
    if (Number(ctx.from.id) !== Number(ADMIN_TELEGRAM_ID)) return;
    try {
        const topUsers = await User.find().sort({ totalReferrals: -1 }).limit(20);
        let msg = `🏆 **শীর্ষ ২০ জন রেফারেলকারী:**\n\n`;

        topUsers.forEach((u, i) => {
            msg += `${i + 1}. ${u.firstName} (${u.telegramId}) ➔ মোট রেফার: **${u.totalReferrals}** জন\n`;
        });

        return ctx.reply(msg, { parse_mode: 'Markdown' });
    } catch (err) {
        return ctx.reply('রেফারেল লিস্ট আনতে সমস্যা হয়েছে।');
    }
}

// ৪. প্ল্যাটফর্ম অনুযায়ী স্টক ও কাজের পরিসংখ্যান
async function handlePlatformStock(ctx, platformName) {
    if (Number(ctx.from.id) !== Number(ADMIN_TELEGRAM_ID)) return;
    try {
        const available = await Account.countDocuments({ platform: platformName.toLowerCase(), isUsed: false });
        const used = await Account.countDocuments({ platform: platformName.toLowerCase(), isUsed: true });

        return ctx.reply(
            `📦 **${platformName} স্টক বিবরণ:**\n\n` +
            `🔹 খালি স্টক: **${available}** টি\n` +
            `🔹 ব্যবহৃত স্টক: **${used}** টি\n\n` +
            `💡 নতুন স্টক যোগ করতে লিখুন:\n\`/add${platformName.toLowerCase()} user:pass user2:pass2\``,
            { parse_mode: 'Markdown' }
        );
    } catch (err) {
        return ctx.reply('স্টক ডেটা আনতে সমস্যা হয়েছে।');
    }
}

// ৫. ব্লক/আনব্লক ইউজার কমান্ড (/block /unblock)
async function handleBlockUser(ctx) {
    if (Number(ctx.from.id) !== Number(ADMIN_TELEGRAM_ID)) return;
    const parts = ctx.message.text.split(' ');
    const targetId = parts[1];

    if (!targetId) return ctx.reply('⚠️ ব্যবহার: `/block <telegram_id>`', { parse_mode: 'Markdown' });

    await User.updateOne({ telegramId: Number(targetId) }, { isBlocked: true });
    return ctx.reply(`🚫 ইউজার \`${targetId}\` সফলভাবে ব্লক করা হয়েছে!`, { parse_mode: 'Markdown' });
}

async function handleUnblockUser(ctx) {
    if (Number(ctx.from.id) !== Number(ADMIN_TELEGRAM_ID)) return;
    const parts = ctx.message.text.split(' ');
    const targetId = parts[1];

    if (!targetId) return ctx.reply('⚠️ ব্যবহার: `/unblock <telegram_id>`', { parse_mode: 'Markdown' });

    await User.updateOne({ telegramId: Number(targetId) }, { isBlocked: false });
    return ctx.reply(`✅ ইউজার \`${targetId}\` আনব্লক করা হয়েছে!`, { parse_mode: 'Markdown' });
}

// ৬. ইউজার ব্যালেন্স পরিবর্তন (/setbalance)
async function handleSetBalance(ctx) {
    if (Number(ctx.from.id) !== Number(ADMIN_TELEGRAM_ID)) return;
    const parts = ctx.message.text.split(' ');
    const targetId = parts[1];
    const newBalance = parts[2];

    if (!targetId || !newBalance) {
        return ctx.reply('⚠️ ব্যবহার: `/setbalance <telegram_id> <amount>`', { parse_mode: 'Markdown' });
    }

    await User.updateOne({ telegramId: Number(targetId) }, { balance: Number(newBalance) });
    return ctx.reply(`💰 ইউজার \`${targetId}\`-এর নতুন ব্যালেন্স **৳${newBalance}** করা হয়েছে!`, { parse_mode: 'Markdown' });
}

// ৭. অল ইউজার ব্রডকাস্ট মেসেজ (/broadcast)
async function handleBroadcast(ctx) {
    if (Number(ctx.from.id) !== Number(ADMIN_TELEGRAM_ID)) return;
    const broadcastMsg = ctx.message.text.replace('/broadcast', '').trim();

    if (!broadcastMsg) {
        return ctx.reply('⚠️ ব্যবহার: `/broadcast আপনার মেসেজ এখানে লিখুন`', { parse_mode: 'Markdown' });
    }

    const users = await User.find({}, 'telegramId');
    let success = 0;
    let failed = 0;

    ctx.reply(`📢 ${users.length} জন ইউজারের কাছে নোটিশ পাঠানো শুরু হচ্ছে...`);

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

// ৮. সিঙ্গেল ইউজার মেসেজ (/sendmessage)
async function handleSingleMessage(ctx) {
    if (Number(ctx.from.id) !== Number(ADMIN_TELEGRAM_ID)) return;
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
        return ctx.reply('❌ মেসেজটি পাঠানো যায়নি। ইউজার বট ব্লক করে রেখে থাকতে পারে।');
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
