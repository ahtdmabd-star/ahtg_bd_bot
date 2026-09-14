const User = require('../models/User');
const checkMembership = require('../utils/checkMembership');
const { getMainMenu } = require('../keyboards/mainMenu');
const { Markup } = require('telegraf');

const ADMIN_TELEGRAM_ID = 7689311203;

async function handleStart(ctx) {
    try {
        const userId = ctx.from.id;
        const firstName = ctx.from.first_name || 'User';
        const username = ctx.from.username || '';
        
        const textParts = ctx.message && ctx.message.text ? ctx.message.text.split(' ') : [];
        const startPayload = textParts[1];
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

            if (referrerId) {
                await User.updateOne(
                    { telegramId: referrerId },
                    { $inc: { totalReferrals: 1 } }
                );
            }

            await user.save();
        }

        const isJoined = await checkMembership(ctx.telegram, userId);

        if (!isJoined && userId !== ADMIN_TELEGRAM_ID) {
            return ctx.reply(
                `স্বাগতম ${firstName}!\n\nবটটি ব্যবহার করতে আমাদের অফিশিয়াল চ্যানেল ও গ্রুপে জয়েন করুন।`,
                Markup.inlineKeyboard([
                    [Markup.button.url('📢 অফিশিয়াল চ্যানেল', 'https://t.me/AHTG_OFFICIAL')],
                    [Markup.button.url('👥 হেল্প গ্রুপ', 'https://t.me/+N026NocN90tlMTM1')],
                    [Markup.button.callback('✅ ভেরিফাই করুন', 'verify_membership')]
                ])
            );
        }

        user.isVerified = true;
        await user.save();

        const isAdmin = Number(userId) === Number(ADMIN_TELEGRAM_ID);
        return ctx.reply(
            `স্বাগতম ${firstName}! Al-Huda Task প্ল্যাটফর্মে আপনাকে স্বাগতম।\nনিচের বাটনগুলো ব্যবহার করে আপনার কাজ শুরু করুন:`,
            getMainMenu(user.language, isAdmin)
        );
    } catch (error) {
        console.error('Start Handler Error:', error);
        return ctx.reply('একটি সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।');
    }
}

module.exports = { handleStart };
