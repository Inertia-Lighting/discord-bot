/* Copyright © Inertia Lighting | All Rights Reserved */

//---------------------------------------------------------------------------------------------------------------//

'use strict';

//---------------------------------------------------------------------------------------------------------------//

const { go_mongo_db } = require('../../mongo/mongo.js');

const { Discord, client } = require('../discord_client.js');

//---------------------------------------------------------------------------------------------------------------//

const command_prefix = process.env.BOT_COMMAND_PREFIX;

//---------------------------------------------------------------------------------------------------------------//

module.exports = {
    name: 'verify',
    description: 'verifies the user and adds them to the database',
    usage: 'CODE_HERE',
    aliases: ['verify', 'link'],
    permission_level: 'public',
    cooldown: 5_000,
    async execute(message, args) {
        const { command_args } = args;

        const verification_code_to_lookup = command_args[0];
        const verification_context = client.$.verification_contexts.get(verification_code_to_lookup);

        if (!verification_context) {
            message.channel.send(new Discord.MessageEmbed({
                color: 0xFF0000,
                author: {
                    iconURL: `${client.user.displayAvatarURL({ dynamic: true })}`,
                    name: `${client.user.username}`,
                },
                title: 'Error',
                description: [
                    'That verification code was not recognized!',
                    `You need to provide the verification code that was given to you in the [Product Hub](${process.env.ROBLOX_PRODUCT_HUB_URL})!`,
                    `Example: \`${command_prefix}verify CODE_HERE\``,
                ].join('\n'),
            })).catch(console.warn);
            return;
        }

        /* quickly remove the verification context b/c it is no longer needed */
        client.$.verification_contexts.delete(verification_context.verification_code);

        /* inform the user that the verification code was accepted */
        message.channel.send(new Discord.MessageEmbed({
            color: 0x00FF00,
            author: {
                iconURL: `${client.user.displayAvatarURL({ dynamic: true })}`,
                name: `${client.user.username}`,
            },
            title: 'You have successfully linked your account!',
            description: 'You may now return to the product hub.',
        })).catch(console.warn);

        const updated_user_products = {};

        const [ db_user_data ] = await go_mongo_db.find(process.env.MONGO_DATABASE_NAME, process.env.MONGO_USERS_COLLECTION_NAME, {
            'identity.roblox_user_id': verification_context.roblox_user_id,
        }, {
            projection: {
                '_id': false,
            },
        });

        const db_roblox_products = await go_mongo_db.find(process.env.MONGO_DATABASE_NAME, process.env.MONGO_PRODUCTS_COLLECTION_NAME, {});

        for (const db_roblox_product of db_roblox_products) {
            /* check the database, fallback to using their roles in the discord */
            updated_user_products[db_roblox_product.code] = db_user_data?.products?.[db_roblox_product.code] ?? message.member.roles.cache.has(db_roblox_product.discord_role_id);
        }

        await go_mongo_db.update(process.env.MONGO_DATABASE_NAME, process.env.MONGO_USERS_COLLECTION_NAME, {
            'identity.roblox_user_id': verification_context.roblox_user_id,
        }, {
            $set: {
                'identity.discord_user_id': message.author.id,
                'products': updated_user_products,
            },
        }, {
            upsert: true,
        });
    },
};
