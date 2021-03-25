'use strict';

//---------------------------------------------------------------------------------------------------------------//

const axios = require('axios');

const { go_mongo_db } = require('../../mongo/mongo.js');

const { array_chunks, Timer } =require('../../utilities.js');

const { Discord, client } = require('../discord_client.js');

//---------------------------------------------------------------------------------------------------------------//

module.exports = {
    name: 'products',
    description: 'lists all of the products',
    aliases: ['products'],
    permission_level: 'public',
    cooldown: 10_000,
    async execute(message, args) {
        /* fetch all products from the database */
        const db_roblox_products = await go_mongo_db.find(process.env.MONGO_DATABASE_NAME, process.env.MONGO_PRODUCTS_COLLECTION_NAME, {});

        /* filter out non-public products */
        const public_roblox_products = db_roblox_products.filter(product => product.public);

        /* fetch the product prices from roblox */
        const public_roblox_products_with_prices = [];
        for (const public_roblox_product of public_roblox_products) {
            const {
                data: {
                    PriceInRobux: product_price_in_robux,
                },
            } = await axios.get(`https://api.roblox.com/marketplace/productDetails?productId=${encodeURIComponent(public_roblox_product.roblox_product_id)}`);

            public_roblox_product.price_in_robux = product_price_in_robux;

            public_roblox_products_with_prices.push(public_roblox_product);

            await Timer(125); // prevent api abuse
        }

        /* split the products into a 2-dimensional array of chunks */
        const roblox_products_chunks = array_chunks(public_roblox_products_with_prices, 5);

        /* send embeds containing up-to 5 products per embed */
        for (const roblox_products_chunk of roblox_products_chunks) {
            await message.channel.send(new Discord.MessageEmbed({
                color: 0x60A0FF,
                author: {
                    iconURL: `${client.user.displayAvatarURL({ dynamic: true })}`,
                    name: 'Inertia Lighting | Products',
                },
                description: roblox_products_chunk.map(product => 
                    [
                        `**Product** ${product.name}`,
                        `**Code:** ${product.code}`,
                        `**Price:** <:robux:759699085439139871> ${product.price_in_robux}`,
                        `**Role:** <@&${product.discord_role_id}>`,
                        `**Description:**\n\`\`\`${product.description}\`\`\``,
                    ].join('\n')
                ).join('\n'),
            })).catch(console.warn);

            await Timer(250);
        }
    },
};
