/* Copyright © Inertia Lighting | All Rights Reserved */

//---------------------------------------------------------------------------------------------------------------//

'use strict';

//---------------------------------------------------------------------------------------------------------------//

const { string_ellipses, Timer } = require('../../utilities.js');

const { go_mongo_db } = require('../../mongo/mongo.js');

const { Discord, client } = require('../discord_client.js');

const { command_permission_levels } = require('../common/bot.js');

//---------------------------------------------------------------------------------------------------------------//

/**
 * Purges all reactions created users on a specified message
 * @param {Discord.Message} message
 * @returns {Promise<void>}
 */
 async function purgeUserReactionsFromMessage(message) {
    if (!(message instanceof Discord.Message)) throw new TypeError('\`message\` must be a Discord.Message');
    if (!(message?.guild instanceof Discord.Guild)) throw new TypeError('\`message.guild\` must be a Discord.Guild');

    if (!message.guild.me.permissions.has(Discord.Permissions.FLAGS.MANAGE_MESSAGES)) return;

    for (const message_reaction of message.reactions.cache.values()) {
        const reaction_users = message_reaction.users.cache.filter(user => !user.bot && !user.system); // don't interact with bots / system

        for (const reaction_user of reaction_users.values()) {
            message_reaction.users.remove(reaction_user);
            if (reaction_users.size > 0) await Timer(250); // prevent api abuse
        }
    }

    return; // complete async
}

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

        /* fetch all products from the database */
        const db_roblox_products = await go_mongo_db.find(process.env.MONGO_DATABASE_NAME, process.env.MONGO_PRODUCTS_COLLECTION_NAME, {});

        /* filter out non-public products */
        const public_roblox_products = db_roblox_products.filter(product => product.public);

        /* send a carousel containing 1 product per page */
        let page_index = 0;

        async function editEmbedWithNextProductChunk() {
            const public_roblox_product = public_roblox_products[page_index];

            await bot_message.edit({
                embeds: [
                    new Discord.MessageEmbed({
                        color: 0x60A0FF,
                        author: {
                            iconURL: `${client.user.displayAvatarURL({ dynamic: true })}`,
                            name: 'Inertia Lighting | Products',
                        },
                        description: [
                            `**Product Name** ${public_roblox_product.name}`,
                            `**Price** ${public_roblox_product.price_in_robux} <:robux:759699085439139871>`,
                            `**PayPal Price** $${Number.parseFloat(public_roblox_product.price_in_usd).toFixed(2)} USD`,
                            `\nA brief overview of ${public_roblox_product.name}. \n\`\`\`${string_ellipses(public_roblox_product.description, 1000)}\`\`\``,
                        ].join('\n'),
                        image: `https://inertia.lighting/assets/media/images/products/${public_roblox_product.code}.png`,
                    }),
                ],
            }).catch(console.warn);

            return; // complete async
        }

        await editEmbedWithNextProductChunk();
        await bot_message.react('⬅️');
        await bot_message.react('➡️');
        await bot_message.react('⏹️');

        const message_reaction_filter = (collected_reaction, user) => user.id === message.author.id;
        const message_reaction_collector = bot_message.createReactionCollector({
            filter: message_reaction_filter,
            time: 5 * 60_000, // 5 minutes
        });

        message_reaction_collector.on('collect', async (collected_reaction) => {
            message_reaction_collector.resetTimer();

            switch (collected_reaction.emoji.name) {
                case '⬅️': {
                    page_index = page_index < public_roblox_products.length ? page_index + 1 : 0;
                    break;
                }
                case '➡️': {
                    page_index = page_index > 0 ? page_index - 1 : public_roblox_products.length - 1;
                    break;
                }
                case '⏹️': {
                    message_reaction_collector.stop();
                    break;
                }
                default: {
                    break;
                }
            }

            if (message_reaction_collector.ended) return;

            await editEmbedWithNextProductChunk();
            await Timer(250);
            await purgeUserReactionsFromMessage(bot_message);
        });

        message_reaction_collector.on('end', async () => {
            await bot_message.delete();
        });
    },
};
