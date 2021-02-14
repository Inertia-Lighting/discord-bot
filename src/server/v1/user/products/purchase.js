'use strict';

//---------------------------------------------------------------------------------------------------------------//

const moment = require('moment-timezone');
const Discord = require('discord.js');

//---------------------------------------------------------------------------------------------------------------//

const { go_mongo_db } = require('../../../../mongo/mongo.js');
const { Timer } = require('../../../../utilities.js');

//---------------------------------------------------------------------------------------------------------------//

const guild_id = process.env.BOT_GUILD_ID;

const user_purchases_logging_channel_id = process.env.BOT_LOGGING_PURCHASES_CHANNEL_ID;

const new_customer_role_ids = process.env.BOT_NEW_CUSTOMER_AUTO_ROLE_IDS.split(',');

//---------------------------------------------------------------------------------------------------------------//

module.exports = (router, client) => {
    router.post('/v1/user/products/purchase', async (req, res) => {
        console.info(`Endpoint: ${req.url}; was called at ${moment()}!`);

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
        if (!(roblox_user_id || discord_user_id)) {
            return res.status(400).send(JSON.stringify({
                'message': 'missing \`discord_user_id\` or \`roblox_user_id\` in request body',
            }, null, 2));
        }
        if (!roblox_product_id) {
            return res.status(400).send(JSON.stringify({
                'message': 'missing \`roblox_product_id\` in request body',
            }, null, 2));
        }
        if (!api_endpoint_token) {
            return res.status(400).send(JSON.stringify({
                'message': 'missing \`api_endpoint_token\` in request body',
            }, null, 2));
        }

        /* check if the request was properly authenticated */
        if (api_endpoint_token !== process.env.API_TOKEN_FOR_USER_PRODUCTS_PURCHASE) {
            return res.status(403).send(JSON.stringify({
                'message': '\`api_endpoint_token\` was not recognized!',
            }, null, 2));
        }

        /* find the user in the database */
        const [ db_user_data ] = await go_mongo_db.find(process.env.MONGO_DATABASE_NAME, process.env.MONGO_USERS_COLLECTION_NAME, {
            ...(discord_user_id ? {
                'discord_user_id': discord_user_id,
            } : {
                'roblox_user_id': roblox_user_id,
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
            'id': roblox_product_id,
        });

        if (!db_roblox_product_data) {
            console.error(`roblox product: ${roblox_product_id}; not found in database`);
            return res.status(404).send(JSON.stringify({
                'message': `roblox product: ${roblox_product_id}; not found in database`,
            }, null, 2));
        }

        /* add the product for the user in the database */
        await go_mongo_db.update(process.env.MONGO_DATABASE_NAME, process.env.MONGO_USERS_COLLECTION_NAME, {
            ...(discord_user_id ? {
                'discord_user_id': discord_user_id,
            } : {
                'roblox_user_id': roblox_user_id,
            }),
        }, {
            $set: {
                [`products.${db_roblox_product_data.code}`]: true,
            },
        });

        const guild = await client.guilds.fetch(guild_id).catch(console.warn);
        if (!guild) {
            console.error(`unable to find discord guild: ${guild_id};`);
            return res.status(500).send(JSON.stringify({
                'message': `unable to find discord guild: ${guild_id};`,
            }, null, 2));
        }

        const guild_member = await guild.members.fetch(db_user_data.discord_user_id).catch(console.warn);
        if (!guild_member) {
            console.error(`unable to find discord user: ${guild_member.user.id}; in guild!`);
            return res.status(404).send(JSON.stringify({
                'message': `unable to find discord user: ${guild_member.user.id}; in guild!`,
            }, null, 2));
        }

        /* try to add the role to the guild member */
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
        const user_dm_channel = await guild_member.user.createDM().catch(console.warn);
        user_dm_channel?.send(new Discord.MessageEmbed({
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
        }))?.catch(console.warn);

        /* log to the logging channel */
        const user_purchases_logging_channel = await client.channels.fetch(user_purchases_logging_channel_id);
        user_purchases_logging_channel?.send(new Discord.MessageEmbed({
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
        }))?.catch(console.warn);

        /* respond with success to the game server */
        console.log(`roblox_user_id: ${roblox_user_id}; discord_user_id: ${guild_member.user.id}; bought product: ${roblox_product_id}; successfully!`);
        return res.status(200).send(JSON.stringify({
            'message': `roblox_user_id: ${roblox_user_id}; discord_user_id: ${guild_member.user.id}; bought product: ${roblox_product_id}; successfully!`,
        }, null, 2));
    });
};
