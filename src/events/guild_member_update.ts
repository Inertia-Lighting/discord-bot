//------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
//------------------------------------------------------------//

import * as Discord from 'discord.js';

import { guildMemberRolesAddedLogger, guildMemberRolesRemovedLogger, illegalNicknameHandler } from '@root/common/handlers';

//------------------------------------------------------------//

const bot_guild_id = `${stack.env.BOT_GUILD_ID ?? ''}`;
if (bot_guild_id.length < 1) throw new Error('environment variable: BOT_GUILD_ID; was not properly set or is empty');

//------------------------------------------------------------//

export default {
    name: Discord.Events.GuildMemberUpdate,
    async handler(
        client: Discord.Client,
        old_member: Discord.GuildMember,
        new_member: Discord.GuildMember,
    ) {
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
