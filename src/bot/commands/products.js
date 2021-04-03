'use strict';

//---------------------------------------------------------------------------------------------------------------//

const { array_chunks, string_ellipses, Timer } = require('../../utilities.js');

const { go_mongo_db } = require('../../mongo/mongo.js');

const { Discord, client } = require('../discord_client.js');

//---------------------------------------------------------------------------------------------------------------//

const product_price_service_fee_for_usd = parseFloat(process.env.ECONOMICS_PRODUCT_PRICE_SERVICE_FEE_FOR_USD);

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

        /* split the products into a 2-dimensional array of chunks */
        const roblox_products_chunks = array_chunks(public_roblox_products, 5);

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
                        `**Price:** $${(parseFloat(product.price_in_usd) + product_price_service_fee_for_usd).toFixed(2)} USD`,
                        `**Role:** <@&${product.discord_role_id}>`,
                        `**Description:**\n\`\`\`${string_ellipses(product.description, 1000)}\`\`\``,
                    ].join('\n')
                ).join('\n'),
            })).catch(console.warn);

            await Timer(250);
        }
    },
};
