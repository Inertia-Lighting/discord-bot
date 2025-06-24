// ------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
// ------------------------------------------------------------//

import { CustomInteraction, CustomInteractionAccessLevel, CustomInteractionRunContext } from '@root/common/managers/custom_interactions_manager';
import { CustomEmbed } from '@root/common/message';
import prisma from '@root/lib/prisma_client';
import * as Discord from 'discord.js';

// ------------------------------------------------------------//

const bot_support_staff_database_role_id = `${process.env.BOT_SUPPORT_STAFF_DATABASE_ROLE_ID ?? ''}`;
if (bot_support_staff_database_role_id.length < 1) throw new Error('Environment variable: BOT_SUPPORT_STAFF_DATABASE_ROLE_ID; is not set correctly.');

const bot_logging_identity_manager_channel_id = `${process.env.BOT_LOGGING_IDENTITY_MANAGER_CHANNEL_ID ?? ''}`;
if (bot_logging_identity_manager_channel_id.length < 1) throw new Error('Environment variable: BOT_LOGGING_IDENTITY_MANAGER_CHANNEL_ID; is not set correctly.');

// ------------------------------------------------------------//

const regex_user_id_filter = /^\d+$/;

// ------------------------------------------------------------//

export default new CustomInteraction({
    identifier: 'add_user_identity',
    type: Discord.InteractionType.ApplicationCommand,
    data: {
        type: Discord.ApplicationCommandType.ChatInput,
        description: 'Used by staff to manage user identity.',
        options: [
            {
                name: 'new_roblox_id',
                type: Discord.ApplicationCommandOptionType.String,
                description: 'Roblox ID for new user.',
                required: true,
            },
            {
                name: 'new_discord_id',
                type: Discord.ApplicationCommandOptionType.String,
                description: 'Discord ID for new user.',
                required: true,
            },
            {
                name: 'reason',
                type: Discord.ApplicationCommandOptionType.String,
                description: 'Reason for adding the user.',
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

        await interaction.deferReply({ flags: ['Ephemeral'] });

        // ensure the user running this command is authorized to do so
        const staff_member = interaction.member;
        const staff_member_is_permitted = staff_member.roles.cache.has(bot_support_staff_database_role_id);
        if (!staff_member_is_permitted) {
            await interaction.editReply({
                embeds: [
                    CustomEmbed.from({
                        color: CustomEmbed.Color.Violet,
                        title: 'Inertia Lighting | Identity Manager',
                        description: 'You aren\'t allowed to use this command!',
                    }),
                ],
            });

            return;
        }

        // ensure the logging channel exists and is text-based
        const logging_channel = await interaction.client.channels.fetch(bot_logging_identity_manager_channel_id);
        if (!logging_channel) throw new Error('Unable to find the identity manager logging channel!');
        if (!logging_channel.isTextBased()) throw new Error('The identity manager logging channel is not text-based!');
        if(!logging_channel.isSendable()) throw new Error('The identity manager logging channel is not sendable!');

        // get the specified command options
        const new_roblox_id = interaction.options.getString('new_roblox_id', true);
        const new_discord_id = interaction.options.getString('new_discord_id', true);
        const reason = interaction.options.getString('reason', true);

        // check if the new IDs are valid
        if (!regex_user_id_filter.test(new_discord_id) || !regex_user_id_filter.test(new_roblox_id)) {
            await interaction.editReply({
                embeds: [
                    CustomEmbed.from({
                        color: CustomEmbed.Color.Yellow,
                        title: 'Inertia Lighting | Identity Manager',
                        description: `Invalid id given: \n \`Discord: ${new_discord_id}\` \n \`Roblox: ${new_roblox_id}\``,
                    }),
                ],
            });

            return;
        }

        // search for discord ID and roblox ID 
        const db_user_data_with_new_identity = await prisma.user.findFirst({
            where: {
                OR: [
                    { discordId: new_discord_id },
                    { robloxId: new_roblox_id },
                ]
            },
            select: {
                id: true,
                discordId: true,
                robloxId: true,
            },
        });

        // check if discord ID and roblox ID already exists in the database
        if (db_user_data_with_new_identity) {
            await interaction.editReply({
                embeds: [
                    CustomEmbed.from({
                        color: CustomEmbed.Color.Red,
                        title: 'Inertia Lighting | Identity Manager',
                        description: [
                            'Specified new identity is already in the database.',
                            '',
                            '**Identity:**',
                            '```json',
                            JSON.stringify(db_user_data_with_new_identity, null, 4),
                            '```',
                        ].join('\n'),
                    }),
                ],
            });

            return;
        }

        // attempt to add the user's identity
        try {
            const db_new_user_data_document = await prisma.user.create({
                data: {
                    discordId: new_discord_id,
                    robloxId: new_roblox_id,
                },
            });

            // send a success message
            await interaction.editReply({
                embeds: [
                    CustomEmbed.from({
                        color: CustomEmbed.Color.Green,
                        title: 'Inertia Lighting | Identity Manager',
                        description: [
                            'Successfully added the user\'s identity.',
                            '',
                            '**Added Identity:**',
                            '```json',
                            JSON.stringify(db_new_user_data_document, null, 4),
                            '```',
                        ].join('\n'),
                    }),
                ],
            });

            // log the identity change
            await logging_channel.send({
                embeds: [
                    CustomEmbed.from({
                        color: CustomEmbed.Color.Brand,
                        title: 'Inertia Lighting | Identity Manager',
                        description: [
                            `${Discord.userMention(staff_member.id)} added a an identity to the database.`,
                            '',
                            '**Added Identity:**',
                            '```json',
                            JSON.stringify(db_new_user_data_document, null, 4),
                            '```',
                            '',
                            '**Reason:**',
                            '```',
                            reason,
                            '```',
                        ].join('\n'),
                    }),
                ],
            });
        } catch (error: unknown) {
            console.trace('Failed to add the user\'s identity:', error);

            await interaction.editReply({
                embeds: [
                    CustomEmbed.from({
                        color: CustomEmbed.Color.Red,
                        title: 'Inertia Lighting | Identity Manager',
                        description: [
                            'Failed to add the user\'s identity.',
                            '',
                            '```',
                            `${error}`.slice(0, 512), // limit the error message to 512 characters
                            '```',
                            '',
                            'Common reasons for this error:',
                            '- The new identity is already in the database.',
                        ].join('\n'),
                    }),
                ],
            });
        }
    },
});
