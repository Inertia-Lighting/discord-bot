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

enum IdentityType {
    Roblox = 'robloxId',
    // eslint-disable-next-line no-shadow
    Discord = 'discordId',
}

// ------------------------------------------------------------//

const regex_user_id_filter = /^\d+$/;

// ------------------------------------------------------------//

export default new CustomInteraction({
    identifier: 'manage_user_identity',
    type: Discord.InteractionType.ApplicationCommand,
    data: {
        type: Discord.ApplicationCommandType.ChatInput,
        description: 'Used by staff to manage user identity.',
        options: [
            {
                name: 'current_id_type',
                type: Discord.ApplicationCommandOptionType.String,
                description: 'The identity type to find and modify.',
                choices: [
                    {
                        name: 'Discord',
                        value: IdentityType.Discord,
                    },
                    {
                        name: 'Roblox',
                        value: IdentityType.Roblox,
                    },
                ],
                required: true,
            }, {
                name: 'current_id',
                type: Discord.ApplicationCommandOptionType.String,
                description: 'The identity id to find and modify.',
                required: true,
            }, {
                name: 'new_id_type',
                type: Discord.ApplicationCommandOptionType.String,
                description: 'The identity type to modify.',
                choices: [
                    {
                        name: 'Discord',
                        value: IdentityType.Discord,
                    },
                    {
                        name: 'Roblox',
                        value: IdentityType.Roblox,
                    },
                ],
                required: true,
            }, {
                name: 'new_id',
                type: Discord.ApplicationCommandOptionType.String,
                description: 'The identity id to set.',
                required: true,
            },
            {
                name: 'reason',
                type: Discord.ApplicationCommandOptionType.String,
                description: 'Reason for the update.',
                required: true,
            },
        ],
    },
    metadata: {
        required_run_context: CustomInteractionRunContext.Guild,
        required_access_level: CustomInteractionAccessLevel.CustomerService,
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
        const current_id_type = interaction.options.getString('current_id_type', true) as IdentityType;
        const current_id = interaction.options.getString('current_id', true);
        const new_id_type = interaction.options.getString('new_id_type', true) as IdentityType;
        const new_id = interaction.options.getString('new_id', true);
        const reason = interaction.options.getString('reason', true);

        // check if user-specified `current_id_type` is a valid `IdentityType`
        if (!Object.values(IdentityType).includes(current_id_type)) {
            await interaction.editReply({
                embeds: [
                    CustomEmbed.from({
                        color: CustomEmbed.Color.Yellow,
                        title: 'Inertia Lighting | Identity Manager',
                        description: `Invalid Current Id Type: \`${current_id_type}\``,
                    }),
                ],
            });

            return;
        }

        // check if the user-specified `current_id` is valid
        const current_id_is_valid = regex_user_id_filter.test(current_id);
        if (!current_id_is_valid) {
            await interaction.editReply({
                embeds: [
                    CustomEmbed.from({
                        color: CustomEmbed.Color.Yellow,
                        title: 'Inertia Lighting | Identity Manager',
                        description: `Invalid Current Id: \`${current_id}\``,
                    }),
                ],
            });

            return;
        }

        // check if user-specified `new_id_type` is a valid `IdentityType`
        if (!Object.values(IdentityType).includes(new_id_type)) {
            await interaction.editReply({
                embeds: [
                    CustomEmbed.from({
                        color: CustomEmbed.Color.Yellow,
                        title: 'Inertia Lighting | Identity Manager',
                        description: `Invalid New Id Type: \`${new_id_type}\``,
                    }),
                ],
            });

            return;
        }

        // check if user-specified `new_id` is valid
        const new_id_is_valid = regex_user_id_filter.test(new_id);
        if (!new_id_is_valid) {
            await interaction.editReply({
                embeds: [
                    CustomEmbed.from({
                        color: CustomEmbed.Color.Yellow,
                        title: 'Inertia Lighting | Identity Manager',
                        description: `Invalid New Id: \`${new_id}\``,
                    }),
                ],
            });

            return;
        }

        // fetch the user document to modify from the database
        const db_user_data = await prisma.user.findFirst({
            where: { 
                [current_id_type]: current_id 
            },
            select: {
                discordId: true,
                robloxId: true,
            },
        });

        if (!db_user_data) {
            await interaction.editReply({
                embeds: [
                    CustomEmbed.from({
                        color: CustomEmbed.Color.Yellow,
                        title: 'Inertia Lighting | Identity Manager',
                        description: `Unable to find user in database matching identity: \`${Object.keys(IdentityType).find(key => IdentityType[key as keyof typeof IdentityType] === current_id_type)}\` \`${current_id}\``,
                    }),
                ],
            });

            return;
        }

        // ensure that the new identity is not already in the database
        const db_user_data_with_new_identity = await prisma.user.findFirst({
            where: {
                [new_id_type]: new_id,
            },
            select: {
                discordId: true,
                robloxId: true,
            },
        });

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

        // attempt to update the user's identity
        try {
            await prisma.user.update({
                where: current_id_type === 'discordId' ? { discordId: current_id } : { robloxId: current_id },
                data: {
                    [new_id_type]: new_id,
                },
            });
            //await go_mongo_db.update(db_database_name, db_users_collection_name, user_update_filter, db_user_data_update_document);
        } catch (error: unknown) {
            console.trace('Failed to update the user\'s identity:', error);

            await interaction.editReply({
                embeds: [
                    CustomEmbed.from({
                        color: CustomEmbed.Color.Red,
                        title: 'Inertia Lighting | Identity Manager',
                        description: [
                            'Failed to update the user\'s identity.',
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

            return;
        }

        // send a success message
        await interaction.editReply({
            embeds: [
                CustomEmbed.from({
                    color: CustomEmbed.Color.Green,
                    title: 'Inertia Lighting | Identity Manager',
                    description: [
                        'Successfully updated the user\'s identity.',
                        '',
                        '**Identity Before:**',
                        '```json',
                        JSON.stringify(db_user_data, null, 4),
                        '```',
                        '',
                        '**Changes Made:**',
                        '```json',
                        JSON.stringify({ [new_id_type]: new_id }, null, 4),
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
                        `${Discord.userMention(staff_member.id)} updated a user's identity.`,
                        '',
                        '**Identity Before:**',
                        '```json',
                        JSON.stringify(db_user_data, null, 4),
                        '```',
                        '',
                        '**Changes Made:**',
                        '```json',
                        JSON.stringify({ [new_id_type]: new_id }, null, 4),
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
    },
});
