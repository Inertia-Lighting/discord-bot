/* Copyright © Inertia Lighting | All Rights Reserved */
//---------------------------------------------------------------------------------------------------------------//
'use strict';
//---------------------------------------------------------------------------------------------------------------//
const { guildMemberMessageDeleteLogger } = require('../handlers/logs/guild_member_messages');
//---------------------------------------------------------------------------------------------------------------//
const bot_guild_id = process.env.BOT_GUILD_ID;
if (typeof bot_guild_id !== 'string')
    throw new TypeError('bot_guild_id is not a string');
//---------------------------------------------------------------------------------------------------------------//
module.exports = {
    name: 'messageDelete',
    async handler(message) {
        if (message.author.system)
            return; // don't operate on system accounts
        if (message.author.bot)
            return; // don't operate on bots to prevent feedback-loops
        if (message.guild.id !== bot_guild_id)
            return; // don't operate on other guilds
        /* log message deletions */
        await guildMemberMessageDeleteLogger(message).catch(console.trace);
    },
};
//# sourceMappingURL=message_delete.js.map