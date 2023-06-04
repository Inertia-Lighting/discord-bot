//------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
//------------------------------------------------------------//

import * as Discord from 'discord.js';

import { go_mongo_db } from '@root/mongo/mongo';

import { CustomEmbed } from '@root/bot/common/message';

import { CustomInteraction, CustomInteractionAccessLevel } from '@root/bot/common/managers/custom_interactions_manager';

//------------------------------------------------------------//

const db_database_name = `${process.env.MONGO_DATABASE_NAME ?? ''}`;
if (db_database_name.length < 1) throw new Error('Environment variable: MONGO_DATABASE_NAME; is not set correctly.');

const db_users_collection_name = `${process.env.MONGO_USERS_COLLECTION_NAME ?? ''}`;
if (db_users_collection_name.length < 1) throw new Error('Environment variable: MONGO_USERS_COLLECTION_NAME; is not set correctly.');

//------------------------------------------------------------//

export default new CustomInteraction({
    identifier: 'manage_karma',
    type: Discord.InteractionType.ApplicationCommand,
    data: {
        type: Discord.ApplicationCommandType.ChatInput,
        description: 'Manages a user\'s karma.',
        options: [
            {
                name: 'for',
                type: Discord.ApplicationCommandOptionType.User,
                description: 'The member who you want to manage karma for.',
                required: true,
            }, {
                name: 'action',
                type: Discord.ApplicationCommandOptionType.String,
                description: 'The action you want to perform.',
                choices: [
                    {
                        name: 'Add',
                        value: 'add',
                    }, {
                        name: 'Remove',
                        value: 'remove',
                    }, {
                        name: 'Set',
                        value: 'set',
                    },
                ],
                required: true,
            }, {
                name: 'amount',
                type: Discord.ApplicationCommandOptionType.Integer,
                description: 'The amount of karma to add, remove, or set.',
                minValue: 0,
                maxValue: 1_000_000,
                required: true,
            }, {
                name: 'reason',
                type: Discord.ApplicationCommandOptionType.String,
                description: 'The reason why you want to manage karma.',
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

        await interaction.deferReply();

        const user_to_modify = interaction.options.getUser('for', true);
        const action_to_perform = interaction.options.getString('action', true);
        const amount_to_modify_by = interaction.options.getInteger('amount', true);
        const reason = interaction.options.getString('reason', true);

        /* find the user in the database */
        const [ db_user_data ] = await go_mongo_db.find(db_database_name, db_users_collection_name, {
            'identity.discord_user_id': user_to_modify.id,
        }, {
            projection: {
                '_id': false,
            },
        });

        /* check if the user exists */
        if (!db_user_data) {
            interaction.editReply({
                embeds: [
                    CustomEmbed.from({
                        color: CustomEmbed.colors.YELLOW,
                        description: `${user_to_modify} does not exist in the database!`,
                    }),
                ],
            }).catch(console.warn);

            return;
        }

        const initial_karma_amount: number = db_user_data.karma ?? 0;

        let updated_karma_amount;
        switch (action_to_perform) {
            case 'add': {
                updated_karma_amount = initial_karma_amount + amount_to_modify_by;
                break;
            }

            case 'remove': {
                updated_karma_amount = initial_karma_amount - amount_to_modify_by;
                break;
            }

            case 'set': {
                updated_karma_amount = amount_to_modify_by;
                break;
            }

            default: {
                interaction.editReply({
                    embeds: [
                        CustomEmbed.from({
                            color: CustomEmbed.colors.RED,
                            description: `Invalid action: \`${action_to_perform}\``,
                        }),
                    ],
                }).catch(console.warn);
                return;
            }
        }

        /* prevent decimals */
        updated_karma_amount = Math.floor(updated_karma_amount);

        const karma_too_small = updated_karma_amount <= Number.MIN_SAFE_INTEGER;
        if (karma_too_small) {
            interaction.editReply({
                embeds: [
                    CustomEmbed.from({
                        color: CustomEmbed.colors.YELLOW,
                        description: 'New karma amount is too small!',
                    }),
                ],
            }).catch(console.warn);

            return;
        }

        const karma_too_large = updated_karma_amount >= Number.MAX_SAFE_INTEGER;
        if (karma_too_large) {
            interaction.editReply({
                embeds: [
                    CustomEmbed.from({
                        color: CustomEmbed.colors.YELLOW,
                        description: 'New karma amount is too large!',
                    }),
                ],
            }).catch(console.warn);

            return;
        }

        const karma_is_not_a_number = Number.isNaN(updated_karma_amount);
        if (karma_is_not_a_number) {
            interaction.editReply({
                embeds: [
                    CustomEmbed.from({
                        color: CustomEmbed.colors.YELLOW,
                        description: 'New karma amount is not a valid number!',
                    }),
                ],
            }).catch(console.warn);

            return;
        }

        try {
            await go_mongo_db.update(db_database_name, db_users_collection_name, {
                'identity.discord_user_id': db_user_data.identity.discord_user_id,
                'identity.roblox_user_id': db_user_data.identity.roblox_user_id,
            }, {
                $set: {
                    'karma': updated_karma_amount,
                },
            });
        } catch (error) {
            console.trace(error);

            interaction.editReply({
                embeds: [
                    CustomEmbed.from({
                        color: CustomEmbed.colors.RED,
                        author: {
                            icon_url: `${discord_client.user.displayAvatarURL({ forceStatic: false })}`,
                            name: 'Inertia Lighting | Karma System',
                        },
                        description: 'An error occurred while modifying the user\'s karma!',
                    }),
                ],
            }).catch(console.warn);

            return;
        }

        await interaction.editReply({
            embeds: [
                CustomEmbed.from({
                    color: action_to_perform === 'add' ? (
                        CustomEmbed.colors.GREEN
                    ) : action_to_perform === 'remove' ? (
                        CustomEmbed.colors.RED
                    ) : (
                        CustomEmbed.colors.BRAND
                    ),
                    author: {
                        icon_url: `${discord_client.user.displayAvatarURL({ forceStatic: false })}`,
                        name: 'Inertia Lighting | Karma System',
                    },
                    description: [
                        action_to_perform === 'add' ? (
                            `Added \`${amount_to_modify_by}\` karma to ${user_to_modify}.`
                        ) : action_to_perform === 'remove' ? (
                            `Removed \`${amount_to_modify_by}\` karma from ${user_to_modify}.`
                        ) : (
                            `Set ${user_to_modify}'s karma to a new amount.`
                        ),
                        `New karma amount: \`${updated_karma_amount}\``,
                    ].join('\n'),
                    fields: [
                        {
                            name: 'Reason',
                            value: `${reason}`,
                        },
                    ],
                }),
            ],
        }).catch(console.warn);
    },
});
