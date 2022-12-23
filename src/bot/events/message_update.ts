//------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
//------------------------------------------------------------//

//---------------------------------------------------------------------------------------------------------------//

import { Discord } from '../discord_client';

import { guildMemberMessageUpdateLogger } from '../handlers/logs/guild_member_messages';

//---------------------------------------------------------------------------------------------------------------//

const bot_guild_id = process.env.BOT_GUILD_ID as string;
if (typeof bot_guild_id !== 'string') throw new TypeError('bot_guild_id is not a string');

//---------------------------------------------------------------------------------------------------------------//

export default {
    name: Discord.Events.MessageUpdate,
    async handler(old_message: Discord.Message, new_message: Discord.Message) {
        if (old_message.author.system) return; // don't operate on system accounts
        if (old_message.author.bot) return; // don't operate on bots to prevent feedback-loops
        if (old_message.guild?.id !== bot_guild_id) return; // don't operate on other guilds

        /* log message edits */
        await guildMemberMessageUpdateLogger(old_message, new_message).catch(console.trace);
    },
};
