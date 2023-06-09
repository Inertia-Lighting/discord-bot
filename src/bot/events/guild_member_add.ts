//------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
//------------------------------------------------------------//

//---------------------------------------------------------------------------------------------------------------//

import { Discord } from '../discord_client';

import { guildMemberAddLogger } from '../handlers/logs/guild_member_retention';

import { illegalNicknameHandler } from '../handlers/illegal_nickname_handler';

//---------------------------------------------------------------------------------------------------------------//

const bot_guild_id = process.env.BOT_GUILD_ID as string;
if (typeof bot_guild_id !== 'string') throw new TypeError('bot_guild_id is not a string');

//---------------------------------------------------------------------------------------------------------------//

export default {
    name: Discord.Events.GuildMemberAdd,
    async handler(
        member: Discord.GuildMember,
    ) {
        if (member.user.system) return; // don't operate on system accounts
        if (member.user.bot) return; // don't operate on bots to prevent feedback-loops
        if (member.guild.id !== bot_guild_id) return; // don't operate on other guilds

        try {
            await member.fetch(true);
        } catch (error) {
            console.trace('Failed to fetch member:', error);
            return;
        }

        /* log members joining */
        await guildMemberAddLogger(member).catch(console.trace);

        /* handle nicknames for new members */
        await illegalNicknameHandler(member).catch(console.trace);
    },
};
