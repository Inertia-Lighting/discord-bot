//------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
//------------------------------------------------------------//

//---------------------------------------------------------------------------------------------------------------//

import { Discord } from '../discord_client';

import { command_permission_levels } from '../common/bot';

import { logModerationActionToDatabase } from '../handlers/log_moderation_action_handler';

//---------------------------------------------------------------------------------------------------------------//

export default {
    name: 'warn',
    description: 'warns a user from the server',
    usage: '@mention reason',
    aliases: ['warn'],
    permission_level: command_permission_levels.MODERATORS,
    cooldown: 1_500,
    async execute(
        message: Discord.Message<true>,
        args: {
            [key: string]: unknown;
            command_args: string[];
        },
    ) {
        const { command_args } = args;

        const staff_member = message.member!;
        const member_lookup_query = message.mentions.members?.first()?.id ?? command_args[0];
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
                content: 'You aren\'t allowed to warn yourself!',
            }).catch(console.warn);
            return;
        }

        /* handle when a staff member specifies this bot */
        if (member.id === message.client.user!.id) {
            await message.reply({
                content: 'You aren\'t allowed to warn me!',
            }).catch(console.warn);
            return;
        }

        /* handle when a staff member specifies the guild owner */
        if (member.id === message.guild.ownerId) {
            await message.reply({
                content: 'You aren\'t allowed to warn the owner of this server!',
            });
            return;
        }

        /* handle when a staff member tries to moderate someone with an equal/higher role */
        if (staff_member.roles.highest.comparePositionTo(member.roles.highest) <= 0) {
            await message.reply({
                content: 'You aren\'t allowed to warn someone with an equal/higher role!',
            }).catch(console.warn);
            return;
        }

        const moderation_message_options = {
            content: [
                `${member}`,
                `You were warned in the Inertia Lighting discord by ${staff_member.user} for:`,
                '\`\`\`',
                `${reason}`,
                '\`\`\`',
            ].join('\n'),
        };

        /* dm the member */
        try {
            const dm_channel = await member.createDM();
            await dm_channel.send(moderation_message_options);
        } catch {
            // ignore any errors
        }

        /* message the member in the server */
        await message.channel.send(moderation_message_options).catch(console.warn);

        /* log to the database */
        const successfully_logged_to_database = await logModerationActionToDatabase({
            discord_user_id: member.id,
        }, {
            type: 'WARN',
            epoch: Date.now(),
            reason: reason,
            staff_member_id: message.member!.id,
        });

        /* if logging to the database failed, dm the staff member */
        if (!successfully_logged_to_database) {
            try {
                const staff_member_dm_channel = await message.author.createDM();
                staff_member_dm_channel.send({
                    content: `${message.author}, something went wrong while logging to the database, please contact our development team!`,
                });
            } catch {
                // ignore any errors
            }
        }
    },
};
