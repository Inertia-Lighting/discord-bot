/* Copyright © Inertia Lighting | All Rights Reserved */

//---------------------------------------------------------------------------------------------------------------//

'use strict';

//---------------------------------------------------------------------------------------------------------------//

const { Discord } = require('../discord_client.js');

const { Timer } = require('../../utilities.js');

const { command_permission_levels } = require('../common/bot.js');
const { logModerationActionToDatabase } = require('../handlers/log_moderation_action_handler.js');

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
    usage: '@mention reason',
    aliases: ['mute', 'unmute'],
    permission_level: command_permission_levels.MODERATORS,
    cooldown: 2_000,
    async execute(message, args) {
        const { command_name, command_args } = args;

        const staff_member = message.member;
        const member_lookup_query = message.mentions.members.first()?.id ?? command_args[0];
        const member = message.guild.members.resolve(member_lookup_query);
        const reason = command_args.slice(1).join(' ').trim() || 'no reason was specified';

        /* handle when a member is not specified */
        if (!member) {
            await message.reply({
                content: 'You need to specify a user when using this command!',
            }).catch(console.warn);
            return;
        }

        /* handle when a staff member specifies themself */
        if (staff_member.id === member.id) {
            await message.reply({
                content: 'You aren\'t allowed to mute yourself!',
            }).catch(console.warn);
            return;
        }

        /* handle when a staff member specifies the guild owner */
        if (member.id === message.guild.ownerId) {
            await message.reply({
                content: 'You aren\'t allowed to mute the owner of this server!',
            }).catch(console.warn);
            return;
        }

        /* handle when a staff member tries to moderate someone with an equal/higher role */
        if (staff_member.roles.highest.comparePositionTo(member.roles.highest) <= 0) {
            await message.reply({
                content: 'You aren\'t allowed to mute someone with an equal/higher role!',
            }).catch(console.warn);
            return;
        }

        if (['unmute'].includes(command_name)) {
            /* check if the user is already unmuted */
            if (!member.roles.cache.has(muted_users_role_id)) {
                await message.reply({
                    content: 'That user is already unmuted!',
                }).catch(console.warn);
                return;
            }

            /* remove the muted role from the member */
            try {
                await member.roles.remove(muted_users_role_id, reason);
            } catch (error) {
                console.trace(error);
                await message.reply({
                    content: 'Failed to unmute that member!',
                }).catch(console.warn);
                return;
            }

            const unmute_message_options = [
                `${member}`,
                `You were unmuted in the Inertia Lighting Discord by ${staff_member.user} for:`,
                '\`\`\`',
                `${reason}`,
                '\`\`\`',
            ].join('\n');

            /* message the member in the server */
            await message.channel.send(unmute_message_options).catch(console.warn);

            /* dm the member */
            try {
                const dm_channel = await member.createDM();
                await dm_channel.send(unmute_message_options);
            } catch {
                // ignore any errors
            }

            return;
        }

        /* check if the user is already muted */
        if (member.roles.cache.has(muted_users_role_id)) {
            await message.reply({
                content: 'That user is already muted!',
            });
            return;
        }

        /* add the muted role to the member */
        try {
            await member.roles.add(muted_users_role_id, reason);
        } catch (error) {
            console.trace(error);
            await message.reply({
                content: 'Failed to mute that member!',
            }).catch(console.warn);
            return;
        }

        /* change channel permissions for the muted role */
        for (const channel of message.guild.channels.cache.values()) {
            /* check if any of the permissions need to be changed */
            const muted_users_role_permission_overwrites_in_channel = channel.permissionOverwrites.resolve(muted_users_role_id);
            if (muted_users_role_permission_overwrites_in_channel?.deny?.equals(channel_permission_overwrites_for_muted_users_role.deny)) continue;

            /* change the permissions as needed */
            const current_channel_permissions_overwrites = Array.from(channel.permissionOverwrites.values());
            try {
                await channel.permissionOverwrites.set([
                    ...current_channel_permissions_overwrites,
                    channel_permission_overwrites_for_muted_users_role,
                ]);
            } catch (error) {
                console.trace(error);
                break;
            }

            await Timer(100); // prevent api abuse
        }

        const mute_message_options = {
            content: [
                `${member}`,
                `You were muted in the Inertia Lighting discord by ${staff_member.user} for:`,
                '\`\`\`',
                `${reason}`,
                '\`\`\`',
            ].join('\n'),
        };

        /* message the member in the server */
        await message.channel.send(mute_message_options).catch(console.warn);

        /* dm the member */
        try {
            const dm_channel = await member.createDM();
            await dm_channel.send(mute_message_options);
        } catch {
            // ignore any errors
        }

        /* log to the database */
        const successfully_logged_to_database = await logModerationActionToDatabase({
            discord_user_id: member.id,
        }, {
            type: 'MUTE',
            epoch: Date.now(),
            reason: reason,
            staff_member_id: message.member.id,
        });

        /* if logging to the database failed, dm the staff member */
        if (!successfully_logged_to_database) {
            try {
                const staff_member_dm_channel = await message.author.createDM();
                staff_member_dm_channel.send(`${message.author}, something went wrong while logging to the database, please contact our development team!`);
            } catch {
                // ignore any errors
            }
        }
    },
};
