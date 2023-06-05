//------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
//------------------------------------------------------------//

//---------------------------------------------------------------------------------------------------------------//

import { Discord } from '../discord_client';

import { guildMemberAddLogger } from '../handlers/logs/guild_member_retention';

// import { welcomeMessageHandler } from '../handlers/welcome_message_handler';

import { illegalNicknameHandler } from '../handlers/illegal_nickname_handler';

//---------------------------------------------------------------------------------------------------------------//

const bot_guild_id = process.env.BOT_GUILD_ID as string;
if (typeof bot_guild_id !== 'string') throw new TypeError('bot_guild_id is not a string');

const new_to_the_server_role_ids_string = process.env.BOT_NEW_TO_THE_SERVER_AUTO_ROLE_IDS as string;
if (typeof new_to_the_server_role_ids_string !== 'string') throw new TypeError('new_to_the_server_role_ids_string is not a string');

//---------------------------------------------------------------------------------------------------------------//

const new_to_the_server_role_ids = new_to_the_server_role_ids_string.split(',');

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

        /* give new-to-the-server roles to the member */
        try {
            await member.roles.add(new_to_the_server_role_ids);
        } catch (error) {
            console.trace('Failed to give new-to-the-server roles to the member:', error);
        }

        /* log members joining */
        await guildMemberAddLogger(member).catch(console.trace);

        // /* send the welcome message to the member */
        // await welcomeMessageHandler(member).catch(console.trace);

        /* handle nicknames for new members */
        await illegalNicknameHandler(member).catch(console.trace);
    },
};
