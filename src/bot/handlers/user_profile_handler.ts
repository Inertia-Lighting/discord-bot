//------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
//------------------------------------------------------------//

//------------------------------------------------------------//

import axios from 'axios';

import { go_mongo_db } from '../../mongo/mongo';

import { CustomEmbed } from '../common/message';

import { Discord, client } from '../discord_client';

//------------------------------------------------------------//

const db_database_name = `${process.env.MONGO_DATABASE_NAME ?? ''}`;
if (db_database_name.length < 1) throw new Error('Environment variable: MONGO_DATABASE_NAME; is not set correctly.');

const db_products_database_name = `${process.env.MONGO_PRODUCTS_COLLECTION_NAME ?? ''}`;
if (db_products_database_name.length < 1) throw new Error('Environment variable: MONGO_PRODUCTS_COLLECTION_NAME; is not set correctly.');

const db_users_collection_name = `${process.env.MONGO_USERS_COLLECTION_NAME ?? ''}`;
if (db_users_collection_name.length < 1) throw new Error('Environment variable: MONGO_USERS_COLLECTION_NAME; is not set correctly.');

const db_blacklisted_users_collection_name = `${process.env.MONGO_BLACKLISTED_USERS_COLLECTION_NAME ?? ''}`;
if (db_blacklisted_users_collection_name.length < 1) throw new Error('Environment variable: MONGO_BLACKLISTED_USERS_COLLECTION_NAME; is not set correctly.');

//------------------------------------------------------------//

function replyToMessageOrEditReplyToInteraction(
    deferred_interaction_or_message: Discord.Interaction | Discord.Message,
    message_payload: Discord.BaseMessageOptions,
) {
    if (
        deferred_interaction_or_message instanceof Discord.CommandInteraction ||
        deferred_interaction_or_message instanceof Discord.MessageComponentInteraction
    ) {
        deferred_interaction_or_message.editReply(message_payload).catch(console.warn);
    } else if (deferred_interaction_or_message instanceof Discord.Message) {
        deferred_interaction_or_message.reply(message_payload).catch(console.warn);
    } else {
        throw new Error('replyToMessageOrEditReplyToInteraction(): deferred_interaction_or_message must be a Discord.Message or valid Discord.Interaction');
    }
}

//------------------------------------------------------------//

export async function userProfileHandler(
    deferred_interaction_or_message: Discord.Interaction | Discord.Message,
    discord_user_id: string,
) {
    const [ db_user_data ] = await go_mongo_db.find(db_database_name, db_users_collection_name, {
        'identity.discord_user_id': discord_user_id,
    }, {
        projection: {
            '_id': false,
        },
    });

    if (!db_user_data) {
        replyToMessageOrEditReplyToInteraction(deferred_interaction_or_message, {
            embeds: [
                CustomEmbed.from({
                    color: CustomEmbed.colors.YELLOW,
                    author: {
                        icon_url: `${client.user!.displayAvatarURL({ forceStatic: false })}`,
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

    const db_roblox_products = await go_mongo_db.find(db_database_name, db_products_database_name, {
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
        timeout: 10_000, // 10 seconds
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
                CustomEmbed.from({
                    color: CustomEmbed.colors.RED,
                    author: {
                        icon_url: `${client.user!.displayAvatarURL({ forceStatic: false })}`,
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
            CustomEmbed.from({
                author: {
                    icon_url: `${client.user!.displayAvatarURL({ forceStatic: false })}`,
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
