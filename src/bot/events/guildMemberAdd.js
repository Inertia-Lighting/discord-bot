'use strict';

//---------------------------------------------------------------------------------------------------------------//

const { Timer } = require('../../utilities.js');
const { go_mongo_db } = require('../../mongo/mongo.js');
const { Discord, client } = require('../discord_client.js');

//---------------------------------------------------------------------------------------------------------------//

const new_user_role_ids = [
    '601945352848801794', // "Users"
];

//---------------------------------------------------------------------------------------------------------------//

module.exports = {
    name: 'guildMemberAdd',
    async handler(member) {
        /* give roles to new users */
        for (const role_id of new_user_role_ids) {
            await member.roles.add(role_id).catch(console.warn);
            await Timer(1_000); // prevent api abuse
        }

        /* fetch user data from the database */
        const [ db_user_data ] = await go_mongo_db.find(process.env.MONGO_DATABASE_NAME, process.env.MONGO_USERS_COLLECTION_NAME, {
            'discord_user_id': member.id,
        });

        /* don't continue if the user isn't in the database */
        if (!db_user_data) return;

        /* fetch an up-to-date copy of the products and their info */
        const db_roblox_products = await go_mongo_db.find(process.env.MONGO_DATABASE_NAME, process.env.MONGO_PRODUCTS_COLLECTION_NAME, {});

        /* iterate over all products in the user (includes non-owned products) */
        for (const [ product_code, user_owns_product ] of Object.entries(db_user_data.products ?? {})) {
            console.log(`${member.displayName}`, { product_code, user_owns_product });

            /* find the product info from the recently fetched products */
            const product = db_roblox_products.find(product => product.code === product_code);

            /* give the user the role for the product if they own it */
            if (user_owns_product) {
                await member.roles.add(product.discord_role_id).catch(console.warn);
            }

            await Timer(1_000); // prevent api abuse
        }

        /* dm the user about the auto-verification */
        const dm_channel = await member.user.createDM();
        dm_channel.send(new Discord.MessageEmbed({
            color: 0x00FF00,
            author: {
                iconURL: `${client.user.displayAvatarURL({ dynamic: true })}`,
                name: 'Inertia Lighting | Auto-Verification',
            },
            description: [
                `Hey there ${member.user}!`,
                'You were auto-verified since you are already in our system!',
            ].join('\n\n'),
        })).catch(console.warn);
    },
};
