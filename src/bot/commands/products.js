'use strict';

//---------------------------------------------------------------------------------------------------------------//

const mongo = require('../../mongo/mongo.js');
const productSchema = require('../../mongo/schemas/productSchema.js');

const { Discord, client } = require('../discord_client.js');

//---------------------------------------------------------------------------------------------------------------//

module.exports = {
    name: 'products',
    description: 'lists all of the products',
    aliases: ['products'],
    async execute(message, args) {
        await mongo();

        const db_roblox_products = await productSchema.find({});

        message.channel.send(new Discord.MessageEmbed({
            color: 0x404040,
            author: {
                iconURL: `${client.user.displayAvatarURL({ dynamic: true })}`,
                name: 'Inertia Lighting | Products',
            },
            description: [
                `Hey there ${message.author}!\nHere are our products:`,
                db_roblox_products.map(product => 
                    [
                        `**${product.name}**`,
                        `**Code:** ${product.code}`,
                        `**Role:** <@&${product.discord_role_id}>`,
                        `**Description:**\n\`\`\`${product.description}\`\`\``,
                    ].join('\n')
                ).join('\n\n')
            ].join('\n\n'),
            // fields: db_roblox_products.map(product => ({
            //     name: `Product`,
            //     value: [
            //         `**Name:** ${product.name}`,
            //         `**Code:** ${product.code}`,
            //         `**Role:** <@&${product.discord_role_id}>`,
            //         `**Description:**\n${product.description}`,
            //     ].join('\n'),
            // })),
        })).catch(console.warn);

        console.log({ db_roblox_products });
    },
};
