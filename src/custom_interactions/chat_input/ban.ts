//------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
//------------------------------------------------------------//

import * as Discord from 'discord.js';

import { CustomInteraction, CustomInteractionAccessLevel, CustomInteractionRunContext } from '@root/common/managers/custom_interactions_manager';

import { ModerationActionType, addModerationActionToDatabase } from '@root/common/handlers';

//------------------------------------------------------------//

export default new CustomInteraction({
    identifier: 'ban',
    type: Discord.InteractionType.ApplicationCommand,
    data: {
        type: Discord.ApplicationCommandType.ChatInput,
        description: 'Bans a member from the guild.',
        options: [
            {
                name: 'member',
                type: Discord.ApplicationCommandOptionType.User,
                description: 'The member who you want to ban.',
                required: true,
            }, {
                name: 'reason',
                type: Discord.ApplicationCommandOptionType.String,
                description: 'The reason why you want to ban.',
                required: true,
            },
        ],
    },
    metadata: {
        required_run_context: CustomInteractionRunContext.Guild,
        required_access_level: CustomInteractionAccessLevel.Admins,
    },
    handler: async (discord_client, interaction) => {
        if (!interaction.isChatInputCommand()) return;
        if (!interaction.inCachedGuild()) return;
        if (!interaction.channel) return;

        await interaction.deferReply({ ephemeral: false });

        const staff_member = interaction.member;
        const member_to_ban = interaction.options.getMember('member');
        const ban_reason = interaction.options.getString('reason', true);

        /* handle when a reason is not specified */
        if (typeof ban_reason !== 'string' || ban_reason.length < 1) {
            await interaction.editReply({
                content: 'You must specify a reason for the ban!',
            }).catch(console.trace);

            return;
        }

        /* handle when a member is not specified */
        if (!member_to_ban) {
            await interaction.editReply({
                content: 'You must specify a member to ban!',
            }).catch(console.trace);

            return;
        }

        /* handle when a staff member specifies themself */
        if (staff_member.id === member_to_ban.id) {
            await interaction.editReply({
                content: 'You aren\'t allowed to ban yourself!',
            }).catch(console.trace);

            return;
        }

        /* handle when a staff member specifies this bot */
        if (member_to_ban.id === discord_client.user.id) {
            await interaction.editReply({
                content: 'You aren\'t allowed to ban me!',
            }).catch(console.trace);

            return;
        }

        /* handle when a staff member specifies the guild owner */
        if (member_to_ban.id === interaction.guild.ownerId) {
            await interaction.editReply({
                content: 'You aren\'t allowed to ban the owner of this server!',
            }).catch(console.trace);

            return;
        }

        /* handle when a staff member tries to moderate someone with an equal/higher role */
        if (staff_member.roles.highest.comparePositionTo(member_to_ban.roles.highest) <= 0) {
            await interaction.editReply({
                content: 'You aren\'t allowed to ban someone with an equal/higher role!',
            }).catch(console.trace);

            return;
        }

        const moderation_message_options = {
            content: [
                `${member_to_ban}`,
                `You were banned from the Inertia Lighting discord by ${staff_member.user} for:`,
                '\`\`\`',
                `${ban_reason}`,
                '\`\`\`',
            ].join('\n'),
        };

        /* dm the member */
        try {
            const dm_channel = await member_to_ban.createDM();
            await dm_channel.send(moderation_message_options);
        } catch {
            // ignore any errors since the member may have their dms disabled or blocked
            // don't return here since we still want to continue with the moderation action
        }

        /* message the member in the server */
        await interaction.editReply(moderation_message_options).catch(console.warn);

        /* perform the moderation action on the member */
        try {
            await member_to_ban.ban({ reason: ban_reason });
        } catch (error) {
            console.trace(error);

            await interaction.editReply({
                content: 'Failed to ban the specified member!',
            }).catch(console.warn);

            return;
        }

        /* add the moderation action to the database */
        const successfully_logged_to_database = await addModerationActionToDatabase({
            discord_user_id: member_to_ban.id,
        }, {
            type: ModerationActionType.Ban,
            epoch: Date.now(),
            reason: ban_reason,
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
                // ignore any errors since the staff member may have their dms disabled or blocked
            }
        }
    },
});
