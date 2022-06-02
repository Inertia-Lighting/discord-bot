/* Copyright © Inertia Lighting | All Rights Reserved */

//---------------------------------------------------------------------------------------------------------------//

'use strict';

//---------------------------------------------------------------------------------------------------------------//

const {
    Timer,
    string_ellipses,
} = require('../../utilities.js');

const { go_mongo_db } = require('../../mongo/mongo.js');

const {
    Discord,
    client,
} = require('../discord_client.js');

const { command_permission_levels } = require('../common/bot.js');

//---------------------------------------------------------------------------------------------------------------//

module.exports = {
    name: 'products',
    description: 'lists all of the products',
    aliases: ['products'],
    permission_level: command_permission_levels.PUBLIC,
    cooldown: 10_000,
    async execute(message, args) {
        /* send an initial message to the user */
        const bot_message = await message.channel.send({
            embeds: [
                new Discord.MessageEmbed({
                    color: 0x60A0FF,
                    description: 'Loading products...',
                }),
            ],
        });

        /* create a small user-experience delay */
        await Timer(500);

        /* fetch products from the database */
        const db_roblox_products = await go_mongo_db.find(process.env.MONGO_DATABASE_NAME, process.env.MONGO_PRODUCTS_COLLECTION_NAME, {
            'public': true,
        });

        await bot_message.edit({
            components: [
                {
                    type: 1,
                    components: [
                        {
                            type: 2,
                            style: 2,
                            custom_id: 'previous',
                            emoji: {
                                id: null,
                                name: '⬅️',
                            },
                        }, {
                            type: 2,
                            style: 2,
                            custom_id: 'next',
                            emoji: {
                                id: null,
                                name: '➡️',
                            },
                        }, {
                            type: 2,
                            style: 2,
                            custom_id: 'stop',
                            emoji: {
                                id: null,
                                name: '⏹️',
                            },
                        }, {
                            type: 2,
                            style: 5,
                            label: 'Products & Downloads',
                            url: 'https://inertia.lighting/products',
                        }, {
                            type: 2,
                            style: 5,
                            label: 'Testing Game',
                            url: 'https://demo.inertia.lighting/',
                        },
                    ],
                },
            ],
        });

        /* send a carousel containing 1 product per page */
        let page_index = 0;

        async function editEmbedWithNextProduct() {
            const public_roblox_product = db_roblox_products[page_index];

            await bot_message.edit({
                embeds: [
                    new Discord.MessageEmbed({
                        color: 0x60A0FF,
                        author: {
                            iconURL: `${client.user.displayAvatarURL({ dynamic: true })}`,
                            name: 'Inertia Lighting | Products',
                        },
                        description: [
                            `**Product Name:** ${public_roblox_product.name}`,
                            `**Price:** ${public_roblox_product.price_in_robux} <:robux:759699085439139871>`,
                            `**PayPal Price:** $${Number.parseFloat(public_roblox_product.price_in_usd).toFixed(2)} USD`,
                            '**Description:**',
                            '\`\`\`',
                            `${string_ellipses(Discord.Util.cleanCodeBlockContent(public_roblox_product.description), 1500)}`,
                            '\`\`\`',
                        ].join('\n'),
                        image: {
                            url: `https://inertia.lighting/assets/media/images/products/${public_roblox_product.code}.png`,
                        },
                    }),
                ],
            }).catch(console.warn);

            return; // complete async
        }

        await editEmbedWithNextProduct();

        const message_button_collector_filter = (button_interaction) => button_interaction.user.id === message.author.id;
        const message_button_collector = bot_message.createMessageComponentCollector({
            filter: message_button_collector_filter,
            time: 5 * 60_000, // 5 minutes
        });

        message_button_collector.on('collect', async (button_interaction) => {
            message_button_collector.resetTimer();

            switch (button_interaction.customId) {
                case 'previous': {
                    page_index = page_index < db_roblox_products.length - 1 ? page_index + 1 : 0;
                    break;
                }
                case 'next': {
                    page_index = page_index > 0 ? page_index - 1 : db_roblox_products.length - 1;
                    break;
                }
                case 'stop': {
                    message_button_collector.stop();
                    break;
                }
                default: {
                    break;
                }
            }

            await button_interaction.deferUpdate();

            if (message_button_collector.ended) return;

            await editEmbedWithNextProduct();
        });

        message_button_collector.on('end', async () => {
            await bot_message.delete().catch(console.warn);
        });
    },
};
