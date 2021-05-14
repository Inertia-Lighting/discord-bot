/* Copyright © Inertia Lighting | All Rights Reserved */

//---------------------------------------------------------------------------------------------------------------//

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
        /* send an initial message to the user */
        const bot_message = await message.channel.send(new Discord.MessageEmbed({
            color: 0x60A0FF,
            description: 'Loading products...',
        }));

        /* create a small user-experience delay */
        await Timer(500);

        /* fetch all products from the database */
        const db_roblox_products = await go_mongo_db.find(process.env.MONGO_DATABASE_NAME, process.env.MONGO_PRODUCTS_COLLECTION_NAME, {});

        /* filter out non-public products */
        const public_roblox_products = db_roblox_products.filter(product => product.public);

        /* split the products into a 2-dimensional array of chunks */
        const roblox_products_chunks = array_chunks(public_roblox_products, 1);

        /* send a carousel containing 1 product per page */
        let page_index = 0;

        async function editEmbedWithNextProductChunk() {
            const roblox_products_chunk = roblox_products_chunks[page_index];

            await bot_message.edit(new Discord.MessageEmbed({
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

            return; // complete async
        }

        await editEmbedWithNextProductChunk();
        await bot_message.react('⬅️');
        await bot_message.react('➡️');
        await bot_message.react('⏹️');

        const message_reaction_filter = (reaction, user) => true;
        const message_reaction_collector = bot_message.createReactionCollector(message_reaction_filter, {
            time: 5 * 60_000, // 5 minutes
        });

        message_reaction_collector.on('collect', async () => {
            message_reaction_collector.resetTimer();

            switch (reaction.emoji.name) {
                case '⬅️':
                    page_index = page_index < roblox_products_chunks ? page_index + 1 : 0;
                    break;
                case '➡️':
                    page_index = page_index > 0 ? page_index - 1 : 0;
                    break;
                case '⏹️':
                    message_reaction_collector.stop();
                    break;
                default:
                    break;
            }

            if (!message_reaction_collector.ended) {
                editEmbedWithNextProductChunk();
            }
        });

        message_reaction_collector.on('end', async () => {
            await bot_message.delete();
        });
    },
};
