const User = require('../models/User');

async function processReferralCommission(bot, workerId, taskRewardAmount) {
    try {
        const worker = await User.findOne({ telegramId: workerId });
        if (!worker || !worker.referredBy) return;

        const referrer = await User.findOne({ telegramId: worker.referredBy });
        if (!referrer) return;

        // ৫% ইনস্ট্যান্ট রেফারেল কমিশন হিসাব
        const commission = (taskRewardAmount * 5) / 100;
        if (commission <= 0) return;

        referrer.balance += commission;
        referrer.referralEarnings += commission;
        await referrer.save();

        // রেফারারকে অটোমেটিক নোটিফিকেশন পাঠানো
        try {
            await bot.telegram.sendMessage(
                referrer.telegramId,
                `🎉 **রেফারেল কমিশন জমার খবর!**\n\n` +
                `আপনার রেফারি একটি টাস্ক সম্পূর্ণ করায় আপনি **৳${commission.toFixed(2)}** (৫%) রেফারেল কমিশন পেয়েছেন!`,
                { parse_mode: 'Markdown' }
            );
        } catch (e) {
            console.log('Referrer notification error:', e.message);
        }
    } catch (error) {
        console.error('Commission Helper Error:', error);
    }
}

module.exports = processReferralCommission;
