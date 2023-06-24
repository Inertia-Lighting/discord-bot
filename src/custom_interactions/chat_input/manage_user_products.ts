//------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
//------------------------------------------------------------//

import * as Discord from 'discord.js';

import { compareTwoStrings } from 'string-similarity';

import { DbProductData, DbUserData } from '@root/types';

import { go_mongo_db } from '@root/common/mongo/mongo';

import { CustomEmbed } from '@root/common/message';

import { CustomInteraction, CustomInteractionAccessLevel, CustomInteractionRunContext } from '@root/common/managers/custom_interactions_manager';

//------------------------------------------------------------//

const db_database_name = `${process.env.MONGO_DATABASE_NAME ?? ''}`;
if (db_database_name.length < 1) throw new Error('Environment variable: MONGO_DATABASE_NAME; is not set correctly.');

const db_products_collection_name = `${process.env.MONGO_PRODUCTS_COLLECTION_NAME ?? ''}`;
if (db_products_collection_name.length < 1) throw new Error('Environment variable: MONGO_PRODUCTS_COLLECTION_NAME; is not set correctly.');

const db_users_collection_name = `${process.env.MONGO_USERS_COLLECTION_NAME ?? ''}`;
if (db_users_collection_name.length < 1) throw new Error('Environment variable: MONGO_USERS_COLLECTION_NAME; is not set correctly.');

const db_database_support_staff_role_id = `${process.env.BOT_SUPPORT_STAFF_DATABASE_ROLE_ID ?? ''}`;
if (db_database_support_staff_role_id.length < 1) throw new Error('Environment variable: BOT_SUPPORT_STAFF_DATABASE_ROLE_ID; is not set correctly.');

const bot_logging_products_manager_channel_id = `${process.env.BOT_LOGGING_PRODUCTS_MANAGER_CHANNEL_ID ?? ''}`;
if (bot_logging_products_manager_channel_id.length < 1) throw new Error('Environment variable: BOT_LOGGING_PRODUCTS_MANAGER_CHANNEL_ID; is not set correctly.');

//------------------------------------------------------------//

enum ManageProductsAction {
    Add = 'add',
    Remove = 'remove',
}

//------------------------------------------------------------//

class DbProductsCache {
    public static readonly cache_lifetime_ms = 1 * 60_000; // 1 minute

    public static cache_expiration_epoch_ms = 0; // default to expired so it will be fetched on first call

    public static cache: DbProductData[] = [];

    public static async fetch(
        bypass_cache: boolean = false,
    ): Promise<DbProductData[]> {
        const now_epoch_ms = Date.now();

        if (
            bypass_cache ||
            this.cache_expiration_epoch_ms < now_epoch_ms
        ) {
            const db_roblox_products = await go_mongo_db.find(db_database_name, db_products_collection_name, {}) as unknown[] as DbProductData[];

            this.cache_expiration_epoch_ms = now_epoch_ms + this.cache_lifetime_ms;
            this.cache = db_roblox_products;

            return db_roblox_products;
        }

        return this.cache;
    }

}

//------------------------------------------------------------//

