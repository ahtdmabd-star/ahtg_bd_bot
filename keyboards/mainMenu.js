const { Markup } = require('telegraf');

const MINI_APP_URL = 'https://alhudatechglobal.shop/dashboard.php';

function getMainMenu(lang = 'bn', isAdmin = false) {
    let keyboard = [
        [Markup.button.webApp('🚀 ওপেন টাস্ক অ্যাপ', MINI_APP_URL)],
        ['📸 ইন্সটাগ্রাম কাজ', '📧 জিমেইল কাজ'],
        ['📘 ফেসবুক কাজ', '🐦 টুইটার (X) কাজ'],
        ['👤 প্রোফাইল', '💳 উইথড্র'],
        ['📢 সাপোর্ট']
    ];

    if (isAdmin) {
        keyboard.push(['👑 অ্যাডমিন প্যানেল']);
    }

    return Markup.keyboard(keyboard).resize();
}

module.exports = { getMainMenu };
