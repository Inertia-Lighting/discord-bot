/* Copyright © Inertia Lighting | All Rights Reserved */

//---------------------------------------------------------------------------------------------------------------//

'use strict';

//---------------------------------------------------------------------------------------------------------------//

const { Discord, client } = require('../discord_client.js');

const { Timer } = require('../../utilities.js');

//---------------------------------------------------------------------------------------------------------------//

const muted_users_role_id = process.env.BOT_MUTED_USER_ROLE_ID;

const channel_permission_overwrites_for_muted_users_role = {
    id: muted_users_role_id,
    deny: [
        Discord.Permissions.FLAGS.MANAGE_MESSAGES,
        Discord.Permissions.FLAGS.SEND_MESSAGES,
        Discord.Permissions.FLAGS.ADD_REACTIONS,
        Discord.Permissions.FLAGS.ATTACH_FILES,
        Discord.Permissions.FLAGS.EMBED_LINKS,
        Discord.Permissions.FLAGS.CONNECT,
        Discord.Permissions.FLAGS.SPEAK,
        Discord.Permissions.FLAGS.STREAM,
        Discord.Permissions.FLAGS.USE_VAD,
        Discord.Permissions.FLAGS.MOVE_MEMBERS,
        Discord.Permissions.FLAGS.MUTE_MEMBERS,
        Discord.Permissions.FLAGS.DEAFEN_MEMBERS,
    ],
};

//---------------------------------------------------------------------------------------------------------------//

module.exports = {
    name: 'mute',
    description: 'mutes user',
    aliases: ['mute'],
    permission_level: 'staff',
    cooldown: 2_000,
    async execute(message, args) {
        const { command_args } = args;

        const member_lookup_query = message.mentions.members.first()?.id ?? command_args[0];
        const member = message.guild.members.resolve(member_lookup_query);
        const mute_reason = command_args.slice(1).join(' ').trim();

        /* Add muted role to member */
        try {
            await member.roles.add(muted_users_role_id, mute_reason);
            await Timer(3000);
            await message.reply(`Successfully muted ${member} for ${mute_reason}`);
        } catch (error) {
            console.trace(error);
            await message.reply('Failed to give the muted role to the user!').catch(console.warn);
            return;
        }

        /* Change channel permissions for muted role */
        for (const channel of message.guild.channels.cache.values()) {
            const muted_users_role_permission_overwrites_in_channel = channel.permissionOverwrites.get(muted_users_role_id);
            if (muted_users_role_permission_overwrites_in_channel?.deny?.equals(channel_permission_overwrites_for_muted_users_role.deny)) continue;

            const current_channel_permissions_overwrites = Array.from(channel.permissionOverwrites.values());
            try {
                await channel.overwritePermissions([
                    ...current_channel_permissions_overwrites,
                    channel_permission_overwrites_for_muted_users_role,
                ]);
            } catch (error) {
                console.trace(error);
                break;
            }

            await Timer(100);
        }

        const dm_channel = await member.createDM();
        await dm_channel.send([
            'You were muted in the Inertia Lighting Discord server for:',
            '\`\`\`',
            `${mute_reason}`,
            '\`\`\`',
        ].join('\n')).catch(console.warn);
    },
};
