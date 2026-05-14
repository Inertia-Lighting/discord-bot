// ------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
// ------------------------------------------------------------//

import * as Discord from 'discord.js';
import { compareTwoStrings } from 'string-similarity';

import { CustomInteraction, CustomInteractionAccessLevel, CustomInteractionRunContext } from '@/common/managers/custom_interactions_manager.js'
import { CustomEmbed } from '@/common/message.js'
import prisma from '@/common/lib/prisma_client.js'
import { DbProductsCache } from '@/utilities/productCache.js';

// ------------------------------------------------------------//

const api_server = `${process.env.API_SERVER ?? ''}`;
if (api_server.length < 1) throw new Error('Environment variable: API_SERVER; is not set correctly.');

const bot_logging_products_manager_channel_id = `${process.env.BOT_LOGGING_PRODUCTS_MANAGER_CHANNEL_ID ?? ''}`;
if (bot_logging_products_manager_channel_id.length < 1) throw new Error('Environment variable: BOT_LOGGING_PRODUCTS_MANAGER_CHANNEL_ID; is not set correctly.');

// const ALL_PRODUCTS_CODE = 'ALL';
// const ALL_VIEWABLE_PRODUCTS_CODE = 'ALL_VIEWABLE';

// ------------------------------------------------------------//

async function selfTransferAutocompleteHandler(
    interaction: Discord.AutocompleteInteraction
): Promise<void> {
    const db_products = await DbProductsCache.fetch(false)

    const focused_option = interaction.options.getFocused(true);

    if (focused_option.name !== 'product_code') {
        await interaction.respond([]);

        return;
    }

    const product_code_search_query = focused_option.value.toUpperCase();

    /* find the user in the database */
    const db_user_data = await prisma.user.findUnique({
        where: {
            discordId: interaction.user.id,
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


    const filtered_db_products = db_products.filter(db_product => {
        const user_owns_product = db_user_data.transactions.some(
            t => t.productCode === db_product.code
        );

        return (user_owns_product);
    });

    if (filtered_db_products.length < 1) {
        await interaction.respond([]);

        return;
    }

    const mapped_db_products = [];
    for (const db_product of filtered_db_products) {
        mapped_db_products.push({
            ...db_product,
            similarity_score: compareTwoStrings(product_code_search_query, db_product.code),
        });
    }

    const matching_db_products = mapped_db_products.sort(
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

    if (matching_db_products.length === 0) {
        await interaction.respond([]);

        return;
    }

    const autocomplete_results = matching_db_products.slice(0, 5).map(
        (db_product) => ({
            name: `${db_product.name}: ${db_product.code}`,
            value: db_product.code,
        })
    );

    // autocomplete_results.push({
    //     name: 'All Products',
    //     value: ALL_PRODUCTS_CODE,
    // });

    // // always add the all viewable products option
    // autocomplete_results.push({
    //     name: 'All Viewable Products',
    //     value: ALL_VIEWABLE_PRODUCTS_CODE,
    // });

    interaction.respond(autocomplete_results);
}


export default new CustomInteraction({
    identifier: 'self_transfer',
    type: Discord.InteractionType.ApplicationCommand,
    data: {
        type: Discord.ApplicationCommandType.ChatInput,
        description: 'Transfer products to another user',
        options: [
            {
                name: 'target',
                description: 'Target user',
                type: Discord.ApplicationCommandOptionType.User,
                required: true,
            },
            {
                name: 'product_code',
                description: 'Product code',
                type: Discord.ApplicationCommandOptionType.String,
                autocomplete: true,
                required: true,
            },
            {
                name: 'reason',
                description: 'Reason',
                type: Discord.ApplicationCommandOptionType.String,
                required: true,
            }
        ],
    },
    metadata: {
        required_run_context: CustomInteractionRunContext.Guild,
        required_access_level: CustomInteractionAccessLevel.Public,
    },
    handler: async (discord_client, interaction) => {
        if (!interaction.inCachedGuild()) return;

        if (interaction.isAutocomplete()) {
            selfTransferAutocompleteHandler(interaction)
            return;
        }

        if (!interaction.isChatInputCommand()) return;
        if (!interaction.channel) return;

        const user_a = interaction.user
        const target = interaction.options.getUser('target', true);
        const product_code = interaction.options.getString('product_code', true);
        const reason = interaction.options.getString('reason', true);

        if (user_a.id === target.id) {
            await interaction.reply({
                flags: ['Ephemeral'],
                embeds: [
                    CustomEmbed.from({
                        color: CustomEmbed.Color.Red,
                        title: 'Transfer',
                        description: 'You cannot transfer products to yourself.',
                    }),
                ],
            });
            return;
        }

        await interaction.deferReply()
        await interaction.editReply({
            embeds: [
                CustomEmbed.from({
                    title: 'Transfer',
                    description: 'Checking if users exists in the database...'
                })
            ]
        })

        const user_a_db = await prisma.user.findUnique({
            where: {
                discordId: user_a.id
            },
            select: {
                id: true
            }
        });

        const target_db = await prisma.user.findUnique({
            where: {
                discordId: target.id
            },
            select: {
                id: true
            }
        });

        if (!user_a_db) {
            await interaction.editReply({
                embeds: [
                    CustomEmbed.from({
                        color: CustomEmbed.Color.Red,
                        title: 'Transfer',
                        description: `<@${user_a.id}> was not found in the database.`,
                    }),
                ],
            });
            return;
        }
        if (!target_db) {
            await interaction.editReply({
                embeds: [
                    CustomEmbed.from({
                        color: CustomEmbed.Color.Red,
                        title: 'Transfer',
                        description: `<@${target.id}> was not found in the database.`,
                    }),
                ],
            });
            return;
        }

        const user_a_transaction = await prisma.transactions.findFirst({
            where: {
                UserId: user_a_db.id,
                productCode: product_code,
            },
            select: {
                id: true,
                productCode: true,
                UserId: true,
                oneTimeTransferUsed: true,
            },
        });

        if (!user_a_transaction) {
            await interaction.editReply({
                embeds: [
                    CustomEmbed.from({
                        color: CustomEmbed.Color.Red,
                        title: 'Transfer',
                        description: `No valid transaction for <@${user_a.id}>, transaction does not exists.`,
                    }),
                ],
            });
            return;
        }

        if (user_a_transaction.oneTimeTransferUsed) {
            await interaction.editReply({
                embeds: [
                    CustomEmbed.from({
                        color: CustomEmbed.Color.Red,
                        title: 'Transfer',
                        description: `No valid transaction for <@${user_a.id}>, product it was already transferred.`,
                    }),
                ],
            });
            return;
        }

        const confirm_msg = await interaction.editReply({
            embeds: [
                CustomEmbed.from({
                    color: CustomEmbed.Color.Blue,
                    title: 'Transfer',
                    description: `Confirm transfer for product: **${product_code}** from <@${user_a.id}> to <@${target.id}>`,
                }),
            ],
            components: [
            {
                type: Discord.ComponentType.ActionRow,
                components: [
                    {
                        type: Discord.ComponentType.Button,
                        style: Discord.ButtonStyle.Success,
                        label: 'Transfer',
                        custom_id: 'self_transfer_confirm'
                    },
                    {
                        type: Discord.ComponentType.Button,
                        style: Discord.ButtonStyle.Danger,
                        label: 'Cancel',
                        custom_id: 'self_transfer_cancel'
                    }
                ]
            }]
        });

        const clicked = await confirm_msg.awaitMessageComponent<Discord.ComponentType.Button>({
            time: 60_000,
            filter: (i: Discord.MessageComponentInteraction<Discord.CacheType>) => i.user.id === target.id && ['self_transfer_confirm', 'self_transfer_cancel'].includes(i.customId),
        });

        if (clicked.customId === 'self_transfer_cancel') {
            await clicked.update({
                components: [],
                embeds: [
                    CustomEmbed.from({
                        color: CustomEmbed.Color.Red,
                        title: 'Transfer',
                        description: 'Transfer cancelled.',
                    })
                ]
            });
            return;
        }

        try {
            await prisma.$transaction(async (tx) => {
                await tx.transactions.update({
                    where: {
                        id: user_a_transaction.id
                    },
                    data: {
                        oneTimeTransferUsed: true,
                        UserId: target_db.id,
                    },
                });

                await tx.transfers.create({
                    data: {
                        transferReason: reason,
                        TransactionId: user_a_transaction.id,
                        NewUserId: target_db.id,
                    },
                });
            });

            try {
                const logging_channel = await interaction.client.channels.fetch(bot_logging_products_manager_channel_id);
                if (!logging_channel) throw new Error('Unable to find the transactions manager logging channel!');
                if (!logging_channel.isTextBased()) throw new Error('The transactions manager logging channel is not text-based!');
                if (!logging_channel.isSendable()) throw new Error('The identity manager logging channel is not sendable!');

                await logging_channel.send({
                    embeds: [
                        CustomEmbed.from({
                            color: CustomEmbed.Color.Yellow,
                            title: 'Inertia Lighting | Transactions Manager',
                            description: [
                                `${interaction.user} transferred product(s) from ${user_a.globalName} (${user_a.id}) to ${target.globalName} (${target.id}): `,
                                `\`${user_a_transaction.productCode}\``

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

            await clicked.update({
                components: [],
                embeds: [
                    CustomEmbed.from({
                        color: CustomEmbed.Color.Green,
                        title: 'Transfer',
                        description: `Transaction: \`${user_a_transaction.id}\`, Product: \`${product_code}\` transferred from <@${user_a.id}> to <@${target.id}>.`,
                    }),
                ],
            });
        } catch {
            await clicked.update({
                components: [],
                embeds: [
                    CustomEmbed.from({
                        color: CustomEmbed.Color.Red,
                        title: 'Transfer',
                        description: 'Could not complete the transfer.',
                    }),
                ],
            });
        }
    },
});
