// ------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
// ------------------------------------------------------------//

import { guildMemberBannedLogger } from '@root/common/handlers';
import * as Discord from 'discord.js';

// ------------------------------------------------------------//

const bot_guild_id = `${process.env.BOT_GUILD_ID ?? ''}`;
if (bot_guild_id.length < 1) throw new Error('environment variable: BOT_GUILD_ID; was not properly set or is empty');

// ------------------------------------------------------------//

export default {
    name: Discord.Events.GuildBanAdd,
    async handler(
        client: Discord.Client,
        ban: Discord.GuildBan,
    ) {
        if (ban.guild.id !== bot_guild_id) return; // don't operate on other guilds

        try {
            await ban.fetch(true);
        } catch {
            return; // don't operate on bans that can't be fetched
        }

        /* log bans */
        await guildMemberBannedLogger(ban).catch(console.trace);
    },
};
