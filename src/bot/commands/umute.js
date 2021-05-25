/* Copyright © Inertia Lighting | All Rights Reserved */

//---------------------------------------------------------------------------------------------------------------//

'use strict';

//---------------------------------------------------------------------------------------------------------------//

const muted_users_role_id = process.env.BOT_MUTED_USER_ROLE_ID;

//---------------------------------------------------------------------------------------------------------------//

module.exports = {
    name: 'unmute',
    description: 'unmute user',
    aliases: ['unmute'],
    permission_level: 'staff',
    cooldown: 2_000,
    async execute(message, args) {
        const { command_args } = args;

        const member_lookup_query = message.mentions.members.first()?.id ?? command_args[0];
        const member = message.guild.members.resolve(member_lookup_query);
        const unmute_reason = command_args.slice(1).join(' ').trim();

        /* Add muted role to member */
        try {
            await member.roles.remove(muted_users_role_id, unmute_reason);
        } catch (error) {
            console.trace(error);
            await message.reply('Failed to remove the muted role to the user!').catch(console.warn);
            return;
        }

        const dm_channel = await member.createDM();
        await dm_channel.send('You were unmuted in the Inertia Lighting Discord server')
    },
};
