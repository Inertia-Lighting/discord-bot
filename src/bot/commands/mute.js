/* Copyright © Inertia Lighting | All Rights Reserved */

//---------------------------------------------------------------------------------------------------------------//

'use strict';

//---------------------------------------------------------------------------------------------------------------//

const { Discord } = require('../discord_client.js');

const { Timer } = require('../../utilities.js');

const { logModerationActionToDatabase } = require('../handlers/modlog_handler.js');

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
    description: '(un)mutes a user',
    aliases: ['mute', 'unmute'],
    permission_level: 'staff',
    cooldown: 2_000,
    async execute(message, args) {
        const { command_name, command_args } = args;

        const staff_member = message.member;
        const member_lookup_query = message.mentions.members.first()?.id ?? command_args[0];
        const member = message.guild.members.resolve(member_lookup_query);
        const reason = command_args.slice(1).join(' ').trim() || 'no reason was specified';

        /* handle when a member is not specified */
        if (!member) {
            await message.reply('You need to specify a user when using this command!').catch(console.warn);
            return;
        }

        /* handle when staff members specifies themself */
        if (staff_member.id === member.id) {
            await message.reply('You aren\'t allowed to (un)mute yourself!').catch(console.warn);
            return;
        }

        /* handle when a staff member tries to (un)mute someone with an equal/higher role */
        if (staff_member.roles.highest.comparePositionTo(member.roles.highest) <= 0) {
            await message.reply('You aren\'t allowed to (un)mute someone with an equal/higher role!').catch(console.warn);
            return;
        }

        if (['unmute'].includes(command_name)) {
            /* check if the user is already unmuted */
            if (!member.roles.cache.has(muted_users_role_id)) {
                await message.reply('That user is already unmuted!');
                return;
            }

            /* remove the muted role from the member */
            try {
                await member.roles.remove(muted_users_role_id, reason);
            } catch (error) {
                console.trace(error);
                await message.reply('Failed to unmute that member!').catch(console.warn);
                return;
            }

            const unmute_message_contents = [
                `${member}`,
                `You were unmuted in the Inertia Lighting Discord by ${staff_member.user} for:`,
                '\`\`\`',
                `${reason}`,
                '\`\`\`',
            ].join('\n');

            /* message the member in the server */
            await message.channel.send(unmute_message_contents).catch(console.warn);

            /* dm the member */
            try {
                const dm_channel = await member.createDM();
                await dm_channel.send(unmute_message_contents);
            } catch {
                // ignore any errors
            }

            return;
        }

        /* check if the user is already muted */
        if (member.roles.cache.has(muted_users_role_id)) {
            await message.reply('That user is already muted!');
            return;
        }

        /* add the muted role to the member */
        try {
            await member.roles.add(muted_users_role_id, reason);
        } catch (error) {
            console.trace(error);
            await message.reply('Failed to mute that member!').catch(console.warn);
            return;
        }

        /* change channel permissions for the muted role */
        for (const channel of message.guild.channels.cache.values()) {
            /* check if any of the permissions need to be changed */
            const muted_users_role_permission_overwrites_in_channel = channel.permissionOverwrites.get(muted_users_role_id);
            if (muted_users_role_permission_overwrites_in_channel?.deny?.equals(channel_permission_overwrites_for_muted_users_role.deny)) continue;

            /* change the permissions as needed */
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

            await Timer(100); // prevent api abuse
        }

        const mute_message_contents = [
            `${member}`,
            `You were muted in the Inertia Lighting Discord by ${staff_member.user} for:`,
            '\`\`\`',
            `${reason}`,
            '\`\`\`',
        ].join('\n');

        /* message the member in the server */
        await message.channel.send(mute_message_contents).catch(console.warn);

        /* dm the member */
        try {
            const dm_channel = await member.createDM();
            await dm_channel.send(mute_message_contents);
        } catch {
            // ignore any errors
        }
        await logModerationActionToDatabase({
            discord_user_id: member.id,
        }, {
            type: 'MUTE',
            epoch: Date.now(),
            staff_member_id: message.member.id,
            reason: reason,
        });
    },
};