async function manageProductsAutoCompleteHandler(
    interaction: Discord.AutocompleteInteraction,
): Promise<void> {
    const db_roblox_products = await DbProductsCache.fetch(false);

    const user_id_to_modify = interaction.options.get('for')?.value; // required to be like this because of a weird discord.js bug
    const action_to_perform = interaction.options.getString('action') as ManageProductsAction;
    const focused_option = interaction.options.getFocused(true);

    /* ensure the user to modify is valid */
    if (typeof user_id_to_modify !== 'string') {
        await interaction.respond([]);

        return;
    }

    /* ensure the action to perform is valid */
    if (!Object.values(ManageProductsAction).includes(action_to_perform)) {
        await interaction.respond([]);

        return;
    }

    /* ensure the focused option is valid */
    if (focused_option.name !== 'product_code') {
        await interaction.respond([]);

        return;
    }

    const product_code_search_query = focused_option.value.toUpperCase();

    /* find the user in the database */
    const [ db_user_data ] = await go_mongo_db.find(db_database_name, db_users_collection_name, {
        'identity.discord_user_id': user_id_to_modify,
    }, {
        projection: {
            '_id': false,
        },
    }) as unknown[] as DbUserData[];

    if (!db_user_data) {
        await interaction.respond([]);

        return;
    }

    const filtered_db_roblox_products = db_roblox_products.filter(db_roblox_product => {
        const user_owns_product = Boolean(db_user_data.products[db_roblox_product.code]);

        return (
            (action_to_perform === ManageProductsAction.Add && !user_owns_product) ||
            (action_to_perform === ManageProductsAction.Remove && user_owns_product)
        );
    });

    if (filtered_db_roblox_products.length < 1) {
        await interaction.respond([]);

        return;
    }

    const mapped_db_roblox_products = [];
    for (const db_roblox_product of filtered_db_roblox_products) {
        mapped_db_roblox_products.push({
            ...db_roblox_product,
            similarity_score: compareTwoStrings(product_code_search_query, db_roblox_product.code),
        });
    }

    const matching_db_roblox_products = mapped_db_roblox_products.sort(
        (a, b) => b.similarity_score - a.similarity_score
    ).sort(
        (a, b) => {
            const first_char_of_query: string = product_code_search_query.at(0)!;

            if (a.code.startsWith(first_char_of_query) === b.code.startsWith(first_char_of_query)) return a.code.localeCompare(b.code);
            if (a.code.startsWith(first_char_of_query)) return -1;
            if (b.code.startsWith(first_char_of_query)) return 1;

            return 0;
        }
    ).filter(
        ({ similarity_score, code }, index) => product_code_search_query.length > 0 ? (
            similarity_score >= 0.25 || (similarity_score < 0.25 && index < 10)
        ) : true
    );

    if (matching_db_roblox_products.length === 0) {
        await interaction.respond([]);

        return;
    }

    interaction.respond(
        matching_db_roblox_products.slice(0, 5).map(db_roblox_product => ({
            name: db_roblox_product.code,
            value: db_roblox_product.code,
        }))
    );
}

