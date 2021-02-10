'use strict';

//---------------------------------------------------------------------------------------------------------------//

const moment = require('moment-timezone');
const Discord = require('discord.js');

//---------------------------------------------------------------------------------------------------------------//

const { go_mongo_db } = require('../../../../mongo/mongo.js');
const { Timer } = require('../../../../utilities.js');

//---------------------------------------------------------------------------------------------------------------//

const guild_id = process.env.BOT_GUILD_ID;

//---------------------------------------------------------------------------------------------------------------//

const user_purchases_logging_channel_id = '809182732135038977';

//---------------------------------------------------------------------------------------------------------------//

const new_customer_role_ids = [
    '655920592205119498', // "Customer"
];

//---------------------------------------------------------------------------------------------------------------//

module.exports = (router, client) => {
    router.post('/v1/user/products/buy', async (req, res) => {
        console.info(`Endpoint: ${req.url}; was called at ${moment()}!`);

        if (req.headers?.['content-type'] !== 'application/json') {
            console.error('WRONG CONTENT TYPE SENT TO SERVER!');
            return;
        }

        res.set('Content-Type', 'application/json');

        const {
            player_id: roblox_user_id,
            product_id: roblox_product_id,
        } = req.body;

        if (!roblox_user_id) {
            res.status(400).send(JSON.stringify({
                'message': 'missing \`player_id\` in request body',
            }, null, 2));
            return;
        }

        if (!roblox_product_id) {
            res.status(400).send(JSON.stringify({
                'message': 'missing \`product_id\` in request body',
            }, null, 2));
            return;
        }

        /* find the user in the database */
        const [ db_user_data ] = await go_mongo_db.find(process.env.MONGO_DATABASE_NAME, process.env.MONGO_USERS_COLLECTION_NAME, {
            'roblox_user_id': roblox_user_id,
        });

        if (!db_user_data) {
            console.error(`roblox player: ${roblox_user_id}; not found in database`);
            res.status(404).send(JSON.stringify({
                'message': 'roblox player not found in database',
            }, null, 2));
            return;
        }

        /* find the product in the database */
        const [ db_roblox_product_data ] = await go_mongo_db.find(process.env.MONGO_DATABASE_NAME, process.env.MONGO_PRODUCTS_COLLECTION_NAME, {
            'id': roblox_product_id,
        });

        if (!db_roblox_product_data) {
            console.error(`roblox product: ${roblox_product_id}; not found in database`);
            res.status(404).send(JSON.stringify({
                'message': `roblox product: ${roblox_product_id}; not found in database`,
            }, null, 2));
            return;
        }

        /* add the product for the user in the database */
        await go_mongo_db.update(process.env.MONGO_DATABASE_NAME, process.env.MONGO_USERS_COLLECTION_NAME, {
            'roblox_user_id': roblox_user_id,
        }, {
            $set: {
                [`products.${db_roblox_product_data.code}`]: true,
            },
        });

        const guild = await client.guilds.fetch(guild_id).catch(console.warn);
        if (!guild) {
            console.error(`unable to find discord guild: ${guild_id};`);
            res.status(500).send(JSON.stringify({
                'message': `unable to find discord guild: ${guild_id};`,
            }, null, 2));
            return;
        }

        const guild_member = await guild.members.fetch(db_user_data.discord_user_id).catch(console.warn);
        if (!guild_member) {
            console.error(`unable to find discord user: ${guild_member.user.id}; in guild!`);
            res.status(404).send(JSON.stringify({
                'message': `unable to find discord user: ${guild_member.user.id}; in guild!`,
            }, null, 2));
            return;
        }

        /* try to add the role to the guild member */
        try {
            await guild_member.roles.add(db_roblox_product_data.discord_role_id);
        } catch (error) {
            console.trace(`Unable to add role: ${db_roblox_product_data.discord_role_id}; to discord user: ${guild_member.user.id};`, error);
            res.status(500).send(JSON.stringify({
                'message': `Unable to add role: ${db_roblox_product_data.discord_role_id}; to discord user: ${guild_member.user.id};`,
            }, null, 2));
            return;
        }

        /* try to add the customer roles to the guild member */
        try {
            for (const customer_role_id of new_customer_role_ids) {
                await guild_member.roles.add(customer_role_id).catch(console.trace);
                await Timer(1_000); // prevent api abuse
            }
        } catch (error) {
            console.trace(`Unable to add: \`new_customer_roles\`; to discord user: ${guild_member.user.id};`, error);
            res.status(500).send(JSON.stringify({
                'message': `Unable to add: \`new_customer_roles\`; to discord user: ${guild_member.user.id};`,
            }, null, 2));
            return;
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
        res.status(200).send(JSON.stringify({
            'message': `roblox_user_id: ${roblox_user_id}; discord_user_id: ${guild_member.user.id}; bought product: ${roblox_product_id}; successfully!`,
        }, null, 2));
    });
};
