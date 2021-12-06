/* Copyright © Inertia Lighting | All Rights Reserved */

//---------------------------------------------------------------------------------------------------------------//

'use strict';

//---------------------------------------------------------------------------------------------------------------//

const { go_mongo_db } = require('../../mongo/mongo.js');

const { Discord, client } = require('../discord_client.js');

const { command_permission_levels } = require('../common/bot.js');

//---------------------------------------------------------------------------------------------------------------//

module.exports = {
    name: 'verify',
    description: 'verifies and adds a user to the database',
    usage: 'CODE_HERE',
    aliases: ['verify'],
    permission_level: command_permission_levels.PUBLIC,
    cooldown: 5_000,
    async execute(message, args) {
        const { command_prefix, command_args } = args;

        const [ db_user_data ] = await go_mongo_db.find(process.env.MONGO_DATABASE_NAME, process.env.MONGO_USERS_COLLECTION_NAME, {
            'identity.discord_user_id': message.author.id,
        }, {
            projection: {
                '_id': false,
            },
        });
        if (db_user_data) {
            await message.channel.send({
                embeds: [
                    new Discord.MessageEmbed({
                        color: 0xFF0000,
                        author: {
                            iconURL: `${client.user.displayAvatarURL({ dynamic: true })}`,
                            name: `${client.user.username} | Verification System`,
                        },
                        title: 'You are already verified!',
                        description: [
                            `${message.author} is already verified and linked to a roblox account in our database!`,
                            'If you want to modify your linked accounts, please open an **Account Recovery** support ticket.',
                        ].join('\n'),
                    }),
                ],
            }).catch(console.warn);
            return; // don't allow the user to verify if they're already verified
        }

        const verification_code_to_lookup = `${command_args[0]}`.trim();
        const verification_context = client.$.verification_contexts.get(verification_code_to_lookup);

        if (!verification_context) {
            await message.channel.send({
                embeds: [
                    new Discord.MessageEmbed({
                        color: 0xFFFF00,
                        author: {
                            iconURL: `${client.user.displayAvatarURL({ dynamic: true })}`,
                            name: `${client.user.username} | Verification System`,
                        },
                        title: 'Invalid verification code!',
                        description: [
                            'This command is used to verify your roblox account in our database.',
                            '',
                            'You need to use the verification code given to you by our Product Hub!',
                            `Example: \`${command_prefix}verify CODE_HERE\``,
                        ].join('\n'),
                    }),
                ],
                components: [
                    {
                        type: 1,
                        components: [
                            {
                                type: 2,
                                style: 5,
                                label: 'Product Hub',
                                url: 'https://product-hub.inertia.lighting/',
                            },
                        ],
                    },
                ],
            }).catch(console.warn);
            return;
        }

        /* quickly remove the verification context b/c it is no longer needed */
        client.$.verification_contexts.delete(verification_context.verification_code);

        const db_roblox_products = await go_mongo_db.find(process.env.MONGO_DATABASE_NAME, process.env.MONGO_PRODUCTS_COLLECTION_NAME, {});

        /** @type {Object<string, boolean>} */
        const updated_user_products = {};
        for (const db_roblox_product of db_roblox_products) {
            updated_user_products[db_roblox_product.code] = false;
        }

        /* update the user in the database with the correct information */
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

        /* inform the user that their verification was successful */
        await message.channel.send({
            embeds: [
                new Discord.MessageEmbed({
                    color: 0x00FF00,
                    author: {
                        iconURL: `${client.user.displayAvatarURL({ dynamic: true })}`,
                        name: `${client.user.username} | Verification System`,
                    },
                    title: 'You have successfully verified!',
                    description: 'Go back to the Product Hub to continue.',
                }),
            ],
        }).catch(console.warn);
    },
};
