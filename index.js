// index.js
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

// টোকেন ও কনফিগারেশন
const BOT_TOKEN = process.env.BOT_TOKEN || '8651381547:AAF2ZnYuSqOttJ1s0c7W9c8RS3S7F5vkpsA';
const ADMIN_ID = '7689311203';

// ⚠️ আপনার InfinityFree ওয়েবসাইট লিংক দিন (api.php এর সঠিক URL)
const WEBSITE_API_URL = 'https://taskwav.site.je/api.php'; 

const CHANNEL_LINK = 'https://t.me/AHTG_OFFICIAL';
const GROUP_LINK = 'https://t.me/ahtgofic';

// Telegram Bot Init
const bot = new TelegramBot(BOT_TOKEN, {
  polling: {
    autoStart: true,
    params: { timeout: 10 }
  }
});

// 409 Conflict Error অটো হ্যান্ডলার
bot.on('polling_error', (error) => {
  if (error.code === 'ETELEGRAM' && error.response && error.response.statusCode === 409) {
    console.log('⚠️ 409 Conflict Detected: Resolving duplicate instance...');
  } else {
    console.error('[Polling Error]', error.message);
  }
});

// /start কমান্ড প্রসেসিং
bot.onText(/\/start(?:\s+(.+))?/, async (msg, match) => {
  const chatId = msg.chat.id.toString();
  const passedRefCode = match[1] ? match[1].trim() : '';

  try {
    const response = await axios.post(WEBSITE_API_URL, new URLSearchParams({
      action: 'register_or_get_user',
      telegram_id: chatId,
      ref_code: passedRefCode
    }));

    const data = response.data;

    if (data.status === 'success') {
      const user = data.user;
      const botInfo = await bot.getMe();
      const myRefLink = `https://t.me/${botInfo.username}?start=${user.referral_code}`;

      let msgText = `👋 **স্বাগতম AHTG OFFICIAL বটে!**\n\n` +
        `🆔 **Telegram ID:** \`${user.telegram_id}\`\n` +
        `🔑 **Database Ref Code:** \`${user.referral_code}\`\n` +
        `💰 **Current Balance:** ৳${user.balance}\n\n` +
        `🔗 **আপনার রেফারেল লিংক:**\n${myRefLink}\n\n` +
        `📢 **আমাদের অফিশিয়াল আপডেট:**\n` +
        `• Channel: ${CHANNEL_LINK}\n` +
        `• Group: ${GROUP_LINK}`;

      if (data.is_new && user.referred_by) {
        msgText += `\n\n🎉 আপনি সফলভাবে \`${user.referred_by}\` কোডের মাধ্যমে যুক্ত হয়েছেন!`;
      }

      bot.sendMessage(chatId, msgText, { 
        parse_mode: 'Markdown',
        disable_web_page_preview: true
      });
    } else {
      bot.sendMessage(chatId, '❌ ডাটাবেজ প্রক্রিয়াকরণে সমস্যা হয়েছে।');
    }
  } catch (error) {
    console.error('API Connection Error:', error.message);
    bot.sendMessage(chatId, '⚠️ ডাটাবেজ সার্ভারের সাথে কানেক্ট করা যাচ্ছে না।');
  }
});

// কাজের ইনকাম ও কমিশন পাঠানোর ফাংশন
async function completeTask(telegramId, rewardAmount) {
  try {
    const response = await axios.post(WEBSITE_API_URL, new URLSearchParams({
      action: 'reward_and_commission',
      telegram_id: telegramId,
      amount: rewardAmount
    }));

    const result = response.data;

    if (result.status === 'success') {
      bot.sendMessage(telegramId, `✅ কাজ সম্পন্ন হয়েছে! আপনি ৳${rewardAmount} পেয়েছেন।`);

      if (result.referrer_telegram_id && result.commission_sent > 0) {
        bot.sendMessage(
          result.referrer_telegram_id,
          `🎉 **রেফারেল কমিশন জেনারেট হয়েছে!**\n\n` +
          `আপনার রেফারকৃত মেম্বার কাজ সম্পন্ন করায় আপনি **৳${result.commission_sent}** রেফারেল কমিশন পেয়েছেন।`,
          { parse_mode: 'Markdown' }
        );
      }
    }
  } catch (error) {
    console.error('Task Reward Error:', error.message);
  }
}

console.log('🚀 Bot script running successfully on Render...');
