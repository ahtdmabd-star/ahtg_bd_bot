const User = require('../models/User');

async function handleProfile(ctx) {
    const userId = ctx.from.id;
    const user = await User.findOne({ telegramId: userId });

    if (!user) return ctx.reply('ইউজার পাওয়া যায়নি! দয়া করে /start লিখুন।');

    const botUsername = ctx.botInfo.username;
    const refLink = `https://t.me/${botUsername}?start=${userId}`;

    const profileMsg = 
        `👤 **আপনার প্রোফাইল তথ্য:**\n\n` +
        `🆔 **আইডি:** \`${user.telegramId}\`\n` +
        `💰 **মূল ব্যালেন্স:** ৳${user.balance.toFixed(2)}\n` +
        `💵 **মোট আয়:** ৳${user.totalEarned.toFixed(2)}\n` +
        `💸 **মোট উইথড্র:** ৳${user.totalWithdrawn.toFixed(2)}\n\n` +
        `👥 **মোট রেফার:** ${user.totalReferrals} জন\n` +
        `🎁 **রেফারেল ইনকাম (5%):** ৳${user.referralEarnings.toFixed(2)}\n\n` +
        `🔗 **আপনার রেফারেল লিংক:**\n\`${refLink}\`\n\n` +
        `💡 _আপনার রেফারেল লিংক ব্যবহার করে কেউ কাজ করলে তার আয় থেকে ৫% বোনাস সরাসরি আপনার ব্যালেন্সে যোগ হবে!_`;

    ctx.reply(profileMsg, { parse_mode: 'Markdown' });
}

module.exports = { handleProfile };
