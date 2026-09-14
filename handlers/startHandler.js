const User = require('../models/User');
const checkMembership = require('../utils/checkMembership');
const { getMainMenu } = require('../keyboards/mainMenu');
const { Markup } = require('telegraf');

const ADMIN_TELEGRAM_ID = 7689311203;

async function handleStart(ctx) {
    const userId = ctx.from.id;
    const firstName = ctx.from.first_name || 'User';
    const username = ctx.from.username || '';
    
    // রেফারেল কোড চেক (কমান্ডের সাথে স্টার্ট প্যারামিটার থাকলে)
    const startPayload = ctx.message.text.split(' ')[1];
    let referrerId = null;

    if (startPayload && !isNaN(startPayload) && Number(startPayload) !== userId) {
        referrerId = Number(startPayload);
    }

    let user = await User.findOne({ telegramId: userId });

    if (!user) {
        user = new User({
            telegramId: userId,
            firstName,
            username,
            referralCode: userId.toString(),
            referredBy: referrerId
        });

        // রেফারারের রেফারেল কাউন্ট বাড়ানো
        if (referrerId) {
            await User.updateOne(
                { telegramId: referrerId },
                { $inc: { totalReferrals: 1 } }
            );
        }

        await user.save();
    }

    // Force Subscription চেক
    const isJoined = await checkMembership(ctx.telegram, userId);

    if (!isJoined && userId !== ADMIN_TELEGRAM_ID) {
        return ctx.reply(
            `স্বাগতম ${firstName}!\n\nবটটি ব্যবহার করতে এবং আমাদের মিনি অ্যাপে প্রবেশ করতে হলে অবশ্যই আমাদের অফিশিয়াল চ্যানেল ও গ্রুপে জয়েন করতে হবে।`,
            Markup.inlineKeyboard([
                [Markup.button.url('📢 আমাদের চ্যানেল', 'https://t.me/AHTG_OFFICIAL')],
                [Markup.button.url('👥 আমাদের গ্রুপ', 'https://t.me/+N026NocN90tlMTM1')],
                [Markup.button.callback('✅ ভেরিফাই করুন', 'verify_membership')]
            ])
        );
    }

    user.isVerified = true;
    await user.save();

    const isAdmin = userId === ADMIN_TELEGRAM_ID;
    ctx.reply(
        `স্বাগতম ${firstName}! Al-Huda Task প্ল্যাটফর্মে আপনাকে স্বাগতম।\nনিচের বাটনগুলো ব্যবহার করে আপনার কাজ শুরু করুন:`,
        getMainMenu(user.language, isAdmin)
    );
}

module.exports = { handleStart };
