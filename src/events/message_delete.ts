// ------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
// ------------------------------------------------------------//

import * as Discord from 'discord.js';

import { guildMemberMessageDeleteLogger } from '@/common/handlers/index.js'
import config from '@/utilities/bot_config.js';

// ------------------------------------------------------------//

export default {
    name: Discord.Events.MessageDelete,
    async handler(
        client: Discord.Client,
        message: Discord.Message,
    ) {
        if (message.author.system) return; // don't operate on system accounts
        if (message.author.bot) return; // don't operate on bots to prevent feedback-loops

        if (!message.inGuild()) return; // only operate on messages sent in guilds

        if (message.guild.id !== config.guild_id) return; // only operate on messages sent in the bot guild

        /* log message deletions */
        guildMemberMessageDeleteLogger(message).catch(console.trace);
    },
};
