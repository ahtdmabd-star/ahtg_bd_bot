const mongoose = require('mongoose');

const taskSubmissionSchema = new mongoose.Schema({
    userId: { type: Number, required: true },
    taskType: { type: String, required: true }, // 'instagram', 'gmail', 'facebook', 'micro_task'
    stockId: { type: mongoose.Schema.Types.ObjectId, ref: 'InstagramStock', default: null },
    
    // ইউজারের সাবমিট করা প্রুফ ডাটা
    proofText: { type: String, default: '' },
    proofImage: { type: String, default: '' },
    twoFactorCode: { type: String, default: '' },
    
    // রিভিউ ও পেমেন্ট স্ট্যাটাস
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    rejectionReason: { type: String, default: '' }, // অ্যাডমিন রিজেক্ট করলে কারণ দেখাবে
    rewardAmount: { type: Number, default: 0 },
    
    submittedAt: { type: Date, default: Date.now },
    reviewedAt: { type: Date, default: null }
});

module.exports = mongoose.model('TaskSubmission', taskSubmissionSchema);
