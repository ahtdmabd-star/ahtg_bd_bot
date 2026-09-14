const CHANNEL_USERNAME = '@AHTG_OFFICIAL';

async function checkMembership(bot, userId) {
    try {
        const chatMember = await bot.telegram.getChatMember(CHANNEL_USERNAME, userId);
        return ['member', 'administrator', 'creator'].includes(chatMember.status);
    } catch (error) {
        console.error('Membership Check Error:', error);
        return false;
    }
}

module.exports = checkMembership;
