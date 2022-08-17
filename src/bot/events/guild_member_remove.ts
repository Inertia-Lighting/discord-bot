//------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
//------------------------------------------------------------//

//---------------------------------------------------------------------------------------------------------------//

import { Discord } from '../discord_client';

import { guildMemberRemoveLogger } from '../handlers/logs/guild_member_retention';

//---------------------------------------------------------------------------------------------------------------//

const bot_guild_id = process.env.BOT_GUILD_ID as string;
if (typeof bot_guild_id !== 'string') throw new TypeError('bot_guild_id is not a string');

//---------------------------------------------------------------------------------------------------------------//

export default {
    name: 'guildMemberRemove',
    async handler(member: Discord.GuildMember) {
        if (member.user.system) return; // don't operate on system accounts
        if (member.user.bot) return; // don't operate on bots to prevent feedback-loops
        if (member.guild.id !== bot_guild_id) return; // don't operate on other guilds

        /* log members leaving */
        await guildMemberRemoveLogger(member).catch(console.trace);
    },
};
