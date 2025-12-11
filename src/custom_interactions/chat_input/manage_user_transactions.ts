/* eslint-disable complexity */
// ------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
// ------------------------------------------------------------//

import { randomUUID } from 'node:crypto';

import * as Discord from 'discord.js';
import { compareTwoStrings } from 'string-similarity';

import { CustomInteraction, CustomInteractionAccessLevel, CustomInteractionRunContext } from '@/common/managers/custom_interactions_manager.js'
;
import { CustomEmbed } from '@/common/message.js'
;
import prisma from '@/lib/prisma_client.js'
;
import { PrismaProductData } from '@/types/index.js'
;

// ------------------------------------------------------------//

const db_database_support_staff_role_id = `${process.env.BOT_SUPPORT_STAFF_DATABASE_ROLE_ID ?? ''}`;
if (db_database_support_staff_role_id.length < 1) throw new Error('Environment variable: BOT_SUPPORT_STAFF_DATABASE_ROLE_ID; is not set correctly.');

const bot_logging_products_manager_channel_id = `${process.env.BOT_LOGGING_PRODUCTS_MANAGER_CHANNEL_ID ?? ''}`;
if (bot_logging_products_manager_channel_id.length < 1) throw new Error('Environment variable: BOT_LOGGING_PRODUCTS_MANAGER_CHANNEL_ID; is not set correctly.');

// ------------------------------------------------------------//

// Note for the future:
//
// If we ever need to add more actions to this enum,
// other locations will need to be updated as well.
//
// Assumptions were made that the enum would only have two values.
// As such ternary operators were used in some places.
enum ManageTransactionsAction {
    Add = 'add',
    Remove = 'remove',
}

// ------------------------------------------------------------//

const ALL_PRODUCTS_CODE = 'ALL';
const ALL_VIEWABLE_PRODUCTS_CODE = 'ALL_VIEWABLE';

// ------------------------------------------------------------//

class DbProductsCache {
    public static readonly cache_lifetime_ms = 1 * 60_000; // 1 minute

    public static cache_expiration_epoch_ms = 0; // default to expired so it will be fetched on first call

    public static cache: PrismaProductData[] = [];

    public static async fetch(
        bypass_cache: boolean = false,
    ): Promise<PrismaProductData[]> {
        const now_epoch_ms = Date.now();

        if (
            bypass_cache ||
            this.cache_expiration_epoch_ms < now_epoch_ms
        ) {
            const db_roblox_products = await prisma.products.findMany({
                select: {
                    code: true,
                    name: true,
                    viewable: true,
                },
            });

            this.cache_expiration_epoch_ms = now_epoch_ms + this.cache_lifetime_ms;
            this.cache = db_roblox_products;

            return db_roblox_products;
        }

        return this.cache;
    }

}

// ------------------------------------------------------------//

