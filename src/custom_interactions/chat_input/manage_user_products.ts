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

// Note for the future:
//
// If we ever need to add more actions to this enum,
// other locations will need to be updated as well.
//
// Assumptions were made that the enum would only have two values.
// As such ternary operators were used in some places.
enum ManageProductsAction {
    Add = 'add',
    Remove = 'remove',
}

//------------------------------------------------------------//

const ALL_PRODUCTS_CODE = 'ALL';
const ALL_VIEWABLE_PRODUCTS_CODE = 'ALL_VIEWABLE';

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
            const db_roblox_products_find_cursor = await go_mongo_db.find(db_database_name, db_products_collection_name, {});

            const db_roblox_products = await db_roblox_products_find_cursor.toArray() as unknown as DbProductData[];

            this.cache_expiration_epoch_ms = now_epoch_ms + this.cache_lifetime_ms;
            this.cache = db_roblox_products;

            return db_roblox_products;
        }

        return this.cache;
    }

}

//------------------------------------------------------------//

async function manageProductsAutocompleteHandler(
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

    /* ensure the focused option is the one that we want */
    if (focused_option.name !== 'product_code') {
        await interaction.respond([]);

        return;
    }

    const product_code_search_query = focused_option.value.toUpperCase();

    /* find the user in the database */
    const db_user_data_find_cursor = await go_mongo_db.find(db_database_name, db_users_collection_name, {
        'identity.discord_user_id': user_id_to_modify,
    }, {
        projection: {
            '_id': false,
        },
    });

    const db_user_data = await db_user_data_find_cursor.next() as unknown as DbUserData | null;

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

    const autocomplete_results = matching_db_roblox_products.slice(0, 5).map(
        (db_roblox_product) => ({
            name: db_roblox_product.code,
            value: db_roblox_product.code,
        })
    );

    // always add the all products option
    autocomplete_results.push({
        name: 'All Products',
        value: ALL_PRODUCTS_CODE,
    });

    // always add the all viewable products option
    autocomplete_results.push({
        name: 'All Viewable Products',
        value: ALL_VIEWABLE_PRODUCTS_CODE,
    });

    interaction.respond(autocomplete_results);
}

//------------------------------------------------------------//

// Note:
//
// Great care should be taken to ensure that only
// applicable product codes are allowed.
//
// Example:
//
// If the user already owns the product
// and the action is to add the product,
// don't add the product to this array.
//
// Alternatively, if the user doesn't own the product
// and the action is to remove the product,
// don't add the product to this array.
function dbRobloxProductsOwnershipPredicate(
    db_user_data: DbUserData,
    action_to_perform: ManageProductsAction,
    db_roblox_product_code: string,
): boolean {
    const user_owns_product: boolean = db_user_data.products[db_roblox_product_code];

    return (
        // action add: only add the product if the user doesn't already own it
        (action_to_perform === ManageProductsAction.Add && !user_owns_product) ||
        // action remove: only remove the product if the user currently owns it
        (action_to_perform === ManageProductsAction.Remove && user_owns_product)
    );
}

