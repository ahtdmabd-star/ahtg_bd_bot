const InstagramStock = require('../models/InstagramStock');
const TaskSubmission = require('../models/TaskSubmission');
const { Markup } = require('telegraf');

// ইউজারের জন্য ডায়নামিক ইন্সটাগ্রাম অ্যাকাউন্ট অ্যাসাইন করা
async function handleInstaTask(ctx) {
    const userId = ctx.from.id;

    try {
        // ১. চেক করা ইউজারের কি ইতোমধ্যে কোনো ইন্সটাগ্রাম কাজ পেন্ডিং বা প্রসেসিংয়ে আছে কিনা
        let existingTask = await InstagramStock.findOne({ assignedTo: userId, isCompleted: false });

        if (!existingTask) {
            // ২. যদি নতুন কাজ চায়, তবে স্টক থেকে একটি অব্যবহৃত (Unassigned) অ্যাকাউন্ট খুঁজে বের করা
            existingTask = await InstagramStock.findOneAndUpdate(
                { isAssigned: false, isCompleted: false },
                { isAssigned: true, assignedTo: userId },
                { new: true }
            );
        }

        if (!existingTask) {
            return ctx.reply('⚠️ বর্তমানে কোনো ইন্সটাগ্রাম স্টক খালি নেই! দয়া করে কিছুক্ষণ পর চেষ্টা করুন।');
        }

        // ৩. ইউজারের সামনে ডাটা উপস্থাপন করা (নাম, বায়ো, ইউজারনেম, পাসওয়ার্ড সহ)
        const taskDetails = 
            `📸 **ইন্সটাগ্রাম টাস্ক নির্দেশাবলি:**\n\n` +
            `👤 **নাম:** \`${existingTask.name || 'N/A'}\`\n` +
            `🆔 **ইউজারনেম:** \`${existingTask.username}\`\n` +
            `🔑 **পাসওয়ার্ড:** \`${existingTask.password}\`\n` +
            `📝 **বায়ো:** \`${existingTask.bio || 'N/A'}\`\n` +
            `${existingTask.note ? `📌 **নোট:** ${existingTask.note}\n` : ''}\n` +
            `━━━━━━━━━━━━━━━━━━━━\n` +
            `👉 উপরে দেওয়া তথ্য দিয়ে অ্যাকাউন্ট সেটআপ সম্পন্ন করুন। কাজ শেষ হলে আপনার **2FA Code** নিচে সাবমিট বাটনে চাপ দিন।`;

        ctx.reply(
            taskDetails,
            {
                parse_mode: 'Markdown',
                ...Markup.inlineKeyboard([
                    [Markup.button.callback('📥 2FA / প্রুফ সাবমিট করুন', `submit_insta_${existingTask._id}`)]
                ])
            }
        );

    } catch (error) {
        console.error('Insta Task Handler Error:', error);
        ctx.reply('❌ একটি সমস্যা হয়েছে। পরে আবার চেষ্টা করুন।');
    }
}

module.exports = { handleInstaTask };