async function manageProductsAutocompleteHandler(
    interaction: Discord.AutocompleteInteraction,
): Promise<void> {
    const db_roblox_products = await DbProductsCache.fetch(false);
  
    const user_id_to_modify = interaction.options.get('for')?.value; // required to be like this because of a weird discord.js bug
    const action_to_perform = interaction.options.getString('action') as ManageTransactionsAction;
    const focused_option = interaction.options.getFocused(true);

    /* ensure the user to modify is valid */
    if (typeof user_id_to_modify !== 'string') {
        await interaction.respond([]);

        return;
    }

    /* ensure the action to perform is valid */
    if (!Object.values(ManageTransactionsAction).includes(action_to_perform)) {
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
    const db_user_data = await prisma.user.findUnique({
        where: {
            discordId: user_id_to_modify,
        },
        select: {
            discordId: true,
            transactions: true,
        },
    }) 

    if (!db_user_data) {
        await interaction.respond([]);

        return;
    }

    const filtered_db_roblox_products = db_roblox_products.filter(db_roblox_product => {
        const user_owns_product = db_user_data.transactions.some(
            t => t.productCode === db_roblox_product.code
        );

        return (
            (action_to_perform === ManageTransactionsAction.Add && !user_owns_product) ||
            (action_to_perform === ManageTransactionsAction.Remove && user_owns_product)
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
        ({ similarity_score }, index) => product_code_search_query.length > 0 ? (
            similarity_score >= 0.25 || (similarity_score < 0.25 && index < 10)
        ) : true
    );

    if (matching_db_roblox_products.length === 0) {
        await interaction.respond([]);

        return;
    }

    const autocomplete_results = matching_db_roblox_products.slice(0, 5).map(
        (db_roblox_product) => ({
            name: `${db_roblox_product.name}: ${db_roblox_product.code}`,
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

// ------------------------------------------------------------//

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

async function manageProductsChatInputCommandHandler(
    interaction: Discord.ChatInputCommandInteraction,
): Promise<void> {
    if (!interaction.inCachedGuild()) return;

    await interaction.deferReply({ flags: ['Ephemeral'] });

    const interaction_guild_member = await interaction.guild.members.fetch(interaction.user.id);

    /* check if the user is allowed to use this command */
    const staff_member_is_permitted = interaction_guild_member.roles.cache.has(db_database_support_staff_role_id);
    if (!staff_member_is_permitted) {
        interaction.editReply({
            embeds: [
                CustomEmbed.from({
                    color: CustomEmbed.Color.Violet,
                    title: 'Inertia Lighting | Transactions Manager',
                    description: 'You aren\'t allowed to use this command!',
                }),
            ],
        }).catch(console.warn);

        return;
    }

    const user_to_modify = interaction.options.getUser('for', true);
    const action_to_perform = interaction.options.getString('action', true) as ManageTransactionsAction;
    const product_code = interaction.options.getString('product_code', true);
    const reason = interaction.options.getString('reason', true);

    /* ensure the action to perform is valid */
    if (!Object.values(ManageTransactionsAction).includes(action_to_perform)) {
        await interaction.editReply({
            embeds: [
                CustomEmbed.from({
                    color: CustomEmbed.Color.Yellow,
                    title: 'Inertia Lighting | Transactions Manager',
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
                // eslint-disable-next-line no-shadow
                (db_roblox_product) => db_roblox_product.code === product_code
            );

            if (!db_roblox_product) {
                interaction.followUp({
                    embeds: [
                        CustomEmbed.from({
                            color: CustomEmbed.Color.Yellow,
                            title: 'Inertia Lighting | Transactions Manager',
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
    const db_user_data = await prisma.user.findUnique({
        where: {
            discordId: user_to_modify.id,
        },
        select: {
            discordId: true,
            transactions: true,
        },
    })

    /* check if the user exists */
    if (!db_user_data) {
        await interaction.editReply({
            embeds: [
                CustomEmbed.from({
                    color: CustomEmbed.Color.Yellow,
                    title: 'Inertia Lighting | Transactions Manager',
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
                ...db_roblox_products.filter(p => {
                    const user_owns_product = db_user_data.transactions.some(t => t.productCode === p.code);
                    return (action_to_perform === ManageTransactionsAction.Add && !user_owns_product) || (action_to_perform === ManageTransactionsAction.Remove && user_owns_product);
                }).map(
                    (db_roblox_product) => db_roblox_product.code
                )
            );

            break;
        }

        case ALL_VIEWABLE_PRODUCTS_CODE: {
            product_codes_to_manage.push(
                ...db_roblox_products.filter(
                    (db_roblox_product) => db_roblox_product.viewable
                ).filter(p => {
                    const user_owns_product = db_user_data.transactions.some(t => t.productCode === p.code);
                    return (action_to_perform === ManageTransactionsAction.Add && !user_owns_product) || (action_to_perform === ManageTransactionsAction.Remove && user_owns_product);
                }).map(
                    (db_roblox_product) => db_roblox_product.code
                )
            );

            break;
        }

        default: {
            // only add the one specified product code
            // we can assume this is a valid product code because we checked earlier

            // only add the product code if it passes the ownership predicate
            const filtered_db_roblox_products = db_roblox_products.filter(db_roblox_product => {
                const user_owns_product = db_user_data.transactions.some(
                    t => t.productCode === db_roblox_product.code
                );

                return (
                    (action_to_perform === ManageTransactionsAction.Add && !user_owns_product) ||
                    (action_to_perform === ManageTransactionsAction.Remove && user_owns_product)
                );
            });

            if (filtered_db_roblox_products) {
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
                    title: 'Inertia Lighting | Transactions Manager',
                    description: `${user_to_modify} does not have any available products to ${action_to_perform ? 'add' : 'remove'}!`,
                }),
            ],
        }).catch(console.warn);

        return;
    }

    /* manage the user's transactions */
    for (const product_code_to_manage of product_codes_to_manage) {
        try {
            /* modify the user's transactions */
            prisma.$transaction(async (tx) => {
                if (action_to_perform === ManageTransactionsAction.Add) {
                    await tx.transactions.create({
                        data: {
                            transactionType: 'system',
                            productCode: product_code,
                            purchaseId: `SYSTEM_MANUAL_${interaction.user.id}_${randomUUID()}`,
                            transactionAmount: '0',
                            User: {
                                connect: {
                                    discordId: db_user_data.discordId,
                                },
                            },
                        },
                    });
                }
                else if (action_to_perform === ManageTransactionsAction.Remove) {
                    await tx.transactions.deleteMany({
                        where: {
                            AND: [
                                {
                                    User: {
                                        discordId: db_user_data.discordId,
                                    },
                                },
                                {
                                    productCode: product_code,
                                },
                            ]
                        }
                    });
                }
            });
        } catch (error) {
            console.trace(error);

            await interaction.editReply({
                embeds: [
                    CustomEmbed.from({
                        color: CustomEmbed.Color.Red,
                        title: 'Inertia Lighting | Transactions Manager',
                        description: `An error occurred while modifying: \`${product_code_to_manage}\` for ${user_to_modify}!`,
                    }),
                ],
            }).catch(console.warn);

            return;
        }
    }

    /* log to the transactions manager logging channel */
    try {
        const logging_channel = await interaction.client.channels.fetch(bot_logging_products_manager_channel_id);
        if (!logging_channel) throw new Error('Unable to find the transactions manager logging channel!');
        if (!logging_channel.isTextBased()) throw new Error('The transactions manager logging channel is not text-based!');
        if(!logging_channel.isSendable()) throw new Error('The identity manager logging channel is not sendable!');
        
        await logging_channel.send({
            embeds: [
                CustomEmbed.from({
                    color: action_to_perform === ManageTransactionsAction.Add ? CustomEmbed.Color.Green : CustomEmbed.Color.Red,
                    title: 'Inertia Lighting | Transactions Manager',
                    description: [
                        `${interaction.user} ${action_to_perform === ManageTransactionsAction.Add ? 'added' : 'removed'}:`,
                        ...product_codes_to_manage.map(
                            (product_code_to_manage) => `- \`${product_code_to_manage}\``
                        ),
                        `${action_to_perform === ManageTransactionsAction.Add ? 'to' : 'from'} ${user_to_modify}.`,
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
                    title: 'Inertia Lighting | Transactions Manager',
                    description: 'An error occurred while logging to the transactions manager logging channel!',
                }),
            ],
        }).catch(console.warn);

        return;
    }

    /* inform the user */
    await interaction.editReply({
        embeds: [
            CustomEmbed.from({
                color: action_to_perform === ManageTransactionsAction.Add ? CustomEmbed.Color.Green : CustomEmbed.Color.Red,
                title: 'Inertia Lighting | Transactions Manager',
                description: [
                    `${action_to_perform === ManageTransactionsAction.Add ? 'Added' : 'Removed'}:`,
                    ...product_codes_to_manage.map(
                        (product_code_to_manage) => `- \`${product_code_to_manage}\``
                    ),
                    `${action_to_perform === ManageTransactionsAction.Add ? 'to' : 'from'} ${user_to_modify}.`,
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

// ------------------------------------------------------------//

export default new CustomInteraction({
    identifier: 'manage_user_transactions',
    type: Discord.InteractionType.ApplicationCommand,
    data: {
        type: Discord.ApplicationCommandType.ChatInput,
        description: 'Used by staff to manage user transactions.',
        options: [
            {
                name: 'for',
                type: Discord.ApplicationCommandOptionType.User,
                description: 'The user to manage transactions for.',
                required: true,
            }, {
                name: 'action',
                type: Discord.ApplicationCommandOptionType.String,
                description: 'The action to perform on a product.',
                choices: [
                    {
                        name: 'Add',
                        value: ManageTransactionsAction.Add,
                    }, {
                        name: 'Remove',
                        value: ManageTransactionsAction.Remove,
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
                description: 'The reason for managing user transactions.',
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
