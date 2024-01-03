//------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
//------------------------------------------------------------//

import * as Discord from 'discord.js';

import { guildMemberKickedLogger } from '@root/common/handlers';

//------------------------------------------------------------//

const bot_guild_id = `${process.env.BOT_GUILD_ID ?? ''}`;
if (bot_guild_id.length < 1) throw new Error('environment variable: BOT_GUILD_ID; was not properly set or is empty');

//------------------------------------------------------------//

export default {
    name: Discord.AuditLogEvent.MemberKick,
    async handler(
        client: Discord.Client,
        member: Discord.GuildMember,
    ) {
        if (member.user.system) return; // don't operate on system accounts
        if (member.user.bot) return; // don't operate on bots to prevent feedback-loops
        if (member.guild.id !== bot_guild_id) return; // don't operate on other guilds

        /* log members leaving */
        await guildMemberKickedLogger(member).catch(console.trace);
    },
};
