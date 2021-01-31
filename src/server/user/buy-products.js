'use strict';

//---------------------------------------------------------------------------------------------------------------//

const Discord = require('discord.js');

//---------------------------------------------------------------------------------------------------------------//

const { go_mongo_db } = require('../../mongo/mongo.js');

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

        const [ db_user_data ] = await go_mongo_db.find(process.env.MONGO_DATABASE_NAME, process.env.MONGO_USERS_COLLECTION_NAME, {
            'ROBLOX_ID': roblox_user_id,
        });

        if (!db_user_data) {
            console.log(`roblox user: ${roblox_user_id}; not found in database`);
            res.status(404).send('roblox user not found in database');
            return;
        }

        const guild = client.guilds.resolve('601889649601806336');
        if (!guild) return;

        const guild_member = await guild.members.fetch(db_user_data._id).catch(console.warn);
        if (!guild_member) return;
        
        const dm_channel = await guild_member.createDM().catch(console.warn);
        if (!dm_channel) return;

        const [ db_roblox_product_data ] = await go_mongo_db.find(process.env.MONGO_DATABASE_NAME, process.env.MONGO_PRODUCTS_COLLECTION_NAME, {
            'id': roblox_product_id,
        });

        await go_mongo_db.update(process.env.MONGO_DATABASE_NAME, process.env.MONGO_USERS_COLLECTION_NAME, {
            'ROBLOX_ID': roblox_user_id,
        }, {
            $set: {
                [`products.${db_roblox_product_data.code}`]: true,
            },
        });

        /* dm the user */
        dm_channel.send(new Discord.MessageEmbed({
            color: 0x00FF00,
            author: {
                iconURL: `${client.user.displayAvatarURL({ dynamic: true })}`,
                name: 'Inertia Lighting | Confirmed Purchase',
            },
            title: `Thank you for purchasing ${db_roblox_product_data.name}!`,
            description: 'You have been given the roles in the Discord Server to your product',
            fields: [
                {
                    name: `${db_roblox_product_data.code}`,
                    value: `${db_roblox_product_data.description}`,
                },
            ],
        })).catch(console.warn);

        /* add the role to the user */
        guild_member.roles.add(db_roblox_product_data.discord_role_id);

        /* respond to game */
        res.status(200).send('user successfully bought the product');
    });
}

//---------------------------------------------------------------------------------------------------------------//

module.exports = {
    userProductsBuy,
};
