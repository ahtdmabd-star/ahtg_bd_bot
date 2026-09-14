const { Markup } = require('telegraf');

function getAdminMenu() {
    return Markup.inlineKeyboard([
        [Markup.button.callback('📊 ইউজার লিস্ট ও কন্ট্রোল', 'admin_users')],
        [Markup.button.callback('📸 ইন্সটাগ্রাম স্টক আপলোড', 'admin_insta_upload')],
        [Markup.button.callback('📥 পেন্ডিং প্রুফ রিভিউ', 'admin_proof_review')],
        [Markup.button.callback('🎁 গিফট কার্ড তৈরি', 'admin_create_gift')],
        [Markup.button.callback('📢 ব্রডকাস্ট নোটিশ', 'admin_broadcast')]
    ]);
}

module.exports = { getAdminMenu };
