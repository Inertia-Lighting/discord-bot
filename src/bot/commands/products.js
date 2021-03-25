'use strict';

//---------------------------------------------------------------------------------------------------------------//

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
        const db_roblox_products = await go_mongo_db.find(process.env.MONGO_DATABASE_NAME, process.env.MONGO_PRODUCTS_COLLECTION_NAME, {});

        const public_roblox_products = db_roblox_products.filter(product => product.public);

        const public_roblox_products_chunks = array_chunks(public_roblox_products, 5);

        /* send embeds containing 5 products per embed */
        for (const public_roblox_products_chunk of public_roblox_products_chunks) {
            await message.channel.send(new Discord.MessageEmbed({
                color: 0x60A0FF,
                author: {
                    iconURL: `${client.user.displayAvatarURL({ dynamic: true })}`,
                    name: 'Inertia Lighting | Products',
                },
                description: public_roblox_products_chunk.map(product => 
                    [
                        `**Product** ${product.name}`,
                        `**Code:** ${product.code}`,
                        `**Role:** <@&${product.discord_role_id}>`,
                        `**Description:**\n\`\`\`${product.description}\`\`\``,
                    ].join('\n')
                ).join('\n'),
            })).catch(console.warn);

            await Timer(250);
        }
    },
};
