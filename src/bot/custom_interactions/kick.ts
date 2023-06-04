//------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
//------------------------------------------------------------//

import * as Discord from 'discord.js';

import { CustomInteraction, CustomInteractionAccessLevel } from '@root/bot/common/managers/custom_interactions_manager';

import { ModerationActionType, addModerationActionToDatabase } from '@root/bot/handlers/moderation_action_handler';

//------------------------------------------------------------//

export default new CustomInteraction({
    identifier: 'kick',
    type: Discord.InteractionType.ApplicationCommand,
    data: {
        type: Discord.ApplicationCommandType.ChatInput,
        description: 'kicks a user from the server',
        options: [
            {
                name: 'member',
                type: Discord.ApplicationCommandOptionType.User,
                description: 'The member who you want to kick.',
                required: true,
            }, {
                name: 'reason',
                type: Discord.ApplicationCommandOptionType.String,
                description: 'The reason why you want to kick.',
                minLength: 1,
                maxLength: 256,
                required: true,
            },
        ],
    },
    metadata: {
        required_access_level: CustomInteractionAccessLevel.Moderators,
    },
    handler: async (discord_client, interaction) => {
        if (!interaction.isChatInputCommand()) return;
        if (!interaction.inCachedGuild()) return;
        if (!interaction.channel) return;

        await interaction.deferReply({ ephemeral: false });

        const staff_member = interaction.member;
        const member_to_kick = interaction.options.getMember('member');
        const kick_reason = interaction.options.getString('reason', true);

        /* handle when a reason is not specified */
        if (typeof kick_reason !== 'string' || kick_reason.length < 1) {
            await interaction.editReply({
                content: 'You must specify a reason for the kick!',
            }).catch(console.warn);

            return;
        }

        /* handle when a member is not specified */
        if (!member_to_kick) {
            await interaction.editReply({
                content: 'The user you specified is not a member of this server!',
            }).catch(console.warn);

            return;
        }

        /* handle when a staff member specifies themself */
        if (staff_member.id === member_to_kick.id) {
            await interaction.editReply({
                content: 'You aren\'t allowed to kick yourself!',
            }).catch(console.warn);

            return;
        }

        /* handle when a staff member specifies this bot */
        if (member_to_kick.id === discord_client.user?.id) {
            await interaction.editReply({
                content: 'You aren\'t allowed to kick me!',
            }).catch(console.warn);
            return;
        }

        /* handle when a staff member specifies the guild owner */
        if (member_to_kick.id === interaction.guild.ownerId) {
            await interaction.editReply({
                content: 'You aren\'t allowed to kick the owner of this server!',
            }).catch(console.warn);

            return;
        }

        /* handle when a staff member tries to moderate someone with an equal/higher role */
        if (staff_member.roles.highest.comparePositionTo(member_to_kick.roles.highest) <= 0) {
            await interaction.editReply({
                content: 'You aren\'t allowed to kick someone with an equal/higher role!',
            }).catch(console.warn);

            return;
        }

        const moderation_message_options = {
            content: [
                `${member_to_kick}`,
                `You were kicked from the Inertia Lighting discord by ${staff_member.user} for:`,
                '\`\`\`',
                `${kick_reason}`,
                '\`\`\`',
            ].join('\n'),
        };

        /* dm the member */
        try {
            const dm_channel = await member_to_kick.createDM();
            await dm_channel.send(moderation_message_options);
        } catch {
            // ignore any errors since the member might have their dms disabled or blocked
            // don't return here since we still want to continue with the moderation action
        }

        /* message the member in the server */
        await interaction.editReply(moderation_message_options).catch(console.warn);

        /* perform the moderation action on the member */
        try {
            await member_to_kick.kick(kick_reason);
        } catch (error) {
            console.trace(error);

            await interaction.editReply({
                content: 'Failed to kick that member!',
            }).catch(console.warn);

            return;
        }

         /* log to the database */
         const successfully_logged_to_database = await addModerationActionToDatabase({
            discord_user_id: member_to_kick.id,
        }, {
            type: ModerationActionType.Kick,
            epoch: Date.now(),
            reason: kick_reason,
            staff_member_id: staff_member.id,
        });

        /* if logging to the database failed, dm the staff member */
        if (!successfully_logged_to_database) {
            try {
                const staff_member_dm_channel = await interaction.user.createDM();
                staff_member_dm_channel.send({
                    content: `${interaction.user}, something went wrong while logging to the database, please contact our development team!`,
                });
            } catch {
                // ignore any errors since the staff member might have their dms disabled or blocked
            }
        }
    },
});
