// ------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
// ------------------------------------------------------------//

import * as Discord from 'discord.js';

import {
    guildMemberRolesAddedLogger,
    guildMemberRolesRemovedLogger,
    illegalNicknameHandler,
} from '@/common/handlers/index.js';
import config from '@/utilities/bot_config.js';

// ------------------------------------------------------------//

export default {
    name: Discord.Events.GuildMemberUpdate,
    async handler(client: Discord.Client<true>, old_member: Discord.GuildMember, new_member: Discord.GuildMember) {
        if (!old_member || !new_member) return; // ensure both members are defined

        if (new_member.user.system) return; // don't operate on system accounts
        if (new_member.user.bot) return; // don't operate on bots to prevent feedback-loops
        if (old_member.guild.id !== config.guild_id) return; // don't operate on other guilds

        /* user nickname validator */
        if (old_member.displayName !== new_member.displayName) {
            await illegalNicknameHandler(client, new_member);
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
