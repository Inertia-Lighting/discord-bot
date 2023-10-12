//------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
//------------------------------------------------------------//

import axios from 'axios';

import * as Discord from 'discord.js';

import { go_mongo_db } from '@root/common/mongo/mongo';

import { CustomEmbed } from '@root/common/message';

//------------------------------------------------------------//

const db_database_name = `${process.env.MONGO_DATABASE_NAME ?? ''}`;
if (db_database_name.length < 1) throw new Error('Environment variable: MONGO_DATABASE_NAME; is not set correctly.');

const db_products_collection_name = `${process.env.MONGO_PRODUCTS_COLLECTION_NAME ?? ''}`;
if (db_products_collection_name.length < 1) throw new Error('Environment variable: MONGO_PRODUCTS_COLLECTION_NAME; is not set correctly.');

const db_users_collection_name = `${process.env.MONGO_USERS_COLLECTION_NAME ?? ''}`;
if (db_users_collection_name.length < 1) throw new Error('Environment variable: MONGO_USERS_COLLECTION_NAME; is not set correctly.');

const db_blacklisted_users_collection_name = `${process.env.MONGO_BLACKLISTED_USERS_COLLECTION_NAME ?? ''}`;
if (db_blacklisted_users_collection_name.length < 1) throw new Error('Environment variable: MONGO_BLACKLISTED_USERS_COLLECTION_NAME; is not set correctly.');

//------------------------------------------------------------//

async function fetchUserProductCodes(
    discord_user_id: string,
): Promise<string[]> {
    const user_product_codes = await axios({
        method: 'post',
        url: 'https://api.inertia.lighting/v2/user/products/fetch',
        headers: {
            'Content-Type': 'application/json',
        },
        data: {
            'discord_user_id': discord_user_id,
        },
        validateStatus: (status) => status === 200 || status === 404,
        timeout: 10_000, // 10 seconds
    }).then(
        (response) => response.data as string[],
    ); // don't catch to propagate error to caller

    return user_product_codes;
}

//------------------------------------------------------------//

export async function userProfileHandler(
    deferred_interaction: Discord.CommandInteraction | Discord.MessageComponentInteraction,
    discord_user_id: string,
) {
    const client = deferred_interaction.client;

    const [ db_user_data ] = await go_mongo_db.find(db_database_name, db_users_collection_name, {
        'identity.discord_user_id': discord_user_id,
    }, {
        projection: {
            '_id': false,
        },
    });

    if (!db_user_data) {
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

    const [ db_blacklisted_user_data ] = await go_mongo_db.find(db_database_name, db_blacklisted_users_collection_name, {
        $or: [
            { 'identity.discord_user_id': db_user_data.identity.discord_user_id },
            { 'identity.roblox_user_id': db_user_data.identity.roblox_user_id },
        ],
    }, {
        projection: {
            '_id': false,
        },
    });

    const db_public_roblox_products = await go_mongo_db.find(db_database_name, db_products_collection_name, {
        'public': true,
    });

    const user_product_codes = await fetchUserProductCodes(db_user_data.identity.discord_user_id) ?? [];
    const user_products = db_public_roblox_products.filter(product => user_product_codes.includes(product.code));

    const roblox_user_data: {
        name: string,
        displayName: string,
    } = await axios({
        method: 'get',
        url: `https://users.roblox.com/v1/users/${encodeURIComponent(db_user_data.identity.roblox_user_id)}`,
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

    await deferred_interaction.editReply({
        embeds: [
            ...(db_blacklisted_user_data ? [
                CustomEmbed.from({
                    color: CustomEmbed.Color.Red,
                    author: {
                        icon_url: `${client.user.displayAvatarURL({ forceStatic: false })}`,
                        name: 'Inertia Lighting | User Blacklist System',
                    },
                    description: [
                        '\`\`\`',
                        'User is blacklisted from using Inertia Lighting products!',
                        '\`\`\`',
                        '\`\`\`json',
                        `${JSON.stringify(db_blacklisted_user_data, null, 2)}`,
                        '\`\`\`',
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
                        value: `${Discord.userMention(db_user_data.identity.discord_user_id)}`,
                    }, {
                        name: 'Roblox',
                        value: `[${`@${roblox_user_data.name}` ?? 'n/a'}](https://roblox.com/users/${db_user_data.identity.roblox_user_id}/profile) (${roblox_user_data.displayName ?? 'n/a'})`,
                    },
                    // {
                    //     name: 'Lumens',
                    //     value: `${db_user_data.lumens ?? 0}`,
                    // },
                    {
                        name: 'Product Licenses',
                        value: `${user_products.length === 0 ? 'n/a' : user_products.map(product => `- ${product.name}`).join('\n')}`,
                    },
                ],
            }),
        ],
    });
}
