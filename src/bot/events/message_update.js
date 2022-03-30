/* Copyright © Inertia Lighting | All Rights Reserved */

//---------------------------------------------------------------------------------------------------------------//

'use strict';

//---------------------------------------------------------------------------------------------------------------//

const { guildMemberMessageUpdateLogger } = require('../handlers/logs/guild_member_messages');

//---------------------------------------------------------------------------------------------------------------//

const bot_guild_id = process.env.BOT_GUILD_ID;
if (typeof bot_guild_id !== 'string') throw new TypeError('bot_guild_id is not a string');

//---------------------------------------------------------------------------------------------------------------//

module.exports = {
    name: 'messageUpdate',
    async handler(old_message, new_message) {
        if (old_message.user.system) return; // don't operate on system accounts
        if (old_message.user.bot) return; // don't operate on bots to prevent feedback-loops
        if (old_message.guild.id !== bot_guild_id) return; // don't operate on other guilds

        /* log message edits */
        await guildMemberMessageUpdateLogger(old_message, new_message).catch(console.trace);
    },
};
