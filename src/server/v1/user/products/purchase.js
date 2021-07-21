/* Copyright © Inertia Lighting | All Rights Reserved */

//---------------------------------------------------------------------------------------------------------------//

'use strict';

//---------------------------------------------------------------------------------------------------------------//

const Discord = require('discord.js');
const bcrypt = require('bcryptjs');

const { go_mongo_db } = require('../../../../mongo/mongo.js');

//---------------------------------------------------------------------------------------------------------------//

const guild_id = process.env.BOT_GUILD_ID;

const user_purchases_logging_channel_id = process.env.BOT_LOGGING_PURCHASES_CHANNEL_ID;

const new_customer_role_ids = process.env.BOT_NEW_CUSTOMER_AUTO_ROLE_IDS.split(',');

//---------------------------------------------------------------------------------------------------------------//

module.exports = (router, client) => {
    router.post('/v1/user/products/purchase', async (req, res) => {
        res.set('Content-Type', 'application/json');

        if (req.headers?.['content-type'] !== 'application/json') {
            return res.status(415).send(JSON.stringify({
                'message': '\`content-type\` must be \`application/json\`!',
            }, null, 2));
        }

        // console.log('req.body', req.body);

        const {
            api_endpoint_token: api_endpoint_token,
            product_codes: product_codes,
            discord_user_id: discord_user_id,
            roblox_user_id: roblox_user_id,
            paypal_order_id: paypal_order_id,
        } = req.body;

        /* check if required information is present */
        if (!(roblox_user_id || discord_user_id) || typeof (roblox_user_id ?? discord_user_id) !== 'string') {
            return res.status(400).send(JSON.stringify({
                'message': 'missing (string) \`discord_user_id\` or (string) \`roblox_user_id\` in request body',
            }, null, 2));
        }
        if (!Array.isArray(product_codes)) {
            return res.status(400).send(JSON.stringify({
                'message': 'missing (array) \`product_codes\` in request body',
            }, null, 2));
        }
        if (paypal_order_id && typeof paypal_order_id !== 'string') {
            return res.status(400).send(JSON.stringify({
                'message': 'incorrect type for optional (string) \`paypal_order_id\` in request body',
            }, null, 2));
        }
        if (!api_endpoint_token || typeof api_endpoint_token !== 'string') {
            return res.status(400).send(JSON.stringify({
                'message': 'missing (string) \`api_endpoint_token\` in request body',
            }, null, 2));
        }

        /* check if the request was properly authenticated */
        const api_endpoint_token_is_valid = bcrypt.compareSync(api_endpoint_token, process.env.API_HASHED_TOKEN_FOR_USER_PRODUCTS_PURCHASE);
        if (!api_endpoint_token_is_valid) {
            return res.status(403).send(JSON.stringify({
                'message': '\`api_endpoint_token\` was not recognized!',
            }, null, 2));
        }

        /* find the user in the database */
        const [ db_user_data ] = await go_mongo_db.find(process.env.MONGO_DATABASE_NAME, process.env.MONGO_USERS_COLLECTION_NAME, {
            ...(discord_user_id ? {
                'identity.discord_user_id': discord_user_id,
            } : {
                'identity.roblox_user_id': roblox_user_id,
            }),
        });

        /* check if the user exists */
        if (!db_user_data) {
            console.error(`discord_user_id: ${discord_user_id}; roblox_user_id: ${roblox_user_id}; not found in database`);
            return res.status(404).send(JSON.stringify({
                'message': `discord_user_id: ${discord_user_id}; roblox_user_id: ${roblox_user_id}; not found in database`,
            }, null, 2));
        }

        /* fetch all products from the database */
        const db_roblox_products = await go_mongo_db.find(process.env.MONGO_DATABASE_NAME, process.env.MONGO_PRODUCTS_COLLECTION_NAME, {});

        /* handle an edge-case where a product_code might be present more than once */
        const specified_product_codes = Array.from(new Set(product_codes));

        /* get the specified products */
        const specified_products = [];
        for (const specified_product_code of specified_product_codes) {
            const specified_product = db_roblox_products.find(db_product => db_product.code === specified_product_code);

            /* check if the product exists */
            if (!specified_product) {
                console.error(`product_code: ${specified_product_code}; not found in database`);
                return res.status(404).send(JSON.stringify({
                    'message': `product_code: ${specified_product_code}; not found in database`,
                }, null, 2));
            }

            /* check if the user already owns the product */
            if (db_user_data.products[specified_product.code]) {
                console.error(`product_code: ${specified_product.code}; already belongs to discord_user_id: ${db_user_data.identity.discord_user_id}; roblox_user_id: ${db_user_data.identity.roblox_user_id};`);
                return res.status(403).send(JSON.stringify({
                    'message': `product_code: ${specified_product.code}; already belongs to discord_user_id: ${db_user_data.identity.discord_user_id}; roblox_user_id: ${db_user_data.identity.roblox_user_id};`,
                }, null, 2));
            }

            specified_products.push(specified_product);
        }

        /* give the products to the user in the database */
        try {
            const db_user_products_update_operation = {};
            for (const specified_product of specified_products) {
                db_user_products_update_operation[`products.${specified_product.code}`] = true;
            }

            await go_mongo_db.update(process.env.MONGO_DATABASE_NAME, process.env.MONGO_USERS_COLLECTION_NAME, {
                'identity.discord_user_id': db_user_data.identity.discord_user_id,
                'identity.roblox_user_id': db_user_data.identity.roblox_user_id,
            }, {
                $set: db_user_products_update_operation,
            });
        } catch (error) {
            console.trace('Failed to update user products in the database!', error);
            return res.status(500).send(JSON.stringify({
                'message': 'failed to update user products in the database',
            }, null, 2));
        }

        try {
            /* fetch the guild */
            const guild = await client.guilds.fetch(guild_id);

            /* fetch the guild member */
            const guild_member = await guild.members.fetch(db_user_data.identity.discord_user_id);

            /* try to add the customer roles to the guild member */
            await guild_member.roles.add(new_customer_role_ids);

            /* fetch the product role ids */
            const product_role_ids = specified_products.map(specified_product => specified_product.discord_role_id);

            /* try to add the product role to the guild member */
            await guild_member.roles.add(product_role_ids);

            /* fetch the product names */
            const product_names = specified_products.map(specified_product => specified_product.name);

            /* dm the user a confirmation of their purchase */
            const user_dm_channel = await guild_member.user.createDM();
            await user_dm_channel.send({
                embeds: [
                    new Discord.MessageEmbed({
                        color: 0x00FF00,
                        author: {
                            iconURL: `${client.user.displayAvatarURL({ dynamic: true })}`,
                            name: 'Inertia Lighting | Confirmed Purchase',
                        },
                        title: 'Thank you for your purchase!',
                        description: [
                            `You obtained: ${product_names.map(product_name => `**${product_name}**`).join(', ')}.`,
                            'Go to [our website](https://inertia.lighting/products) to download your product(s).',
                            ...(paypal_order_id ? [
                                `For future reference, ||\`${paypal_order_id}\`|| was your paypal order id!`,
                            ] : []),
                        ].join('\n'),
                    }),
                ],
            });
        } catch (error) {
            console.trace('Failed to either give product roles in the discord or dm the guild member!', error);
        }

        /* log to the purchase logging channel */
        try {
            const user_purchases_logging_channel = client.channels.resolve(user_purchases_logging_channel_id);
            await user_purchases_logging_channel.send({
                embeds: [
                    new Discord.MessageEmbed({
                        color: 0x00FF00,
                        author: {
                            iconURL: `${client.user.displayAvatarURL({ dynamic: true })}`,
                            name: 'Inertia Lighting | Confirmed Purchase',
                        },
                        description: [
                            `**Discord Mention:** <@${db_user_data.identity.discord_user_id}>`,
                            `**Roblox User Id:** \`${db_user_data.identity.roblox_user_id}\``,
                            `**Product Codes:** \`${specified_product_codes.join(', ')}\``,
                            ...(paypal_order_id ? [
                                `**PayPal Order Id**: \`${paypal_order_id}\``,
                            ] : []),
                        ].join('\n'),
                    }),
                ],
            });
        } catch (error) {
            console.trace('Failed to log the purchase to the purchases logging channel!', error);
        }

        /* respond with a success */
        return res.status(200).send(JSON.stringify({
            'message': `roblox_user_id: ${db_user_data.identity.roblox_user_id}; discord_user_id: ${db_user_data.identity.discord_user_id}; bought product_codes: ${specified_product_codes.join(',')}; successfully!`,
        }, null, 2));
    });
};
