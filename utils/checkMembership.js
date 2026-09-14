async function checkMembership(telegram, userId) {
    try {
        // ১. আপনার চ্যানেলের ইউজারনেম
        const channelUsername = '@AHTG_OFFICIAL'; 
        
        // ২. আপনার হেল্প গ্রুপের আইডি (যদি প্রাইভেট গ্রুপ হয় তবে আসল আইডি বসান)
        const groupId = '@https://t.me/+N026NocN90tlMTM1'; // আপাতত চ্যানেল দিয়ে টেস্ট করতে পারেন অথবা গ্রুপের ইউজারনেম/আইডি দিন

        let isChannelMember = false;
        let isGroupMember = false;

        const validStatuses = ['creator', 'administrator', 'member'];

        // চ্যানেল চেক
        try {
            const channelMember = await telegram.getChatMember(channelUsername, userId);
            isChannelMember = validStatuses.includes(channelMember.status);
        } catch (err) {
            console.error('Channel check failed:', err.message);
            // চ্যানেল চেকে সমস্যা হলে ব্লক করবে না
            isChannelMember = false; 
        }

        // গ্রুপ চেক
        try {
            const groupMember = await telegram.getChatMember(groupId, userId);
            isGroupMember = validStatuses.includes(groupMember.status);
        } catch (err) {
            console.error('Group check failed:', err.message);
            // গ্রুপের আইডি ভুল থাকলেও চ্যানেল ভেরিফাই থাকলে যেন কাজ করে
            isGroupMember = true; 
        }

        return isChannelMember && isGroupMember;
    } catch (error) {
        console.error('Overall Check Membership Error:', error.message);
        return false;
    }
}

module.exports = checkMembership;
