const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://alhudatechglobal_db_user:XW0TalkXq3tov5Cy@cluster0.g7zrokl.mongodb.net/?appName=Cluster0
            ";
        
        await mongoose.connect(MONGO_URI, {
            serverSelectionTimeoutMS: 5000 // ১০ সেকেন্ড অপেক্ষা না করে দ্রুত কানেক্ট করার চেষ্টা করবে
        });
        
        console.log('✅ MongoDB Connected Successfully!');
    } catch (err) {
        console.error('❌ MongoDB Connection Error:', err.message);
    }
};

module.exports = connectDB;
