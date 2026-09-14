const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
    platform: { type: String, required: true },
    accountData: { type: String, required: true },
    isUsed: { type: Boolean, default: false },
    usedBy: { type: Number, default: null },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Account', accountSchema);
