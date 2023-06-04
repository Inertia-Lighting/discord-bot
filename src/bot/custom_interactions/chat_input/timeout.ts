//------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
//------------------------------------------------------------//

//---------------------------------------------------------------------------------------------------------------//

import * as Discord from 'discord.js';

import { CustomInteraction, CustomInteractionAccessLevel } from '@root/bot/common/managers/custom_interactions_manager';

import { ModerationActionType, addModerationActionToDatabase } from '@root/bot/handlers/moderation_action_handler';

//---------------------------------------------------------------------------------------------------------------//

export default new CustomInteraction({
    identifier: 'timeout',
    type: Discord.InteractionType.ApplicationCommand,
    data: {
        type: Discord.ApplicationCommandType.ChatInput,
        description: 'Purges a specified amount of messages from the channel.',
        options: [
            {
                name: 'member',
                type: Discord.ApplicationCommandOptionType.User,
                description: 'The member to timeout.',
                required: true,
            }, {
                name: 'duration',
                type: Discord.ApplicationCommandOptionType.Integer,
                description: 'The duration of the timeout.',
                choices: [
                    {
                        name: '5 Minutes',
                        value: 5 * 60_000,
                    }, {
                        name: '15 Minutes',
                        value: 15 * 60_000,
                    }, {
                        name: '30 Minutes',
                        value: 10 * 60_000,
                    }, {
                        name: '1 Hour',
                        value: 60 * 60_000,
                    }, {
                        name: '5 Hours',
                        value: 5 * 60 * 60_000,
                    }, {
                        name: '24 Hours',
                        value: 24 * 60 * 60_000,
                    }, {
                        name: '1 Week',
                        value: 7 * 24 * 60 * 60_000,
                    },
                ],
                required: true,
            }, {
                name: 'reason',
                type: Discord.ApplicationCommandOptionType.String,
                description: 'The reason for the timeout.',
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

        const staff_member = await interaction.guild.members.fetch(interaction.user.id);
        if (!staff_member) return; // this should never happen

        const member_to_timeout = await interaction.guild.members.fetch({
            user: interaction.options.getUser('member', true),
        });
        const duration = interaction.options.getInteger('duration', true); // in milliseconds
        const reason = interaction.options.getString('reason', true);

        /* handle when a staff member specifies themself */
        if (interaction.user.id === member_to_timeout.id) {
            await interaction.editReply({
                embeds: [
                    {
                        color: 0xFFFF00,
                        description: 'You aren\'t allowed to timeout yourself!',
                    },
                ],
            }).catch(console.warn);
            return;
        }

        /* handle when a staff member specifies this bot */
        if (member_to_timeout.id === interaction.client.user?.id) {
            await interaction.editReply({
                embeds: [
                    {
                        color: 0xFFFF00,
                        description: 'You aren\'t allowed to timeout me!',
                    },
                ],
            }).catch(console.warn);
            return;
        }

        /* handle when a staff member specifies the guild owner */
        if (member_to_timeout.id === interaction.guild.ownerId) {
            await interaction.editReply({
                embeds: [
                    {
                        color: 0xFFFF00,
                        description: 'You aren\'t allowed to timeout the owner of this server!',
                    },
                ],
            });
            return;
        }

        /* handle when a staff member tries to moderate someone with an equal/higher role */
        if (staff_member.roles.highest.comparePositionTo(member_to_timeout.roles.highest) <= 0) {
            await interaction.editReply({
                embeds: [
                    {
                        color: 0xFFFF00,
                        description: 'You aren\'t allowed to timeout someone with an equal/higher role!',
                    },
                ],
            }).catch(console.warn);
            return;
        }

        try {
            await member_to_timeout.timeout(duration, reason);
        } catch (error) {
            console.trace(error);

            await interaction.editReply({
                embeds: [
                    {
                        color: 0xFF0000,
                        description: 'An error occurred while trying to timeout this user!',
                    },
                ],
            }).catch(console.warn);

            return;
        }

        const moderation_message_options = {
            content: [
                `${member_to_timeout}`,
                `You were put in timeout by ${staff_member} for ${duration / 60_000} minutes for:`,
                '\`\`\`',
                `${reason}`,
                '\`\`\`',
            ].join('\n'),
        };

        /* dm the member */
        try {
            const dm_channel = await interaction.client.users.createDM(member_to_timeout.id);
            await dm_channel.send(moderation_message_options);
        } catch {
            // ignore any errors
        }

        /* message the member in the server */
        await interaction.editReply(moderation_message_options).catch(console.warn);

        /* log to the database */
        await addModerationActionToDatabase({
            discord_user_id: member_to_timeout.id,
        }, {
            type: ModerationActionType.Timeout,
            epoch: Date.now(),
            reason: `${reason} (duration: ${duration / 60_000} minutes)`,
            staff_member_id: staff_member.id,
        });
    },
});
