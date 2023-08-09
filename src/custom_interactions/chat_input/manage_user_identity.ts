//------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
//------------------------------------------------------------//

import * as Discord from 'discord.js';

import { DbUserData } from '@root/types';

import { go_mongo_db } from '@root/common/mongo/mongo';

import { CustomEmbed } from '@root/common/message';

import { CustomInteraction, CustomInteractionAccessLevel, CustomInteractionRunContext } from '@root/common/managers/custom_interactions_manager';

//------------------------------------------------------------//

const db_database_name = `${process.env.MONGO_DATABASE_NAME ?? ''}`;
if (db_database_name.length < 1) throw new Error('Environment variable: MONGO_DATABASE_NAME; is not set correctly.');

const db_users_collection_name = `${process.env.MONGO_USERS_COLLECTION_NAME ?? ''}`;
if (db_users_collection_name.length < 1) throw new Error('Environment variable: MONGO_USERS_COLLECTION_NAME; is not set correctly.');

const bot_support_staff_database_role_id = `${process.env.BOT_SUPPORT_STAFF_DATABASE_ROLE_ID ?? ''}`;
if (bot_support_staff_database_role_id.length < 1) throw new Error('Environment variable: BOT_SUPPORT_STAFF_DATABASE_ROLE_ID; is not set correctly.');

const bot_logging_identity_manager_channel_id = `${process.env.BOT_LOGGING_IDENTITY_MANAGER_CHANNEL_ID ?? ''}`;
if (bot_logging_identity_manager_channel_id.length < 1) throw new Error('Environment variable: BOT_LOGGING_IDENTITY_MANAGER_CHANNEL_ID; is not set correctly.');

//------------------------------------------------------------//

enum IdentityType {
    Roblox = 'roblox',
    Discord = 'discord',
}

//------------------------------------------------------------//

const regex_user_id_filter = /^\d+$/;

//------------------------------------------------------------//

export default new CustomInteraction({
    identifier: 'manage_user_identity',
    type: Discord.InteractionType.ApplicationCommand,
    data: {
        type: Discord.ApplicationCommandType.ChatInput,
        description: 'Used by staff to manage a user\'s identity.',
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
        ],
    },
    metadata: {
        required_run_context: CustomInteractionRunContext.Guild,
        required_access_level: CustomInteractionAccessLevel.CustomerService,
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
        const logging_channel = await interaction.guild.channels.fetch(bot_logging_identity_manager_channel_id);
        if (!logging_channel) throw new Error('Unable to find the identity manager logging channel!');
        if (!logging_channel.isTextBased()) throw new Error('The identity manager logging channel is not text-based!');

        // get the specified command options
        const current_id_type = interaction.options.getString('current_id_type', true) as IdentityType;
        const current_id = interaction.options.getString('current_id', true);
        const new_id_type = interaction.options.getString('new_id_type', true) as IdentityType;
        const new_id = interaction.options.getString('new_id', true);

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
        if (current_id_is_valid) {
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
        if (new_id_is_valid) {
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

        // create the update filter based on the provided information
        let user_update_filter: {
            'identity.discord_user_id': string;
        } | {
            'identity.roblox_user_id': string;
        };
        switch (current_id_type) {
            case IdentityType.Discord: {
                user_update_filter = {
                    'identity.discord_user_id': current_id,
                };

                break;
            }

            case IdentityType.Roblox: {
                user_update_filter = {
                    'identity.roblox_user_id': current_id,
                };

                break;
            }

            default: {
                throw new Error(`Mange User Identity: Invalid current_id_type: ${current_id_type}`);
            }
        }

        // fetch the user document to modify from the database
        const [ db_user_data_before_update ] = await go_mongo_db.find(db_database_name, db_users_collection_name, user_update_filter, {
            projection: {
                '_id': false,
            },
        }) as Exclude<DbUserData, '_id'>[];
        if (!db_user_data_before_update) {
            await interaction.editReply({
                embeds: [
                    CustomEmbed.from({
                        color: CustomEmbed.Color.Yellow,
                        title: 'Inertia Lighting | Identity Manager',
                        description: `Unable to find user in database matching identity: \`${current_id_type}\` \`${current_id}\``,
                    }),
                ],
            });

            return;
        }

        // create the update filter and update document based on the provided information
        let db_user_data_update_filter: {
            'identity.discord_user_id': string;
        } | {
            'identity.roblox_user_id': string;
        };
        let db_user_data_update_document: {
            '$set': {
                'identity.discord_user_id': string;
            };
        } | {
            '$set': {
                'identity.roblox_user_id': string;
            };
        };
        switch (new_id_type) {
            case IdentityType.Discord: {
                db_user_data_update_filter = {
                    'identity.discord_user_id': new_id,
                };

                db_user_data_update_document = {
                    '$set': {
                        'identity.discord_user_id': new_id,
                    },
                };

                break;
            }

            case IdentityType.Roblox: {
                db_user_data_update_filter = {
                    'identity.roblox_user_id': new_id,
                };

                db_user_data_update_document = {
                    '$set': {
                        'identity.roblox_user_id': new_id,
                    },
                };

                break;
            }

            default: {
                throw new Error(`Mange User Identity: Invalid new_id_type: ${new_id_type}`);
            }
        }

        // ensure that the new identity is not already in the database
        const [ db_user_data_with_new_identity ] = await go_mongo_db.find(db_database_name, db_users_collection_name, db_user_data_update_filter, {
            projection: {
                '_id': false,
            },
        }) as Exclude<DbUserData, '_id'>[];
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
                            JSON.stringify(db_user_data_with_new_identity.identity, null, 4),
                            '```',
                        ].join('\n'),
                    }),
                ],
            });

            return;
        }

        // attempt to update the user's identity
        try {
            await go_mongo_db.update(db_database_name, db_users_collection_name, user_update_filter, db_user_data_update_document);
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
                        JSON.stringify(db_user_data_before_update.identity, null, 4),
                        '```',
                        '',
                        '**Changes Made:**',
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
                        `${Discord.userMention(staff_member.id)} updated a user's identity.`,
                        '',
                        '**Identity Before:**',
                        '```json',
                        JSON.stringify(db_user_data_before_update.identity, null, 4),
                        '```',
                        '',
                        '**Changes Made:**',
                        '```json',
                        JSON.stringify(db_user_data_update_document, null, 4),
                        '```',
                    ].join('\n'),
                }),
            ],
        });
    },
});
