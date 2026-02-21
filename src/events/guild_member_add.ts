// ------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
// ------------------------------------------------------------//

import * as Discord from 'discord.js';

import { guildMemberAddLogger, illegalNicknameHandler } from '@/common/handlers/index.js'

// ------------------------------------------------------------//

const bot_guild_id = `${process.env.BOT_GUILD_ID ?? ''}`;
if (bot_guild_id.length < 1) throw new Error('environment variable: BOT_GUILD_ID; was not properly set or is empty');

// ------------------------------------------------------------//

export default {
    name: Discord.Events.GuildMemberAdd,
    async handler(
        client: Discord.Client<true>,
        member: Discord.GuildMember,
    ) {
        if (member.user.system) return; // don't operate on system accounts
        if (member.user.bot) return; // don't operate on bots to prevent feedback-loops
        if (member.guild.id !== bot_guild_id) return; // don't operate on other guilds

        try {
            await member.fetch(true);
        } catch {
            return; // don't operate on members that can't be fetched
        }

        /* log members joining */
        await guildMemberAddLogger(member).catch(console.trace);

        /* handle nicknames for new members */
        await illegalNicknameHandler(client, member).catch(console.trace);
    },
};
