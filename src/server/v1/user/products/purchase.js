/* Copyright © Inertia Lighting | All Rights Reserved */

//---------------------------------------------------------------------------------------------------------------//

'use strict';

//---------------------------------------------------------------------------------------------------------------//

const Discord = require('discord.js');
const bcrypt = require('bcryptjs');

const { go_mongo_db } = require('../../../../mongo/mongo.js');
const { Timer } = require('../../../../utilities.js');

//---------------------------------------------------------------------------------------------------------------//

const guild_id = process.env.BOT_GUILD_ID;

const user_purchases_logging_channel_id = process.env.BOT_LOGGING_PURCHASES_CHANNEL_ID;

const new_customer_role_ids = process.env.BOT_NEW_CUSTOMER_AUTO_ROLE_IDS.split(',');

//---------------------------------------------------------------------------------------------------------------//

module.exports = (router, client) => {
    router.post('/v1/user/products/purchase', async (req, res) => {
        res.set('Content-Type', 'application/json');

        if (req.headers?.['content-type'] !== 'application/json') {
            res.status(415).send(JSON.stringify({
                'message': '\`content-type\` must be \`application/json\`!',
            }, null, 2));
            return;
        }

        // console.log('req.body', req.body);

        const {
            api_endpoint_token: api_endpoint_token,
            roblox_product_id: roblox_product_id,
            discord_user_id: discord_user_id,
            roblox_user_id: roblox_user_id,
        } = req.body;

        /* check if required information is present */
        if (!(roblox_user_id || discord_user_id) || typeof (roblox_user_id ?? discord_user_id) !== 'string') {
            return res.status(400).send(JSON.stringify({
                'message': 'missing (string) \`discord_user_id\` or (string) \`roblox_user_id\` in request body',
            }, null, 2));
        }
        if (!roblox_product_id || typeof roblox_product_id !== 'string') {
            return res.status(400).send(JSON.stringify({
                'message': 'missing (string) \`roblox_product_id\` in request body',
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

        if (!db_user_data) {
            console.error(`discord_user_id: ${discord_user_id}; roblox_user_id: ${roblox_user_id}; not found in database`);
            return res.status(404).send(JSON.stringify({
                'message': `discord_user_id: ${discord_user_id}; roblox_user_id: ${roblox_user_id}; not found in database`,
            }, null, 2));
        }

        /* find the product in the database */
        const [ db_roblox_product_data ] = await go_mongo_db.find(process.env.MONGO_DATABASE_NAME, process.env.MONGO_PRODUCTS_COLLECTION_NAME, {
            'roblox_product_id': roblox_product_id,
        });

        if (!db_roblox_product_data) {
            console.error(`roblox_product_id: ${roblox_product_id}; not found in database`);
            return res.status(404).send(JSON.stringify({
                'message': `roblox_product_id: ${roblox_product_id}; not found in database`,
            }, null, 2));
        }

        /* check if the user already owns the product */
        if (db_user_data.products[db_roblox_product_data.code]) {
            console.error(`roblox_product_id: ${roblox_product_id}; already belongs to discord_user_id: ${discord_user_id}; roblox_user_id: ${roblox_user_id};`);
            return res.status(403).send(JSON.stringify({
                'message': `roblox_product_id: ${roblox_product_id}; already belongs to discord_user_id: ${discord_user_id}; roblox_user_id: ${roblox_user_id};`,
            }, null, 2));
        }

        /* add the product for the user in the database */
        try {
            await go_mongo_db.update(process.env.MONGO_DATABASE_NAME, process.env.MONGO_USERS_COLLECTION_NAME, {
                ...(discord_user_id ? {
                    'identity.discord_user_id': discord_user_id,
                } : {
                    'identity.roblox_user_id': roblox_user_id,
                }),
            }, {
                $set: {
                    [`products.${db_roblox_product_data.code}`]: true,
                },
            });
        } catch (error) {
            console.trace('Failed to update user products in the database!', error);
            return res.status(500).send(JSON.stringify({
                'message': `failed to update user products in the database`,
            }, null, 2));
        }

        const guild = await client.guilds.fetch(guild_id).catch(console.warn);
        if (!guild) {
            console.error(`unable to find discord guild: ${guild_id};`);
            return res.status(500).send(JSON.stringify({
                'message': `unable to find discord guild: ${guild_id};`,
            }, null, 2));
        }

        const guild_member = await guild.members.fetch(db_user_data.identity.discord_user_id).catch(console.warn);
        if (!guild_member) {
            console.error(`unable to find discord user: ${guild_member.user.id}; in guild!`);
            return res.status(404).send(JSON.stringify({
                'message': `unable to find discord user: ${guild_member.user.id}; in guild!`,
            }, null, 2));
        }

        /* try to add the role to the guild member! */
        try {
            await guild_member.roles.add(db_roblox_product_data.discord_role_id);
        } catch (error) {
            console.trace(`Unable to add role: ${db_roblox_product_data.discord_role_id}; to discord user: ${guild_member.user.id};`, error);
            return res.status(500).send(JSON.stringify({
                'message': `Unable to add role: ${db_roblox_product_data.discord_role_id}; to discord user: ${guild_member.user.id};`,
            }, null, 2));
        }

        /* try to add the customer roles to the guild member */
        try {
            for (const customer_role_id of new_customer_role_ids) {
                await guild_member.roles.add(customer_role_id).catch(console.trace);
                await Timer(1_000); // prevent api abuse
            }
        } catch (error) {
            console.trace(`Unable to add: \`new_customer_roles\`; to discord user: ${guild_member.user.id};`, error);
            return res.status(500).send(JSON.stringify({
                'message': `Unable to add: \`new_customer_roles\`; to discord user: ${guild_member.user.id};`,
            }, null, 2));
        }

        /* dm the user a confirmation of their purchase */
        try {
            const user_dm_channel = await guild_member.user.createDM();
            await user_dm_channel.send(new Discord.MessageEmbed({
                color: 0x00FF00,
                author: {
                    iconURL: `${client.user.displayAvatarURL({ dynamic: true })}`,
                    name: 'Inertia Lighting | Confirmed Purchase',
                },
                title: `Thank you for purchasing ${db_roblox_product_data.name}!`,
                description: `You obtained the ${db_roblox_product_data.name} role in the Inertia Lighting discord.`,
                fields: [
                    {
                        name: `${db_roblox_product_data.name}`,
                        value: `${db_roblox_product_data.description}`,
                    },
                ],
            }));
        } catch {
            // ignore any errors
        }

        /* log to the purchases logging channel */
        try {
            const user_purchases_logging_channel = client.channels.resolve(user_purchases_logging_channel_id);
            await user_purchases_logging_channel.send(new Discord.MessageEmbed({
                color: 0x00FF00,
                author: {
                    iconURL: `${client.user.displayAvatarURL({ dynamic: true })}`,
                    name: 'Inertia Lighting | Confirmed Purchase',
                },
                description: [
                    `**Discord user:** <@${guild_member.user.id}>`,
                    `**Roblox user:** \`${roblox_user_id}\``,
                    `**Bought product:** \`${db_roblox_product_data.code}\``,
                ].join('\n'),
            }));
        } catch (error) {
            console.trace('Failed to log purchase to the purchases logging channel!', error);
        }

        /* log to the console */
        console.log(`roblox_user_id: ${roblox_user_id}; discord_user_id: ${guild_member.user.id}; bought product: ${db_roblox_product_data.code} (${roblox_product_id}); successfully!`);
        console.log('----------------------------------------------------------------------------------------------------------------');

        /* respond with success to the game server */
        return res.status(200).send(JSON.stringify({
            'message': `roblox_user_id: ${roblox_user_id}; discord_user_id: ${guild_member.user.id}; bought product: ${db_roblox_product_data.code} (${roblox_product_id}); successfully!`,
        }, null, 2));
    });
};
