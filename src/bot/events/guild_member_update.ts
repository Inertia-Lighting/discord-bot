//------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
//------------------------------------------------------------//

import { Discord } from '../discord_client';

//---------------------------------------------------------------------------------------------------------------//

import { illegalNicknameHandler } from '../handlers/illegal_nickname_handler';

import { guildMemberRolesAddedLogger, guildMemberRolesRemovedLogger } from '../handlers/logs/guild_member_roles';

//---------------------------------------------------------------------------------------------------------------//

const bot_guild_id = process.env.BOT_GUILD_ID as string;
if (typeof bot_guild_id !== 'string') throw new TypeError('bot_guild_id is not a string');

//---------------------------------------------------------------------------------------------------------------//

export default {
    name: Discord.Events.GuildMemberUpdate,
    async handler(old_member: Discord.GuildMember, new_member: Discord.GuildMember) {
        if (!old_member || !new_member) return; // ensure both members are defined

        if (new_member.user.system) return; // don't operate on system accounts
        if (new_member.user.bot) return; // don't operate on bots to prevent feedback-loops
        if (old_member.guild.id !== bot_guild_id) return; // don't operate on other guilds

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
