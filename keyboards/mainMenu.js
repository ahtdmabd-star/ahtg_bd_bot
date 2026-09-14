const { Markup } = require('telegraf');

function getMainMenu(lang = 'bn', isAdmin = false) {
    const userButtons = [
        ['📸 ইনস্টাগ্রাম কাজ', '📧 জিমেইল কাজ'],
        ['📘 ফেসবুক কাজ', '🐦 টুইটার (X) কাজ'],
        ['👤 প্রোফাইল', '💳 উইথড্র'],
        ['📢 অফিশিয়াল সাপোর্ট']
    ];

    if (isAdmin) {
        userButtons.push(['👑 অ্যাডমিন প্যানেল']);
    }

    return Markup.keyboard(userButtons).resize();
}

module.exports = { getMainMenu };
