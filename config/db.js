const mongoose = require('mongoose');

// সরাসরি আপনার MongoDB URI
const MONGO_URI = process.env.MONGO_URI || "your_mongodb_connection_string_here"; 

const connectDB = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('MongoDB Connected Successfully!');
    } catch (err) {
        console.error('MongoDB Connection Error:', err.message);
    }
};

module.exports = connectDB;
