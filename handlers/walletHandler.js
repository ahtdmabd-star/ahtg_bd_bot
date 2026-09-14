const User = require('../models/User');
const GiftCard = require('../models/GiftCard');

// গিফট কার্ড ক্লেইম করার লজিক
async function handleRedeemGiftCard(ctx, code) {
    const userId = ctx.from.id;

    try {
        const gift = await GiftCard.findOne({ code: code.trim(), isRedeemed: false });

        if (!gift) {
            return ctx.reply('❌ অকার্যকর বা ইতিমধ্যে ক্লেইম করা গিফট কার্ড কোড!');
        }

        const user = await User.findOne({ telegramId: userId });
        if (!user) return ctx.reply('ইউজার পাওয়া যায়নি!');

        // ব্যালেন্স যোগ ও ভাউচার আপডেট
        user.balance += gift.amount;
        user.totalEarned += gift.amount;
        await user.save();

        gift.isRedeemed = true;
        gift.redeemedBy = userId;
        gift.redeemedAt = new Date();
        await gift.save();

        ctx.reply(`🎉 **অভিনন্দন!**\n\nআপনি সফলভাবে **৳${gift.amount}** টাকা আপনার ব্যালেন্সে ক্লেইম করেছেন!`);

    } catch (error) {
        console.error('Redeem Gift Error:', error);
        ctx.reply('❌ ক্লেইম প্রসেস করতে সমস্যা হয়েছে।');
    }
}

module.exports = { handleRedeemGiftCard };
