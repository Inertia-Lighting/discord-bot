/* Copyright © Inertia Lighting | All Rights Reserved */

//---------------------------------------------------------------------------------------------------------------//

import axios from 'axios';

import { go_mongo_db } from '../../mongo/mongo.js';

import { Discord, client } from '../discord_client.js';

//---------------------------------------------------------------------------------------------------------------//

function replyToMessageOrEditReplyToInteraction(
    deferred_interaction_or_message: Discord.Interaction | Discord.Message,
    message_payload: Discord.WebhookEditMessageOptions | Discord.ReplyMessageOptions,
) {
    if (
        deferred_interaction_or_message instanceof Discord.BaseCommandInteraction ||
        deferred_interaction_or_message instanceof Discord.MessageComponentInteraction
    ) {
        deferred_interaction_or_message.editReply(message_payload).catch(console.warn);
    } else if (deferred_interaction_or_message instanceof Discord.Message) {
        deferred_interaction_or_message.reply(message_payload).catch(console.warn);
    } else {
        throw new Error('replyToMessageOrEditReplyToInteraction: deferred_interaction_or_message must be a Discord.Message or Discord.Interaction');
    }
}

//---------------------------------------------------------------------------------------------------------------//

async function userProfileHandler(
    deferred_interaction_or_message: Discord.Interaction | Discord.Message,
    discord_user_id: string,
) {
    const [ db_user_data ] = await go_mongo_db.find(process.env.MONGO_DATABASE_NAME as string, process.env.MONGO_USERS_COLLECTION_NAME as string, {
        'identity.discord_user_id': discord_user_id,
    }, {
        projection: {
            '_id': false,
        },
    });

    if (!db_user_data) {
        replyToMessageOrEditReplyToInteraction(deferred_interaction_or_message, {
            embeds: [
                new Discord.MessageEmbed({
                    color: 0xFFFF00,
                    author: {
                        iconURL: `${client.user!.displayAvatarURL({ dynamic: true })}`,
                        name: 'Inertia Lighting | User Profile System',
                    },
                    title: 'Unknown User',
                    description: [
                        'That user doesn\'t exist in our database!',
                    ].join('\n'),
                }),
            ],
        });

        return;
    }

    const [ db_blacklisted_user_data ] = await go_mongo_db.find(process.env.MONGO_DATABASE_NAME as string, process.env.MONGO_BLACKLISTED_USERS_COLLECTION_NAME as string, {
        $or: [
            { 'identity.discord_user_id': db_user_data.identity.discord_user_id },
            { 'identity.roblox_user_id': db_user_data.identity.roblox_user_id },
        ],
    }, {
        projection: {
            '_id': false,
        },
    });

    const db_roblox_products = await go_mongo_db.find(process.env.MONGO_DATABASE_NAME as string, process.env.MONGO_PRODUCTS_COLLECTION_NAME as string, {
        'public': true,
    });

    const user_product_codes = Object.entries(
        db_user_data.products
    ).filter(
        ([product_code, user_owns_product]) => user_owns_product
    ).map(
        ([product_code]) => product_code
    );
    const user_products = db_roblox_products.filter(product => user_product_codes.includes(product.code));

    const {
        data: roblox_user_data,
    } = await axios({
        method: 'get',
        url: `https://users.roblox.com/v1/users/${encodeURIComponent(db_user_data.identity.roblox_user_id)}`,
        timeout: 30_000, // 30 seconds
        validateStatus: (status) => status === 200,
    }).catch(error => {
        console.trace(error);
        return {
            data: {
                name: 'Unknown User',
                displayName: 'Unknown User',
            },
        };
    });

    replyToMessageOrEditReplyToInteraction(deferred_interaction_or_message, {
        embeds: [
            ...(db_blacklisted_user_data ? [
                new Discord.MessageEmbed({
                    color: 0xFF0000,
                    author: {
                        iconURL: `${client.user!.displayAvatarURL({ dynamic: true })}`,
                        name: 'Inertia Lighting | Blacklist System',
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
            new Discord.MessageEmbed({
                color: 0x60A0FF,
                author: {
                    iconURL: `${client.user!.displayAvatarURL({ dynamic: true })}`,
                    name: 'Inertia Lighting | User Profile System',
                },
                fields: [
                    {
                        name: 'Discord',
                        value: `<@${db_user_data.identity.discord_user_id}>`,
                    }, {
                        name: 'Roblox',
                        value: `[${`@${roblox_user_data.name}` ?? 'n/a'}](https://roblox.com/users/${db_user_data.identity.roblox_user_id}/profile) (${roblox_user_data.displayName ?? 'n/a'})`,
                    }, {
                        name: 'Karma',
                        value: `${db_user_data.karma ?? 0}`,
                    }, {
                        name: 'Products',
                        value: `${user_products.length === 0 ? 'n/a' : user_products.map(product => `- ${product.name}`).join('\n')}`,
                    },
                ],
            }),
        ],
    });
}

//---------------------------------------------------------------------------------------------------------------//

export {
    userProfileHandler,
};
