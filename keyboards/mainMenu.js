const { Markup } = require('telegraf');
const bn = require('../locales/bn');
const en = require('../locales/en');

const MINI_APP_URL = 'https://alhudatechglobal.shop/dashboard.php';

function getMainMenu(lang = 'bn', isAdmin = false) {
    const t = lang === 'en' ? en : bn;

    let keyboard = [
        [Markup.button.webApp(t.btn_mini_app, MINI_APP_URL)],
        [t.btn_tasks, t.btn_profile],
        [t.btn_withdraw, t.btn_support]
    ];

    if (isAdmin) {
        keyboard.push([t.btn_admin]);
    }

    return Markup.keyboard(keyboard).resize();
}

module.exports = { getMainMenu };
