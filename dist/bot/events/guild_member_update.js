/* Copyright © Inertia Lighting | All Rights Reserved */
//---------------------------------------------------------------------------------------------------------------//
'use strict';
//---------------------------------------------------------------------------------------------------------------//
const { illegalNicknameHandler } = require('../handlers/illegal_nickname_handler.js');
const { guildMemberRolesAddedLogger, guildMemberRolesRemovedLogger } = require('../handlers/logs/guild_member_roles.js');
//---------------------------------------------------------------------------------------------------------------//
const bot_guild_id = process.env.BOT_GUILD_ID;
if (typeof bot_guild_id !== 'string')
    throw new TypeError('bot_guild_id is not a string');
//---------------------------------------------------------------------------------------------------------------//
module.exports = {
    name: 'guildMemberUpdate',
    async handler(old_member, new_member) {
        if (!(old_member || new_member))
            return;
        if (new_member.user.system)
            return; // don't operate on system accounts
        if (new_member.user.bot)
            return; // don't operate on bots to prevent feedback-loops
        if (old_member.guild.id !== bot_guild_id)
            return; // don't operate on other guilds
        /* user nickname validator */
        if (old_member.displayName !== new_member.displayName) {
            await illegalNicknameHandler(new_member);
        }
        /* roles added logger */
        if (old_member.roles.cache.size < new_member.roles.cache.size) {
            await guildMemberRolesAddedLogger(old_member, new_member);
        }
        /* roles removed logger */
        if (old_member.roles.cache.size > new_member.roles.cache.size) {
            await guildMemberRolesRemovedLogger(old_member, new_member);
        }
    },
};
//# sourceMappingURL=guild_member_update.js.map