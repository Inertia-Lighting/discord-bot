//------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
//------------------------------------------------------------//

import * as Discord from 'discord.js';

import { CustomInteraction, CustomInteractionAccessLevel, CustomInteractionRunContext } from '@root/common/managers/custom_interactions_manager';

import { ModerationActionType, addModerationActionToDatabase } from '@root/common/handlers';

//------------------------------------------------------------//

export default new CustomInteraction({
    identifier: 'warn',
    type: Discord.InteractionType.ApplicationCommand,
    data: {
        type: Discord.ApplicationCommandType.ChatInput,
        description: 'Used by staff to warn a member in the server.',
        options: [
            {
                name: 'member',
                type: Discord.ApplicationCommandOptionType.User,
                description: 'The member who you want to warn.',
                required: true,
            }, {
                name: 'reason',
                type: Discord.ApplicationCommandOptionType.String,
                description: 'The reason why you want to warn.',
                minLength: 1,
                maxLength: 256,
                required: true,
            },
        ],
    },
    metadata: {
        required_run_context: CustomInteractionRunContext.Guild,
        required_access_level: CustomInteractionAccessLevel.Moderators,
    },
    handler: async (discord_client, interaction) => {
        if (!interaction.isChatInputCommand()) return;
        if (!interaction.inCachedGuild()) return;
        if (!interaction.channel) return;

        await interaction.deferReply({ ephemeral: false });

        const staff_member = interaction.member;
        const member_to_warn = interaction.options.getMember('member');
        const warn_reason = interaction.options.getString('reason', true);

        /* handle when a reason is not specified */
        if (typeof warn_reason !== 'string' || warn_reason.length < 1) {
            await interaction.editReply({
                content: 'You must specify a reason for the warn!',
            }).catch(console.warn);

            return;
        }

        /* handle when a member is not specified */
        if (!member_to_warn) {
            await interaction.editReply({
                content: 'The user you specified is not a member of this server!',
            }).catch(console.warn);

            return;
        }

        /* handle when a staff member specifies themself */
        if (staff_member.id === member_to_warn.id) {
            await interaction.editReply({
                content: 'You aren\'t allowed to warn yourself!',
            }).catch(console.warn);

            return;
        }

        /* handle when a staff member specifies this bot */
        if (member_to_warn.id === discord_client.user?.id) {
            await interaction.editReply({
                content: 'You aren\'t allowed to warn me!',
            }).catch(console.warn);
            return;
        }

        /* handle when a staff member specifies the guild owner */
        if (member_to_warn.id === interaction.guild.ownerId) {
            await interaction.editReply({
                content: 'You aren\'t allowed to warn the owner of this server!',
            }).catch(console.warn);

            return;
        }

        /* handle when a staff member tries to moderate someone with an equal/higher role */
        if (staff_member.roles.highest.comparePositionTo(member_to_warn.roles.highest) <= 0) {
            await interaction.editReply({
                content: 'You aren\'t allowed to warn someone with an equal/higher role!',
            }).catch(console.warn);

            return;
        }

        const moderation_message_options = {
            content: [
                `${member_to_warn}`,
                `You were warned in the Inertia Lighting discord by ${staff_member.user} for:`,
                '\`\`\`',
                Discord.escapeMarkdown(warn_reason),
                '\`\`\`',
            ].join('\n'),
        };

        /* dm the member */
        try {
            const dm_channel = await member_to_warn.createDM();
            await dm_channel.send(moderation_message_options);
        } catch {
            // ignore any errors since the member might have their dms disabled or blocked
        }

        /* message the member in the server */
        await interaction.editReply(moderation_message_options).catch(console.warn);

         /* log to the database */
         const successfully_logged_to_database = await addModerationActionToDatabase({
            discord_user_id: member_to_warn.id,
        }, {
            type: ModerationActionType.Warn,
            epoch: Date.now(),
            reason: warn_reason,
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
