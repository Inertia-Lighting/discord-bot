// ------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
// ------------------------------------------------------------//

import * as Discord from 'discord.js';

import { guildMemberRemoveLogger } from '@/common/handlers/index.js'
import config from '@/utilities/bot_config.js';

// ------------------------------------------------------------//

export default {
    name: Discord.Events.GuildMemberRemove,
    async handler(
        client: Discord.Client,
        member: Discord.GuildMember,
    ) {
        if (member.user.system) return; // don't operate on system accounts
        if (member.user.bot) return; // don't operate on bots to prevent feedback-loops
        if (member.guild.id !== config.guild_id) return; // don't operate on other guilds

        /* log members leaving */
        await guildMemberRemoveLogger(member).catch(console.trace);
    },
};