async function manageUserProduct(
    db_user_data: DbUserData,
    action_to_perform: ManageProductsAction,
    product_code: string,
): Promise<void> {
    /* modify the user's products */
    await go_mongo_db.update(db_database_name, db_users_collection_name, {
        'identity.discord_user_id': db_user_data.identity.discord_user_id,
        'identity.roblox_user_id': db_user_data.identity.roblox_user_id,
    }, {
        $set: {
            [`products.${product_code}`]: (action_to_perform === ManageProductsAction.Add ? true : false),
        },
    });
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

    /* fetch the products */
    const db_roblox_products = await DbProductsCache.fetch(true);

    /* check if the product code is valid */
    switch (product_code) {
        case ALL_PRODUCTS_CODE:
        case ALL_VIEWABLE_PRODUCTS_CODE: {
            // these are valid product codes, so do nothing

            break;
        }

        default: {
            // we need to check if the product code is valid now

            const db_roblox_product = db_roblox_products.find(
                (db_roblox_product) => db_roblox_product.code === product_code
            );

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

            break;
        }
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
                    title: 'Inertia Lighting | Products Manager',
                    description: `${user_to_modify} does not exist in the database!`,
                }),
            ],
        }).catch(console.warn);

        return;
    }

    // Gather the product codes to manage.
    const product_codes_to_manage: string[] = [];
    switch (product_code) {
        case ALL_PRODUCTS_CODE: {
            product_codes_to_manage.push(
                ...db_roblox_products.filter(
                    (db_roblox_product) => dbRobloxProductsOwnershipPredicate(db_user_data, action_to_perform, db_roblox_product.code)
                ).map(
                    (db_roblox_product) => db_roblox_product.code
                )
            );

            break;
        }

        case ALL_VIEWABLE_PRODUCTS_CODE: {
            product_codes_to_manage.push(
                ...db_roblox_products.filter(
                    (db_roblox_product) => db_roblox_product.viewable
                ).filter(
                    (db_roblox_product) => dbRobloxProductsOwnershipPredicate(db_user_data, action_to_perform, db_roblox_product.code)
                ).map(
                    (db_roblox_product) => db_roblox_product.code
                )
            );

            break;
        }

        default: {
            // only add the one specified product code
            // we can assume this is a valid product code because we checked earlier

            // only add the product code if it passes the ownership predicate
            if (dbRobloxProductsOwnershipPredicate(db_user_data, action_to_perform, product_code)) {
                product_codes_to_manage.push(product_code);
            }

            break;
        }
    }

    /* ensure the user has products to manage */
    if (product_codes_to_manage.length < 1) {
        await interaction.editReply({
            embeds: [
                CustomEmbed.from({
                    color: CustomEmbed.Color.Yellow,
                    title: 'Inertia Lighting | Products Manager',
                    description: `${user_to_modify} does not have any available products to ${action_to_perform ? 'add' : 'remove'}!`,
                }),
            ],
        }).catch(console.warn);

        return;
    }

    /* manage the user's products */
    for (const product_code_to_manage of product_codes_to_manage) {
        try {
            await manageUserProduct(db_user_data, action_to_perform, product_code_to_manage);
        } catch (error) {
            console.trace(error);

            await interaction.editReply({
                embeds: [
                    CustomEmbed.from({
                        color: CustomEmbed.Color.Red,
                        title: 'Inertia Lighting | Products Manager',
                        description: `An error occurred while modifying: \`${product_code_to_manage}\` for ${user_to_modify}!`,
                    }),
                ],
            }).catch(console.warn);

            continue;
        }
    }

    /* log to the products manager logging channel */
    try {
        const logging_channel = await interaction.client.channels.fetch(bot_logging_products_manager_channel_id);
        if (!logging_channel) throw new Error('Unable to find the products manager logging channel!');
        if (!logging_channel.isTextBased()) throw new Error('The products manager logging channel is not text-based!');
        if(!logging_channel.isSendable()) throw new Error('The identity manager logging channel is not sendable!');
        
        await logging_channel.send({
            embeds: [
                CustomEmbed.from({
                    color: action_to_perform === ManageProductsAction.Add ? CustomEmbed.Color.Green : CustomEmbed.Color.Red,
                    title: 'Inertia Lighting | Products Manager',
                    description: [
                        `${interaction.user} ${action_to_perform === ManageProductsAction.Add ? 'added' : 'removed'}:`,
                        ...product_codes_to_manage.map(
                            (product_code_to_manage) => `- \`${product_code_to_manage}\``
                        ),
                        `${action_to_perform === ManageProductsAction.Add ? 'to' : 'from'} ${user_to_modify}.`,
                    ].join('\n'),
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
                description: [
                    `${action_to_perform === ManageProductsAction.Add ? 'Added' : 'Removed'}:`,
                    ...product_codes_to_manage.map(
                        (product_code_to_manage) => `- \`${product_code_to_manage}\``
                    ),
                    `${action_to_perform === ManageProductsAction.Add ? 'to' : 'from'} ${user_to_modify}.`,
                ].join('\n'),
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
        description: 'Used by staff to manage user products.',
        options: [
            {
                name: 'for',
                type: Discord.ApplicationCommandOptionType.User,
                description: 'The user to manage products for.',
                required: true,
            }, {
                name: 'action',
                type: Discord.ApplicationCommandOptionType.String,
                description: 'The action to perform on a product.',
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
                description: 'The reason for managing user products.',
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
            await manageProductsAutocompleteHandler(interaction);
        } else if (interaction.isChatInputCommand()) {
            await manageProductsChatInputCommandHandler(interaction);
        }
    },
});
