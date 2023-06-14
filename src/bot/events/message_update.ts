//------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
//------------------------------------------------------------//

import * as Discord from 'discord.js';

import { guildMemberMessageUpdateLogger } from '../handlers/logs/guild_member_messages';

//------------------------------------------------------------//

const bot_guild_id = `${process.env.BOT_GUILD_ID ?? ''}`;
if (bot_guild_id.length < 1) throw new Error('environment variable: BOT_GUILD_ID; was not properly set or is empty');

//------------------------------------------------------------//

export default {
    name: Discord.Events.MessageUpdate,
    async handler(
        old_message: Discord.Message,
        new_message: Discord.Message,
    ) {
        if (old_message.author.system) return; // don't operate on system accounts
        if (old_message.author.bot) return; // don't operate on bots to prevent feedback-loops

        if (!old_message.inGuild()) return; // only operate on messages sent in guilds

        if (old_message.guild.id !== bot_guild_id) return; // only operate on messages sent in the bot guild

        /* log message edits */
        guildMemberMessageUpdateLogger(old_message, new_message).catch(console.trace);
    },
};
