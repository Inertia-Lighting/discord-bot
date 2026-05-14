// ------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
// ------------------------------------------------------------//

import * as Discord from 'discord.js';

import { guildMemberBannedLogger } from '@/common/handlers/index.js'
import config from '@/utilities/bot_config.js';

// ------------------------------------------------------------//

export default {
    name: Discord.Events.GuildBanAdd,
    async handler(
        client: Discord.Client,
        ban: Discord.GuildBan,
    ) {
        if (ban.guild.id !== config.guild_id) return; // don't operate on other guilds

        try {
            await ban.fetch(true);
        } catch {
            return; // don't operate on bans that can't be fetched
        }

        /* log bans */
        await guildMemberBannedLogger(ban).catch(console.trace);
    },
};
