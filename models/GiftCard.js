const mongoose = require('mongoose');

const giftCardSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true },
    amount: { type: Number, required: true },
    isRedeemed: { type: Boolean, default: false },
    redeemedBy: { type: Number, default: null }, // যে ইউজার ক্লেইম করবে তার Telegram ID
    redeemedAt: { type: Date, default: null },
    createdBy: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('GiftCard', giftCardSchema);
