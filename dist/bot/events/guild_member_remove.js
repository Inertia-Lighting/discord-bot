/* Copyright © Inertia Lighting | All Rights Reserved */
//---------------------------------------------------------------------------------------------------------------//
'use strict';
//---------------------------------------------------------------------------------------------------------------//
const { guildMemberRemoveLogger } = require('../handlers/logs/guild_member_retention.js');
//---------------------------------------------------------------------------------------------------------------//
const bot_guild_id = process.env.BOT_GUILD_ID;
if (typeof bot_guild_id !== 'string')
    throw new TypeError('bot_guild_id is not a string');
//---------------------------------------------------------------------------------------------------------------//
module.exports = {
    name: 'guildMemberRemove',
    async handler(member) {
        if (member.user.system)
            return; // don't operate on system accounts
        if (member.user.bot)
            return; // don't operate on bots to prevent feedback-loops
        if (member.guild.id !== bot_guild_id)
            return; // don't operate on other guilds
        /* log members leaving */
        await guildMemberRemoveLogger(member).catch(console.trace);
    },
};
//# sourceMappingURL=guild_member_remove.js.map