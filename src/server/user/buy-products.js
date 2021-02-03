'use strict';

//---------------------------------------------------------------------------------------------------------------//

const Discord = require('discord.js');

//---------------------------------------------------------------------------------------------------------------//

const { go_mongo_db } = require('../../mongo/mongo.js');

//---------------------------------------------------------------------------------------------------------------//

const guild_id = process.env.BOT_GUILD_ID;

//---------------------------------------------------------------------------------------------------------------//

async function userProductsBuy(router, client) {
    router.post('/user/products/buy', async (req, res) => {
        console.info(`Endpoint: ${req.url}; has been called!`);
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
            'ROBLOX_ID': roblox_user_id,
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
            'ROBLOX_ID': roblox_user_id,
        }, {
            $set: {
                [`products.${db_roblox_product_data.code}`]: true,
            },
        });

        const guild = client.guilds.resolve(guild_id);
        if (!guild) {
            console.error(`unable to find discord guild: ${guild_id};`);
            res.status(500).send(JSON.stringify({
                'message': `unable to find discord guild: ${guild_id};`,
            }, null, 2));
            return;
        }

        const guild_member = await guild.members.fetch(db_user_data._id).catch(console.warn);
        if (!guild_member) {
            console.error(`unable to find discord user: ${guild_member.user.id}; in guild!`);
            res.status(404).send(JSON.stringify({
                'message': `unable to find discord user: ${guild_member.user.id}; in guild!`,
            }, null, 2));
            return;
        }

        /* open dms with the user */
        const dm_channel = await guild_member.user.createDM().catch(console.warn);
        if (!dm_channel) {
            console.error(`unable to dm discord user: ${guild_member.user.id};`);
            res.status(500).send(JSON.stringify({
                'message': `unable to dm discord user: ${guild_member.user.id};`,
            }, null, 2));
            return;
        }

        /* dm the user */
        dm_channel.send(new Discord.MessageEmbed({
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
        })).catch(console.warn);

        /* try to add the role to the guild member */
        try {
            await guild_member.roles.add(db_roblox_product_data.discord_role_id);
        } catch {
            console.error(`Unable to add role: ${db_roblox_product_data.discord_role_id}; to discord user: ${guild_member.user.id};`);
            res.status(500).send(JSON.stringify({
                'message': `Unable to add role: ${db_roblox_product_data.discord_role_id}; to discord user: ${guild_member.user.id};`,
            }, null, 2));
            return;
        }

        /* respond to the game server */
        console.log(`player: ${roblox_user_id}; user: ${guild_member.user.id}; bought product: ${roblox_product_id}; successfully!`);
        res.status(200).send(JSON.stringify({
            'message': `player: ${roblox_user_id}; user: ${guild_member.user.id}; bought product: ${roblox_product_id}; successfully!`,
        }, null, 2));
    });
}

//---------------------------------------------------------------------------------------------------------------//

module.exports = {
    userProductsBuy,
};
