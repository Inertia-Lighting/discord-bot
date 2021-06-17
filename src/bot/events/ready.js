/* Copyright © Inertia Lighting | All Rights Reserved */

//---------------------------------------------------------------------------------------------------------------//

'use strict';

//---------------------------------------------------------------------------------------------------------------//

const axios = require('axios');
const moment = require('moment-timezone');

//---------------------------------------------------------------------------------------------------------------//

const { Timer } =require('../../utilities.js');

const { go_mongo_db } = require('../../mongo/mongo.js');

const { client } = require('../discord_client.js');

//---------------------------------------------------------------------------------------------------------------//

const command_prefix = process.env.BOT_COMMAND_PREFIX;

//---------------------------------------------------------------------------------------------------------------//

const updateBotPresence = ((client) => {
    const bot_custom_statuses = [
        `with ${command_prefix}help`,
        'with Inertia Lighting Developers!',
        'with Inertia Lighting Products!',
        'with Roblox!',
    ];

    return (async () => {
        const first_status_item = bot_custom_statuses.shift(); // remove the first item and return it

        const updated_presence = await client.user.setPresence({
            status: 'online',
            activity: {
                type: 'PLAYING',
                name: `${first_status_item}`,
            },
        });

        bot_custom_statuses.push(first_status_item); // append first_status_item to the end of the array

        return updated_presence;
    });
})(client);

const setProductPricesInDB = async () => {
    /* fetch all products from the database */
    const db_roblox_products = await go_mongo_db.find(process.env.MONGO_DATABASE_NAME, process.env.MONGO_PRODUCTS_COLLECTION_NAME, {});

    /* fetch the product prices from roblox and apply it to the database */
    for (const db_roblox_product of db_roblox_products) {
        let product_price_in_robux;
        try {
            const { data: response_data } = await axios.get(`https://api.roblox.com/marketplace/productDetails?productId=${encodeURIComponent(db_roblox_product.roblox_product_id)}`);
            product_price_in_robux = response_data.PriceInRobux;
        } catch {
            console.warn(`Unable to fetch price for product: ${db_roblox_product.code}; skipping product!`);
            continue; // skip this product since the price cannot be fetched
        }

        await go_mongo_db.update(process.env.MONGO_DATABASE_NAME, process.env.MONGO_PRODUCTS_COLLECTION_NAME, {
            roblox_product_id: db_roblox_product.roblox_product_id,
        }, {
            $set: {
                'price_in_robux': parseInt(product_price_in_robux), // robux can only be an integer
            },
        });

        await Timer(250); // prevent api abuse
    }
};

//---------------------------------------------------------------------------------------------------------------//

module.exports = {
    name: 'ready',
    async handler() {
        const ready_timestamp = `${moment()}`;
        console.log('----------------------------------------------------------------------------------------------------------------');
        console.log(`Discord Bot Logged in as ${client.user.tag} on ${ready_timestamp}`);
        console.log('----------------------------------------------------------------------------------------------------------------');

        /* update the bot presence every 5 minutes */
        setInterval(async () => await updateBotPresence(), 5 * 60_000);

        /* update the product prices in the database after 1 minute */
        setTimeout(async () => await setProductPricesInDB(), 1 * 60_000);
    },
};
