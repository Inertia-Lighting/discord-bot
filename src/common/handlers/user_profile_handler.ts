// ------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
// ------------------------------------------------------------//

import { CustomEmbed } from '@root/common/message';
import prisma from '@root/lib/prisma_client';
import { bot_config } from '@root/utilities/bot_config';
import axios from 'axios';
import * as Discord from 'discord.js';

// ------------------------------------------------------------//

export async function userProfileHandler(
    deferred_interaction: Discord.CommandInteraction | Discord.MessageComponentInteraction,
    discord_user_id: string,
) {
    const client = deferred_interaction.client;
    const db_user = await prisma.user.findFirst({
        where: {
            discordId: deferred_interaction.user.id
        },
        select: {
            id: true,
            lumens: true,
            robloxId: true,
            discordId: true,
            transactions: true,
        }
    })
    if (!db_user) {
        await deferred_interaction.editReply({
            embeds: [
                CustomEmbed.from({
                    color: CustomEmbed.Color.Yellow,
                    author: {
                        icon_url: `${client.user.displayAvatarURL({ forceStatic: false })}`,
                        name: 'Inertia Lighting | User Profile System',
                    },
                    title: 'Unknown User',
                    description: [
                        'That user doesn\'t exist in our database!',
                    ].join('\n'),
                }),
            ],
        }).catch(console.warn);

        return;
    }


    const db_blacklist_data = await prisma.punishments.findFirst({
        where: {
            punishmentType: 'blacklist',
            punishedUserId: db_user.id,
        },
        omit: {
            id: true,
        }
    })

    const user_product_codes = new Set<string>();
    const db_products = await prisma.products.findMany()
    const product_map = db_user.transactions
        .map((transaction) => transaction.productCode)
        .filter((productCode) => db_products.some((db_product) => db_product.viewable && db_product.code === productCode));

    // Helper function to add products based on a condition
    db_user.transactions.every((prod) => user_product_codes.add(prod.productCode))
    const addProductsByCondition = (condition: boolean, products: typeof db_products) => {
        if (condition) {
            for (const product of products) {
                user_product_codes.add(product.code);
            }
        }
    };


    const discord_member = await deferred_interaction.guild?.members.fetch(discord_user_id);

    if (discord_member) {
        addProductsByCondition(!!discord_member.premiumSince, db_products.filter((product) => product.supporter_perk));
        addProductsByCondition(!!discord_member.roles.cache.get(bot_config.subscriptions_tier_1_role_id), db_products);
        addProductsByCondition(!!discord_member.roles.cache.get(bot_config.partners_role_id), db_products);
        addProductsByCondition(!!discord_member.roles.cache.get(bot_config.staff_products_role_id), db_products);
    }
    const roblox_user_data: {
        name: string,
        displayName: string,
    } = await axios({
        method: 'get',
        url: `https://users.roblox.com/v1/users/${encodeURIComponent(db_user.robloxId)}`,
        timeout: 10_000, // 10 seconds
        validateStatus: (status) => status === 200,
    }).then(
        (response) => response.data as {
            name: string,
            displayName: string,
        },
    ).catch(error => {
        console.trace(error);

        return {
            name: 'Unknown User',
            displayName: 'Unknown User',
        };
    });
    const user_products = await prisma.products.findMany({
        where: {
            code: {
                in: product_map,
            },
        },
    });
    await deferred_interaction.editReply({
        embeds: [
            ...(db_blacklist_data ? [
                CustomEmbed.from({
                    color: CustomEmbed.Color.Red,
                    author: {
                        icon_url: `${client.user.displayAvatarURL({ forceStatic: false })}`,
                        name: 'Inertia Lighting | User Blacklist System',
                    },
                    description: [
                        '',
                        'User is blacklisted from using Inertia Lighting products!',
                        '',
                        'json',
                        `${JSON.stringify(db_blacklist_data, null, 2)}`,
                        '',
                    ].join('\n'),
                }),
            ] : []),
            CustomEmbed.from({
                author: {
                    icon_url: `${client.user.displayAvatarURL({ forceStatic: false })}`,
                    name: 'Inertia Lighting | User Profile System',
                },
                fields: [
                    {
                        name: 'Discord',
                        value: `${Discord.userMention(deferred_interaction.user.id)}`,
                    }, {
                        name: 'Roblox',
                        value: `[${`@${roblox_user_data.name}`}](https://roblox.com/users/${db_user.robloxId}/profile) (${roblox_user_data.displayName ?? 'n/a'})`,
                    },
                    // {
                    //     name: 'Lumens',
                    //     value: `${db_user_data.lumens ?? 0}`,
                    // },
                    {
                        name: 'Product Licenses',
                        value: `${product_map.length === 0 ? 'n/a' : user_products.map(product => `- ${product.name}`).join('\n')}`,
                    },
                ],
            }),
        ],
    });
}
