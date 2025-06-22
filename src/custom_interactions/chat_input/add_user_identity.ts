// ------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
// ------------------------------------------------------------//

import { CustomInteraction, CustomInteractionAccessLevel, CustomInteractionRunContext } from '@root/common/managers/custom_interactions_manager';
import { CustomEmbed } from '@root/common/message';
import { go_mongo_db } from '@root/common/mongo/mongo';
import { DbUserData } from '@root/types';
import * as Discord from 'discord.js';

// ------------------------------------------------------------//

const db_database_name = `${process.env.MONGO_DATABASE_NAME ?? ''}`;
if (db_database_name.length < 1) throw new Error('Environment variable: MONGO_DATABASE_NAME; is not set correctly.');

const db_users_collection_name = `${process.env.MONGO_USERS_COLLECTION_NAME ?? ''}`;
if (db_users_collection_name.length < 1) throw new Error('Environment variable: MONGO_USERS_COLLECTION_NAME; is not set correctly.');

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

        await interaction.deferReply();

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

        // create the update filter based on the provided information
        const db_user_discord_identity_update_filter = {
            'identity.discord_user_id': new_discord_id,
        };
        const db_user_roblox_identity_update_filter = {
            'identity.roblox_user_id': new_roblox_id,
        };
        // ensure that the new identity is not already in the database
        const db_user_discord_identity_with_new_identity_find_cursor = await go_mongo_db.find(db_database_name, db_users_collection_name, db_user_discord_identity_update_filter, {
            projection: {
                '_id': false,
            },
        });

        const db_user_roblox_identity_with_new_identity_find_cursor = await go_mongo_db.find(db_database_name, db_users_collection_name, db_user_roblox_identity_update_filter, {
            projection: {
                '_id': false,
            },
        });

        // search for Discord ID
        const db_user_discord_identity_with_new_identity = await db_user_discord_identity_with_new_identity_find_cursor.next() as unknown as Exclude<DbUserData, '_id'> | null;

        // search for roblox ID
        const db_user_user_roblox_identity_with_new_identity = await db_user_roblox_identity_with_new_identity_find_cursor.next() as unknown as Exclude<DbUserData, '_id'> | null;

        // discord check
        if (db_user_discord_identity_with_new_identity) {
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
                            JSON.stringify(db_user_discord_identity_with_new_identity.identity, null, 4),
                            '```',
                        ].join('\n'),
                    }),
                ],
            });

            return;
        }

        // roblox check
        if (db_user_user_roblox_identity_with_new_identity) {
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
                            JSON.stringify(db_user_user_roblox_identity_with_new_identity.identity, null, 4),
                            '```',
                        ].join('\n'),
                    }),
                ],
            });

            return;
        }

        // create document for the user
        const db_user_data_update_document = {
            '$set': {
                'identity.discord_user_id': new_discord_id,
                'identity.roblox_user_id': new_roblox_id,
            },
        };

        // attempt to add the user's identity
        try {
            await go_mongo_db.add(db_database_name, db_users_collection_name, [ db_user_data_update_document ]);
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

            return;
        }

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
                        JSON.stringify(db_user_data_update_document, null, 4),
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
                        JSON.stringify(db_user_data_update_document, null, 4),
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
