const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    telegramId: { type: Number, required: true, unique: true },
    firstName: { type: String, default: '' },
    username: { type: String, default: '' },
    
    // ল্যাঙ্গুয়েজ প্রেফারেন্স (bn / en)
    language: { type: String, enum: ['bn', 'en'], default: 'bn' },
    
    // ওয়ালেট ও ইনকাম
    balance: { type: Number, default: 0 },
    totalEarned: { type: Number, default: 0 },
    totalWithdrawn: { type: Number, default: 0 },
    
    // ৫% রেফারেল কমিশন ট্র্যাকিং
    referredBy: { type: Number, default: null },
    referralCode: { type: String, unique: true },
    totalReferrals: { type: Number, default: 0 },
    referralEarnings: { type: Number, default: 0 },
    
    isVerified: { type: Boolean, default: false },
    isBanned: { type: Boolean, default: false },
    joinedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
