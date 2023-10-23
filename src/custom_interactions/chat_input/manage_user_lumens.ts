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

//------------------------------------------------------------//

enum ManageLumensAction {
    Add = 'add',
    Remove = 'remove',
    Set = 'set',
}

//------------------------------------------------------------//

export default new CustomInteraction({
    identifier: 'manage_user_lumens',
    type: Discord.InteractionType.ApplicationCommand,
    data: {
        type: Discord.ApplicationCommandType.ChatInput,
        description: 'Used by staff to manage user lumens.',
        options: [
            {
                name: 'for',
                type: Discord.ApplicationCommandOptionType.User,
                description: 'The member who you want to manage lumens for.',
                required: true,
            }, {
                name: 'action',
                type: Discord.ApplicationCommandOptionType.String,
                description: 'The action you want to perform.',
                choices: [
                    {
                        name: 'Add',
                        value: ManageLumensAction.Add,
                    }, {
                        name: 'Remove',
                        value: ManageLumensAction.Remove,
                    }, {
                        name: 'Set',
                        value: ManageLumensAction.Set,
                    },
                ],
                required: true,
            }, {
                name: 'amount',
                type: Discord.ApplicationCommandOptionType.Integer,
                description: 'The amount of lumens to add, remove, or set.',
                minValue: 0,
                maxValue: 1_000_000,
                required: true,
            }, {
                name: 'reason',
                type: Discord.ApplicationCommandOptionType.String,
                description: 'The reason why you want to manage lumens.',
                minLength: 1,
                maxLength: 256,
                required: true,
            },
        ],
    },
    metadata: {
        required_run_context: CustomInteractionRunContext.Guild,
        required_access_level: CustomInteractionAccessLevel.TeamLeaders, /** @todo make this available to admins once ready */
    },
    handler: async (discord_client, interaction) => {
        if (!interaction.isChatInputCommand()) return;
        if (!interaction.inCachedGuild()) return;

        await interaction.deferReply();

        const user_to_modify = interaction.options.getUser('for', true);
        const action_to_perform = interaction.options.getString('action', true) as ManageLumensAction;
        const amount_to_modify_by = interaction.options.getInteger('amount', true);
        const reason = interaction.options.getString('reason', true);

        /* ensure the action to perform is valid */
        if (!Object.values(ManageLumensAction).includes(action_to_perform)) {
            await interaction.editReply({
                embeds: [
                    CustomEmbed.from({
                        color: CustomEmbed.Color.Yellow,
                        description: `Invalid action: \`${action_to_perform}\``,
                    }),
                ],
            }).catch(console.warn);

            return;
        }

        /* find the user in the database */
        const db_user_data_find_cursor = await go_mongo_db.find(db_database_name, db_users_collection_name, {
            'identity.discord_user_id': user_to_modify.id,
        }, {
            projection: {
                '_id': false,
            },
        });

        const db_user_data = await db_user_data_find_cursor.next() as unknown as DbUserData | null;

        /* check if the user exists */
        if (!db_user_data) {
            await interaction.editReply({
                embeds: [
                    CustomEmbed.from({
                        color: CustomEmbed.Color.Yellow,
                        description: `${user_to_modify} does not exist in the database!`,
                    }),
                ],
            }).catch(console.warn);

            return;
        }

        const initial_amount: number = db_user_data.lumens ?? 0;

        let updated_amount: number;
        switch (action_to_perform) {
            case 'add': {
                updated_amount = initial_amount + amount_to_modify_by;
                break;
            }

            case 'remove': {
                updated_amount = initial_amount - amount_to_modify_by;
                break;
            }

            case 'set': {
                updated_amount = amount_to_modify_by;
                break;
            }

            default: {
                await interaction.editReply({
                    embeds: [
                        CustomEmbed.from({
                            color: CustomEmbed.Color.Red,
                            description: `Invalid action: \`${action_to_perform}\``,
                        }),
                    ],
                }).catch(console.warn);

                return;
            }
        }

        /* prevent decimals */
        updated_amount = Math.floor(updated_amount);

        const amount_too_small = updated_amount <= Number.MIN_SAFE_INTEGER;
        if (amount_too_small) {
            await interaction.editReply({
                embeds: [
                    CustomEmbed.from({
                        color: CustomEmbed.Color.Yellow,
                        description: 'New amount is too small!',
                    }),
                ],
            }).catch(console.warn);

            return;
        }

        const amount_too_large = updated_amount >= Number.MAX_SAFE_INTEGER;
        if (amount_too_large) {
            await interaction.editReply({
                embeds: [
                    CustomEmbed.from({
                        color: CustomEmbed.Color.Yellow,
                        description: 'New amount is too large!',
                    }),
                ],
            }).catch(console.warn);

            return;
        }

        const amount_is_not_a_number = Number.isNaN(updated_amount);
        if (amount_is_not_a_number) {
            await interaction.editReply({
                embeds: [
                    CustomEmbed.from({
                        color: CustomEmbed.Color.Yellow,
                        description: 'New amount is not a valid number!',
                    }),
                ],
            }).catch(console.warn);

            return;
        }

        /* update the user */
        try {
            await go_mongo_db.update(db_database_name, db_users_collection_name, {
                'identity.discord_user_id': db_user_data.identity.discord_user_id,
                'identity.roblox_user_id': db_user_data.identity.roblox_user_id,
            }, {
                $set: {
                    'lumens': updated_amount,
                },
            });
        } catch (error) {
            console.trace(error);

            await interaction.editReply({
                embeds: [
                    CustomEmbed.from({
                        color: CustomEmbed.Color.Red,
                        description: 'An error occurred while attempting to update the user!',
                    }),
                ],
            }).catch(console.warn);

            return;
        }

        await interaction.editReply({
            embeds: [
                CustomEmbed.from({
                    color: action_to_perform === ManageLumensAction.Add ? (
                        CustomEmbed.Color.Green
                    ) : action_to_perform === ManageLumensAction.Remove ? (
                        CustomEmbed.Color.Red
                    ) : (
                        CustomEmbed.Color.Brand
                    ),
                    author: {
                        icon_url: `${discord_client.user.displayAvatarURL({ forceStatic: false })}`,
                        name: 'Inertia Lighting | Lumens System',
                    },
                    description: [
                        action_to_perform === ManageLumensAction.Add ? (
                            `Added \`${amount_to_modify_by}\` lumens to ${user_to_modify}.`
                        ) : action_to_perform === ManageLumensAction.Remove ? (
                            `Removed \`${amount_to_modify_by}\` lumens from ${user_to_modify}.`
                        ) : (
                            `Set ${user_to_modify}'s lumens to a new amount.`
                        ),
                        `New amount of lumens: \`${updated_amount}\``,
                    ].join('\n'),
                    fields: [
                        {
                            name: 'Reason',
                            value: Discord.escapeMarkdown(reason),
                            inline: false,
                        },
                    ],
                }),
            ],
        }).catch(console.warn);
    },
});
