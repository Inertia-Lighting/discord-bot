/* Copyright © Inertia Lighting | All Rights Reserved */

//---------------------------------------------------------------------------------------------------------------//

import { Discord } from '../discord_client';

import { guildMemberMessageDeleteLogger } from '../handlers/logs/guild_member_messages';

//---------------------------------------------------------------------------------------------------------------//

const bot_guild_id = process.env.BOT_GUILD_ID as string;
if (typeof bot_guild_id !== 'string') throw new TypeError('bot_guild_id is not a string');

//---------------------------------------------------------------------------------------------------------------//

export default {
    name: 'messageDelete',
    async handler(message: Discord.Message) {
        if (message.author.system) return; // don't operate on system accounts
        if (message.author.bot) return; // don't operate on bots to prevent feedback-loops
        if (message.guild?.id !== bot_guild_id) return; // don't operate on other guilds

        /* log message deletions */
        await guildMemberMessageDeleteLogger(message).catch(console.trace);
    },
};
