// index.js
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const express = require('express');

// ১. Render Port Scan Error সমাধানের জন্য Web Server Setup
const app = express();
const PORT = process.env.PORT || 10000;

app.get('/', (req, res) => {
  res.send('🤖 AHTG Telegram Bot is active and running!');
});

app.listen(PORT, () => {
  console.log(`🌐 Web server is listening on port ${PORT}`);
});

// ২. বটের কনফিগারেশন (Environment Variable অথবা ব্যাকআপ টোকেন)
const BOT_TOKEN = process.env.BOT_TOKEN || '8651381547:AAGwEI1O-wepoR9C6wBwl0eEpZRGWqvTitQ';
const ADMIN_ID = '7689311203'; 
const WEBSITE_API_URL = 'https://taskwav.site.je/api.php';

// চ্যানেল ও গ্রুপ আইডি/ইউজারনেম (বটকে অবশ্যই Admin বানাতে হবে)
const CHANNEL_USERNAME = '@AHTG_OFFICIAL';
const GROUP_USERNAME = '@ahtgofic';

const CHANNEL_LINK = 'https://t.me/AHTG_OFFICIAL';
const GROUP_LINK = 'https://t.me/ahtgofic';

// Telegram Bot Init
const bot = new TelegramBot(BOT_TOKEN, {
  polling: {
    autoStart: true,
    params: { timeout: 10 }
  }
});

// Polling and Authorization Error Logger
bot.on('polling_error', (error) => {
  if (error.code === 'ETELEGRAM') {
    if (error.response && error.response.statusCode === 401) {
      console.error('❌ CRITICAL ERROR: 401 Unauthorized! Check your Telegram BOT_TOKEN.');
    } else if (error.response && error.response.statusCode === 409) {
      console.log('⚠️ 409 Conflict: Reconnecting instance...');
    }
  } else {
    console.error('[Polling Error]', error.message);
  }
});

// ৩. চ্যানেল ও গ্রুপ জয়েন ভেরিফিকেশন ফাংশন
async function checkMembership(userId) {
  try {
    const chMember = await bot.getChatMember(CHANNEL_USERNAME, userId);
    const grpMember = await bot.getChatMember(GROUP_USERNAME, userId);

    const validStatus = ['creator', 'administrator', 'member'];
    return validStatus.includes(chMember.status) && validStatus.includes(grpMember.status);
  } catch (err) {
    console.error('Membership Check Error:', err.message);
    return false;
  }
}

// ইনলাইন ভেরিফিকেশন কীবোর্ড
function getVerificationKeyboard() {
  return {
    reply_markup: {
      inline_keyboard: [
        [{ text: '📢 Join Channel', url: CHANNEL_LINK }],
        [{ text: '💬 Join Group', url: GROUP_LINK }],
        [{ text: '✅ Verify Membership', callback_data: 'check_verify' }]
      ]
    }
  };
}

// ৪. /start কমান্ড
bot.onText(/\/start(?:\s+(.+))?/, async (msg, match) => {
  const chatId = msg.chat.id.toString();
  const passedRefCode = match[1] ? match[1].trim() : '';

  const isJoined = await checkMembership(chatId);

  if (!isJoined) {
    return bot.sendMessage(
      chatId,
      `⚠️ **বটটি ব্যবহার করতে হলে আমাদের অফিশিয়াল চ্যানেল ও গ্রুপে জয়েন করতে হবে!**\n\nনিচের বাটনগুলো চেপে জয়েন করার পর **Verify Membership** এ চাপ দিন।`,
      { parse_mode: 'Markdown', ...getVerificationKeyboard() }
    );
  }

  processUserStart(chatId, passedRefCode);
});

// ৫. ভেরিফিকেশন বাটন হ্যান্ডলিং
bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id.toString();

  if (query.data === 'check_verify') {
    const isJoined = await checkMembership(chatId);

    if (isJoined) {
      bot.answerCallbackQuery(query.id, { text: '🎉 ভেরিফিকেশন সফল হয়েছে!' });
      try {
        await bot.deleteMessage(chatId, query.message.message_id);
      } catch (e) {}
      processUserStart(chatId, '');
    } else {
      bot.answerCallbackQuery(query.id, { 
        text: '❌ আপনি এখনো চ্যানেল বা গ্রুপে জয়েন করেননি!', 
        show_alert: true 
      });
    }
  }
});

// ৬. ইউজার ডাটাবেজ প্রসেসিং
async function processUserStart(chatId, passedRefCode) {
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
        `🔑 **Referral Code:** \`${user.referral_code}\`\n` +
        `💰 **Balance:** ৳${user.balance}\n\n` +
        `🔗 **আপনার রেফারেল লিংক:**\n${myRefLink}`;

      if (data.is_new && user.referred_by) {
        msgText += `\n\n🎉 আপনি \`${user.referred_by}\` এর রেফারে যুক্ত হয়েছেন!`;
      }

      bot.sendMessage(chatId, msgText, { parse_mode: 'Markdown' });
    } else {
      bot.sendMessage(chatId, '❌ ডাটাবেজ প্রসেসিংয়ে সমস্যা হয়েছে।');
    }
  } catch (error) {
    console.error('API Error:', error.message);
    bot.sendMessage(chatId, '⚠️ ডাটাবেজ সার্ভারের সাথে যোগাযোগ করা যাচ্ছে না।');
  }
}

// ৭. এডমিন ব্রডকাস্ট নোটিশ সিস্টেম (সকলের কাছে মেসেজ পাঠানোর জন্য)
// ব্যবহারের নিয়ম: /broadcast আপনার মেসেজ
bot.onText(/\/broadcast (.+)/, async (msg, match) => {
  const chatId = msg.chat.id.toString();
  const broadcastText = match[1];

  if (chatId !== ADMIN_ID) {
    return bot.sendMessage(chatId, '⛔ এই কমান্ডটি কেবল মাত্র এডমিনের জন্য!');
  }

  bot.sendMessage(chatId, '📢 ব্রডকাস্ট মেসেজ পাঠানো শুরু হচ্ছে...');

  try {
    const response = await axios.post(WEBSITE_API_URL, new URLSearchParams({
      action: 'get_all_users'
    }));

    if (response.data.status === 'success') {
      const users = response.data.users;
      let successCount = 0;

      for (let userId of users) {
        try {
          await bot.sendMessage(userId, `🔔 **অফিসিয়াল নোটিশ** 🔔\n\n${broadcastText}`, { parse_mode: 'Markdown' });
          successCount++;
        } catch (e) {
          // ইউজার যদি বট ব্লক করে থাকে তবে তা স্কিপ হবে
        }
      }

      bot.sendMessage(chatId, `✅ সফলভাবে **${successCount}** জন ইউজারের কাছে নোটিশ পাঠানো হয়েছে।`);
    }
  } catch (err) {
    bot.sendMessage(chatId, '❌ ব্রডকাস্ট পাঠাতে ব্যর্থ হয়েছে। ওয়েবসাইট এপিআই চেক করুন।');
  }
});

console.log('🚀 AHTG Bot script is starting...');
