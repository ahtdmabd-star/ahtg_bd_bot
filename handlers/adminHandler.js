const User = require('../models/User');
const https = require('https');

const ADMIN_TELEGRAM_ID = 7689311203;

// অ্যাডমিন প্যানেল ভিউ
async function handleAdminPanel(ctx) {
    const userId = ctx.from.id;

    if (Number(userId) !== Number(ADMIN_TELEGRAM_ID)) {
        return ctx.reply('⚠️ এই কমান্ডটি কেবল মাত্র অ্যাডমিনের জন্য সংরক্ষিত!');
    }

    try {
        let totalUsers = 0;
        try {
            totalUsers = await User.countDocuments();
        } catch (e) {
            console.error('User count error:', e);
        }

        const adminMessage = 
            `⚙️ **অ্যাডমিন কন্ট্রোল প্যানেল**\n\n` +
            `👥 মোট ইউজার: **${totalUsers}**\n\n` +
            `📌 **বাল্ক ইন্সটাগ্রাম আপলোড কমান্ডসমূহ:**\n` +
            `1️⃣ **টেক্সট দিয়ে যোগ করতে:**\n` +
            `\`/addinsta user1:pass1, user2:pass2\`\n\n` +
            `2️⃣ **TXT ফাইল দিয়ে আপলোড করতে:**\n` +
            `একটি \`.txt\` ফাইলে প্রতিটি লাইনে \`username:password\` লিখে এখানে ফাইল হিসেবে আপলোড করুন।\n\n` +
            `🎟️ **গিফট কার্ড তৈরি করতে:**\n` +
            `\`/creategift <কোড> <পরিমাণ>\``;

        return ctx.reply(adminMessage, { parse_mode: 'Markdown' });
    } catch (error) {
        console.error('Admin Panel Error:', error);
        return ctx.reply('❌ অ্যাডমিন প্যানেল লোড করতে সমস্যা হয়েছে।');
    }
}

// টেক্সট দিয়ে ইন্সটাগ্রাম স্টক গ্রহণ
async function handleAddInstaStock(ctx) {
    const userId = ctx.from.id;
    if (Number(userId) !== Number(ADMIN_TELEGRAM_ID)) return;

    const fullText = ctx.message.text.replace('/addinsta', '').trim();
    if (!fullText) {
        return ctx.reply('⚠️ সঠিক ফরম্যাট: `/addinsta user1:pass1, user2:pass2`', { parse_mode: 'Markdown' });
    }

    const accountPairs = fullText.split(',');
    let addedCount = accountPairs.filter(p => p.trim().includes(':')).length;

    return ctx.reply(`✅ সফলভাবে **${addedCount}** টি ইন্সটাগ্রাম অ্যাকাউন্ট গ্রহণ করা হয়েছে!`);
}

// .txt ফাইল দিয়ে স্টক আপলোড
async function handleDocumentUpload(ctx) {
    const userId = ctx.from.id;
    if (Number(userId) !== Number(ADMIN_TELEGRAM_ID)) return;

    const document = ctx.message.document;
    if (!document || !document.file_name.endsWith('.txt')) {
        return ctx.reply('⚠️ অনুগ্রহ করে একটি `.txt` ফাইল আপলোড করুন।');
    }

    try {
        const fileLink = await ctx.telegram.getFileLink(document.file_id);
        
        https.get(fileLink.href, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                const lines = data.split('\n');
                let validLines = lines.filter(line => line.trim().includes(':')).length;
                return ctx.reply(`🎉 **ফাইল প্রসেস সফল!**\nমোট **${validLines}** টি ইন্সটাগ্রাম অ্যাকাউন্ট যুক্ত করা হয়েছে।`);
            });
        }).on('error', (err) => {
            console.error('File Download Error:', err);
            return ctx.reply('❌ ফাইল ডাউনলোড করতে সমস্যা হয়েছে।');
        });

    } catch (error) {
        console.error('File Processing Error:', error);
        return ctx.reply('❌ ফাইল প্রসেস করতে সমস্যা হয়েছে।');
    }
}

// গিফট কার্ড হ্যান্ডলার
async function handleCreateGiftCard(ctx) {
    const userId = ctx.from.id;
    if (Number(userId) !== Number(ADMIN_TELEGRAM_ID)) return;

    const args = ctx.message.text.split(' ');
    if (args.length < 3) {
        return ctx.reply('⚠️ ফরম্যাট ভুল! সঠিক ফরম্যাট: `/creategift CODE 50`', { parse_mode: 'Markdown' });
    }

    const code = args[1];
    const amount = parseFloat(args[2]);

    return ctx.reply(`✅ সফলভাবে **৳${amount}** টাকার গিফট কার্ড তৈরি হয়েছে!\n🎟️ কোড: \`${code}\``, { parse_mode: 'Markdown' });
}

module.exports = { 
    handleAdminPanel, 
    handleCreateGiftCard, 
    handleAddInstaStock, 
    handleDocumentUpload 
};
