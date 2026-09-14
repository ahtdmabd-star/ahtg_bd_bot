const User = require('../models/User');
const TaskSubmission = require('../models/TaskSubmission');
const InstagramStock = require('../models/InstagramStock');
const GiftCard = require('../models/GiftCard');

const ADMIN_TELEGRAM_ID = 7689311203;

// অ্যাডমিন প্যানেল ভিউ
async function handleAdminPanel(ctx) {
    const userId = ctx.from.id;

    if (Number(userId) !== Number(ADMIN_TELEGRAM_ID)) {
        return ctx.reply('⚠️ এই কমান্ডটি কেবল মাত্র অ্যাডমিনের জন্য সংরক্ষিত!');
    }

    try {
        const totalUsers = await User.countDocuments();
        const pendingSubmissions = await TaskSubmission.countDocuments({ status: 'pending' });
        const availableInstaStock = await InstagramStock.countDocuments({ isAssigned: false });

        const adminMessage = 
            `⚙️ **অ্যাডমিন কন্ট্রোল প্যানেল**\n\n` +
            `👥 মোট ইউজার: **${totalUsers}**\n` +
            `⏳ পেন্ডিং প্রুফ: **${pendingSubmissions}**\n` +
            `📸 খালি ইন্সটাগ্রাম স্টক: **${availableInstaStock}**\n\n` +
            `📌 **কমান্ডসমূহ:**\n` +
            `/creategift <কোড> <পরিমাণ> - নতুন গিফট কার্ড তৈরি করতে\n\n` +
            `💡 _খুব শীঘ্রই বাল্ক অ্যাকাউন্ট আপলোড ইন্টারফেস যুক্ত করা হচ্ছে।_`;

        return ctx.reply(adminMessage, { parse_mode: 'Markdown' });
    } catch (error) {
        console.error('Admin Panel Error:', error);
        return ctx.reply('❌ অ্যাডমিন প্যানেল লোড করতে সমস্যা হয়েছে।');
    }
}

// গিফট কার্ড তৈরি করার কমান্ড
async function handleCreateGiftCard(ctx) {
    const userId = ctx.from.id;

    if (Number(userId) !== Number(ADMIN_TELEGRAM_ID)) return;

    const args = ctx.message.text.split(' ');
    if (args.length < 3) {
        return ctx.reply('⚠️ ফরম্যাট ভুল! সঠিক ফরম্যাট: `/creategift CODE 50`', { parse_mode: 'Markdown' });
    }

    const code = args[1];
    const amount = parseFloat(args[2]);

    try {
        await GiftCard.create({
            code,
            amount,
            createdBy: userId
        });
        return ctx.reply(`✅ সফলভাবে **৳${amount}** টাকার গিফট কার্ড তৈরি হয়েছে!\n🎟️ কোড: \`${code}\``, { parse_mode: 'Markdown' });
    } catch (error) {
        return ctx.reply('❌ গিফট কার্ড তৈরি করা যায়নি। কোডটি হয়তো ইতিমধ্যে বিদ্যমান।');
    }
}

module.exports = { handleAdminPanel, handleCreateGiftCard };
