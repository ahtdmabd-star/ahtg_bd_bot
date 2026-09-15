// index.js
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const express = require('express');

// ১. Render Port Error সমাধান করতে HTTP Server Setup
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('🤖 AHTG Telegram Bot is Live & Running Perfectly!');
});

app.listen(PORT, () => {
  console.log(`🌐 Web server is listening on port ${PORT}`);
});

// ২. বটের কনফিগারেশন
const BOT_TOKEN = process.env.BOT_TOKEN || '8651381547:AAGwEI1O-wepoR9C6wBwl0eEpZRGWqvTitQ';
const ADMIN_ID = '7689311203';
const WEBSITE_API_URL = 'https://taskwav.site.je/api.php';

// চ্যানেল ও গ্রুপ আইডি/ইউজারনেম (ভেরিফিকেশনের জন্য বটকে চ্যানেল ও গ্রুপে Admin থাকতে হবে)
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

// Polling Error Suppression
bot.on('polling_error', (error) => {
  if (error.code === 'ETELEGRAM' && error.response && error.response.statusCode === 409) {
    console.log('⚠️ 409 Conflict Handling: Service reconnecting...');
  } else {
    console.error('[Polling Error]', error.message);
  }
});

// চ্যানেল ও গ্রুপ জয়েন চেক করার হেলপার ফাংশন
async function checkMembership(userId) {
  try {
    const chMember = await bot.getChatMember(CHANNEL_USERNAME, userId);
    const grpMember = await bot.getChatMember(GROUP_USERNAME, userId);

    const validStatus = ['creator', 'administrator', 'member'];
    const isChJoined = validStatus.includes(chMember.status);
    const isGrpJoined = validStatus.includes(grpMember.status);

    return isChJoined && isGrpJoined;
  } catch (err) {
    console.error('Membership Check Error:', err.message);
    return false; // কোনো কারণে চেক না করতে পারলে ডিফল্টফোলস
  }
}

// ভেরিফিকেশন কীবোর্ড জেনারেটর
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

// ==========================================
// /start কমান্ড এবং ভেরিফিকেশন হ্যান্ডলার
// ==========================================
bot.onText(/\/start(?:\s+(.+))?/, async (msg, match) => {
  const chatId = msg.chat.id.toString();
  const passedRefCode = match[1] ? match[1].trim() : '';

  // সদস্যপদ ভেরিফিকেশন চেক
  const isJoined = await checkMembership(chatId);

  if (!isJoined) {
    return bot.sendMessage(
      chatId,
      `⚠️ **আমাদের বটে কাজ করতে হলে অবশ্যই অফিসিয়াল চ্যানেল এবং গ্রুপে যুক্ত হতে হবে!**\n\nনিচের বাটনগুলো দিয়ে জয়েন করে **Verify Membership** এ চাপ দিন।`,
      { parse_mode: 'Markdown', ...getVerificationKeyboard() }
    );
  }

  processUserStart(chatId, passedRefCode);
});

// ভেরিফাই বাটনে ক্লিক প্রসেস
bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id.toString();
  const data = query.data;

  if (data === 'check_verify') {
    const isJoined = await checkMembership(chatId);

    if (isJoined) {
      bot.answerCallbackQuery(query.id, { text: '🎉 ভেরিফিকেশন সফল হয়েছে!' });
      bot.deleteMessage(chatId, query.message.message_id);
      processUserStart(chatId, '');
    } else {
      bot.answerCallbackQuery(query.id, { 
        text: '❌ আপনি এখনো চ্যানেল বা গ্রুপে জয়েন করেননি!', 
        show_alert: true 
      });
    }
  }
});

// ইউজার ডাটাবেজ প্রসেসিং ও প্রোফাইল মেসেজ
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
        `🔑 **Database Ref Code:** \`${user.referral_code}\`\n` +
        `💰 **Current Balance:** ৳${user.balance}\n\n` +
        `🔗 **আপনার রেফারেল লিংক:**\n${myRefLink}`;

      if (data.is_new && user.referred_by) {
        msgText += `\n\n🎉 আপনি \`${user.referred_by}\` কোডের মাধ্যমে স্পন্সরড হয়েছেন!`;
      }

      bot.sendMessage(chatId, msgText, { parse_mode: 'Markdown' });
    } else {
      bot.sendMessage(chatId, '❌ ডাটাবেজ প্রসেসিংয়ে সমস্যা হয়েছে।');
    }
  } catch (error) {
    console.error('API Error:', error.message);
    bot.sendMessage(chatId, '⚠️ ডাটাবেজ সার্ভারের সাথে কানেক্ট করা যাচ্ছে না।');
  }
}

// ==========================================
// এডমিন সিস্টেম ও ব্রডকাস্ট নোটিশ
// ==========================================
bot.onText(/\/broadcast (.+)/, async (msg, match) => {
  const chatId = msg.chat.id.toString();
  const broadcastText = match[1];

  if (chatId !== ADMIN_ID) {
    return bot.sendMessage(chatId, '⛔ এই কমান্ডটি কেবল মাত্র এডমিনের জন্য সংরক্ষিত!');
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
          await bot.sendMessage(userId, `🔔 **অফিসিয়াল নোটিশ** 🔔\n\n${broadcastText}`, { parse_mode: 'Markdown' });
          successCount++;
        } catch (e) {
          // ব্লকেড বা ইনঅ্যাক্টিভ ইউজার স্কিপ
        }
      }

      bot.sendMessage(chatId, `✅ সফলভাবে **${successCount}** জন ইউজারের কাছে নোটিশ পাঠানো হয়েছে।`);
    }
  } catch (err) {
    bot.sendMessage(chatId, '❌ ব্রডকাস্ট সফল হয়নি। ডাটাবেজ এপিআই চেক করুন।');
  }
});

console.log('🚀 AHTG Bot successfully deployed and running...');
