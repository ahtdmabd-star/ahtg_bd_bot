const { Telegraf } = require('telegraf');
const mongoose = require('mongoose');
const http = require('http');

// টোকেন ও ডাটাবেজ কানেকশন
const BOT_TOKEN = '8651381547:AAF5jgoHUVl8vlTfEe47unNL_9w06YkgxdY';
const MONGO_URI = 'mongodb+srv://alhudatechglobal_db_user:XW0TalkXq3tov5Cy@cluster0.g7zrokl.mongodb.net/?appName=Cluster0';
const PORT = process.env.PORT || 3000;

const bot = new Telegraf(BOT_TOKEN);

// ১. MongoDB ডাটাবেজ কানেকশন
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected Successfully!'))
  .catch((err) => console.error('❌ Database Connection Error:', err));

// ২. ইউজারের জন্য ডাটাবেজ স্কিমা ও মডেল তৈরি
const userSchema = new mongoose.Schema({
  telegramId: { type: Number, unique: true },
  username: String,
  firstName: String,
  joinedAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// ৩. /start কমান্ড হ্যান্ডলার
bot.start(async (ctx) => {
  const userId = ctx.from.id;
  const username = ctx.from.username || 'No Username';
  const firstName = ctx.from.first_name || 'User';

  try {
    let user = await User.findOne({ telegramId: userId });
    if (!user) {
      user = new User({ telegramId: userId, username, firstName });
      await user.save();
      console.log(`New user saved: ${firstName}`);
    }

    ctx.reply(`স্বাগতম ${firstName}! আল-হুদা টেক গ্লোবাল ও টাস্ক প্ল্যাটফর্মে আপনাকে স্বাগতম। আপনার ডাটা সফলভাবে রেজিস্টার করা হয়েছে।`);
  } catch (error) {
    console.error('Error saving user:', error);
    ctx.reply('দুঃখিত, কোনো একটি সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।');
  }
});

// ৪. টেলিগ্রাম বট স্টার্ট করা
bot.launch()
  .then(() => console.log('🤖 Telegram Bot is running...'))
  .catch((err) => console.error('Bot launch error:', err));

// ৫. Render-এর জন্য HTTP সার্ভার চালু রাখা (যাতে Application exited early না দেখায়)
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Al-Huda Bot is running smoothly!\n');
}).listen(PORT, () => {
  console.log(`🌐 HTTP Server is listening on port ${PORT}`);
});

// গ্রেসফুল শাটডাউন
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
