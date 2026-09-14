const mongoose = require('mongoose');

const instagramStockSchema = new mongoose.Schema({
    username: { type: String, required: true },
    password: { type: String, required: true },
    name: { type: String, default: '' },           // ইন্সটাগ্রাম একাউন্টের নাম
    bio: { type: String, default: '' },
    note: { type: String, default: '' },
    
    // ভবিষ্যতের জন্য যেকোনো ডাইনামিক ফিল্ড (যেমন: 2FA key, recovery email ইত্যাদি)
    customFields: { type: Map, of: String, default: {} },

    isAssigned: { type: Boolean, default: false }, // অন্য ইউজারকে অ্যাসাইন করা হয়েছে কিনা
    assignedTo: { type: Number, default: null },   // ইউজারের Telegram ID
    isCompleted: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('InstagramStock', instagramStockSchema);
