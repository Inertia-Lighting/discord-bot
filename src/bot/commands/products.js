'use strict';

//---------------------------------------------------------------------------------------------------------------//

const { array_chunks, string_ellipses, Timer } = require('../../utilities.js');

const { go_mongo_db } = require('../../mongo/mongo.js');

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

        /* split the products into a 2-dimensional array of chunks */
        const roblox_products_chunks = array_chunks(public_roblox_products, 4);

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
                        `**Product Name** ${product.name}`,
                        `**Price** ${product.price_in_robux} <:robux:759699085439139871>`,
                        `**PayPal Price** $${parseFloat(product.price_in_usd).toFixed(2)} USD (before taxes/fees)`,
                        `\nA brief overview of ${product.name}. \n\`\`\`${string_ellipses(product.description, 500)}\`\`\``,
                    ].join('\n')
                ).join('\n'),
            })).catch(console.warn);

            await Timer(250);
        }
    },
};
