'use strict';

//---------------------------------------------------------------------------------------------------------------//

const { go_mongo_db } = require('../../mongo/mongo.js');

const { Discord, client } = require('../discord_client.js');

//---------------------------------------------------------------------------------------------------------------//

module.exports = {
    name: 'products',
    description: 'lists all of the products',
    aliases: ['products'],
    permission_level: 'public',
    async execute(message, args) {
        const db_roblox_products = await go_mongo_db.find(process.env.MONGO_DATABASE_NAME, process.env.MONGO_PRODUCTS_COLLECTION_NAME, {});

        console.log({ db_roblox_products });

        message.channel.send(new Discord.MessageEmbed({
            color: 0x60A0FF,
            author: {
                iconURL: `${client.user.displayAvatarURL({ dynamic: true })}`,
                name: 'Inertia Lighting | Products',
            },
            description: [
                `Hey there ${message.author}!\n\n**Here are our products:**`,
                db_roblox_products.map(product => 
                    [
                        `**Product** ${product.name}`,
                        `**Code:** ${product.code}`,
                        `**Role:** <@&${product.discord_role_id}>`,
                        `**Description:**\n\`\`\`${product.description}\`\`\``,
                    ].join('\n')
                ).join('\n'),
            ].join('\n\n'),
        })).catch(console.warn);
    },
};