async function manageProductsChatInputCommandHandler(
    interaction: Discord.ChatInputCommandInteraction,
): Promise<void> {
    if (!interaction.inCachedGuild()) return;

    await interaction.deferReply({ ephemeral: false });

    const interaction_guild_member = await interaction.guild.members.fetch(interaction.user.id);

    /* check if the user is allowed to use this command */
    const staff_member_is_permitted = interaction_guild_member.roles.cache.has(db_database_support_staff_role_id);
    if (!staff_member_is_permitted) {
        interaction.editReply({
            embeds: [
                CustomEmbed.from({
                    color: CustomEmbed.Color.Violet,
                    title: 'Inertia Lighting | Products Manager',
                    description: 'You aren\'t allowed to use this command!',
                }),
            ],
        }).catch(console.warn);

        return;
    }

    const user_to_modify = interaction.options.getUser('for', true);
    const action_to_perform = interaction.options.getString('action', true) as ManageProductsAction;
    const product_code = interaction.options.getString('product_code', true);
    const reason = interaction.options.getString('reason', true);

    /* ensure the action to perform is valid */
    if (!Object.values(ManageProductsAction).includes(action_to_perform)) {
        await interaction.editReply({
            embeds: [
                CustomEmbed.from({
                    color: CustomEmbed.Color.Yellow,
                    title: 'Inertia Lighting | Products Manager',
                    description: 'Invalid action to perform!',
                }),
            ],
        }).catch(console.warn);

        return;
    }

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
        await interaction.editReply({
            embeds: [
                CustomEmbed.from({
                    color: CustomEmbed.Color.Yellow,
                    title: 'Inertia Lighting | Products Manager',
                    description: `${user_to_modify} does not exist in the database!`,
                }),
            ],
        }).catch(console.warn);

        return;
    }

    /* check if the product code is valid */
    const db_roblox_products = await DbProductsCache.fetch(true);
    const db_roblox_product = db_roblox_products.find(db_roblox_product => db_roblox_product.code === product_code);
    if (!db_roblox_product) {
        interaction.followUp({
            embeds: [
                CustomEmbed.from({
                    color: CustomEmbed.Color.Yellow,
                    title: 'Inertia Lighting | Products Manager',
                    description: `\`${product_code}\` is not a valid product code!`,
                }),
            ],
        }).catch(console.warn);

        return;
    }

    /* modify the user's products */
    try {
        await go_mongo_db.update(db_database_name, db_users_collection_name, {
            'identity.discord_user_id': db_user_data.identity.discord_user_id,
            'identity.roblox_user_id': db_user_data.identity.roblox_user_id,
        }, {
            $set: {
                [`products.${db_roblox_product.code}`]: (action_to_perform === ManageProductsAction.Add ? true : false),
            },
        });
    } catch (error) {
        console.trace(error);

        await interaction.editReply({
            embeds: [
                CustomEmbed.from({
                    color: CustomEmbed.Color.Red,
                    title: 'Inertia Lighting | Products Manager',
                    description: 'An error occurred while modifying the user\'s products!',
                }),
            ],
        }).catch(console.warn);

        return;
    }

    /* log to the products manager logging channel */
    try {
        const logging_channel = await interaction.guild.channels.fetch(bot_logging_products_manager_channel_id);

        if (!logging_channel) throw new Error('Unable to find the products manager logging channel!');
        if (!logging_channel.isTextBased()) throw new Error('The products manager logging channel is not text-based!');

        await logging_channel.send({
            embeds: [
                CustomEmbed.from({
                    color: action_to_perform === ManageProductsAction.Add ? CustomEmbed.Color.Green : CustomEmbed.Color.Red,
                    title: 'Inertia Lighting | Products Manager',
                    description: `${interaction.user} ${action_to_perform === ManageProductsAction.Add ? 'added' : 'removed'} \`${db_roblox_product.code}\` ${action_to_perform === ManageProductsAction.Add ? 'to' : 'from'} ${user_to_modify}.`,
                    fields: [
                        {
                            name: 'Reason',
                            value: Discord.escapeMarkdown(reason),
                        },
                    ],
                }),
            ],
        });
    } catch (error) {
        console.trace(error);

        await interaction.editReply({
            embeds: [
                CustomEmbed.from({
                    color: CustomEmbed.Color.Red,
                    title: 'Inertia Lighting | Products Manager',
                    description: 'An error occurred while logging to the products manager logging channel!',
                }),
            ],
        }).catch(console.warn);

        return;
    }

    /* inform the user */
    await interaction.editReply({
        embeds: [
            CustomEmbed.from({
                color: action_to_perform === ManageProductsAction.Add ? CustomEmbed.Color.Green : CustomEmbed.Color.Red,
                title: 'Inertia Lighting | Products Manager',
                description: `${action_to_perform === ManageProductsAction.Add ? 'Added' : 'Removed'} \`${db_roblox_product.code}\` ${action_to_perform === ManageProductsAction.Add ? 'to' : 'from'} ${user_to_modify}.`,
                fields: [
                    {
                        name: 'Reason',
                        value: Discord.escapeMarkdown(reason),
                    },
                ],
            }),
        ],
    }).catch(console.warn);
}

//------------------------------------------------------------//

export default new CustomInteraction({
    identifier: 'manage_user_products',
    type: Discord.InteractionType.ApplicationCommand,
    data: {
        type: Discord.ApplicationCommandType.ChatInput,
        description: 'Used by staff to manage a user\'s products.',
        options: [
            {
                name: 'for',
                type: Discord.ApplicationCommandOptionType.User,
                description: 'The member who you want to manage products for.',
                required: true,
            }, {
                name: 'action',
                type: Discord.ApplicationCommandOptionType.String,
                description: 'The action you want to perform.',
                choices: [
                    {
                        name: 'Add',
                        value: ManageProductsAction.Add,
                    }, {
                        name: 'Remove',
                        value: ManageProductsAction.Remove,
                    },
                ],
                required: true,
            }, {
                name: 'product_code',
                type: Discord.ApplicationCommandOptionType.String,
                description: 'The product code to manage.',
                autocomplete: true,
                required: true,
            }, {
                name: 'reason',
                type: Discord.ApplicationCommandOptionType.String,
                description: 'The reason for adding/removing a product',
                required: true,
            },
        ],
    },
    metadata: {
        required_run_context: CustomInteractionRunContext.Guild,
        required_access_level: CustomInteractionAccessLevel.CustomerService,
    },
    handler: async (discord_client, interaction) => {
        if (!interaction.inCachedGuild()) return;

        if (interaction.isAutocomplete()) {
            await manageProductsAutoCompleteHandler(interaction);
        } else if (interaction.isChatInputCommand()) {
            await manageProductsChatInputCommandHandler(interaction);
        }
    },
});
