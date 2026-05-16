// ------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
// ------------------------------------------------------------//

import * as Discord from 'discord.js';

import { guildMemberMessageUpdateLogger } from '@/common/handlers/index.js';
import config from '@/utilities/bot_config.js';

// ------------------------------------------------------------//

export default {
    name: Discord.Events.MessageUpdate,
    async handler(client: Discord.Client, old_message: Discord.Message, new_message: Discord.Message) {
        if (old_message.author.system) return; // don't operate on system accounts
        if (old_message.author.bot) return; // don't operate on bots to prevent feedback-loops

        if (!old_message.inGuild()) return; // only operate on messages sent in guilds

        if (old_message.guild.id !== config.guild_id) return; // only operate on messages sent in the bot guild

        /* log message edits */
        guildMemberMessageUpdateLogger(old_message, new_message).catch(console.trace);
    },
};
