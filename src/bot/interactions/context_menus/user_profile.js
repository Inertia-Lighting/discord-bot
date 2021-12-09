/* Copyright © Inertia Lighting | All Rights Reserved */

//---------------------------------------------------------------------------------------------------------------//

'use strict';

//---------------------------------------------------------------------------------------------------------------//

const axios = require('axios');
const Discord = require('discord.js');

//---------------------------------------------------------------------------------------------------------------//

const { go_mongo_db } = require('../../../mongo/mongo.js');

//---------------------------------------------------------------------------------------------------------------//

module.exports = {
    identifier: 'User Profile',
    /** @param {Discord.ContextMenuInteraction} interaction */
    async execute(interaction) {
        if (!interaction.inCachedGuild()) return;

        await interaction.deferReply({ ephemeral: true });

        const user = interaction.options.resolved.users.first();

        /* fetch the user document */
        const [ db_user_data ] = await go_mongo_db.find(process.env.MONGO_DATABASE_NAME, process.env.MONGO_USERS_COLLECTION_NAME, {
            'identity.discord_user_id': user.id,
        }, {
            projection: {
                '_id': false,
            },
        });

        if (!db_user_data) {
            interaction.editReply({
                embeds: [
                    new Discord.MessageEmbed({
                        color: 0xFFFF00,
                        author: {
                            iconURL: `${interaction.client.user.displayAvatarURL({ dynamic: true })}`,
                            name: 'Inertia Lighting | User Profiles',
                        },
                        title: 'Unknown User',
                        description: [
                            'That user doesn\'t exist in our database!',
                        ].join('\n'),
                    }),
                ],
            }).catch(console.warn);
            return;
        }

        const db_roblox_products = await go_mongo_db.find(process.env.MONGO_DATABASE_NAME, process.env.MONGO_PRODUCTS_COLLECTION_NAME, {});

        const user_product_codes = Object.entries(db_user_data.products).filter(entry => entry[1]).map(entry => entry[0]);
        const user_products = db_roblox_products.filter(product => user_product_codes.includes(product.code));

        const { data: roblox_user } = await axios.get(`https://users.roblox.com/v1/users/${encodeURIComponent(db_user_data.identity.roblox_user_id)}`);

        await interaction.editReply({
            embeds: [
                new Discord.MessageEmbed({
                    color: 0x60A0FF,
                    author: {
                        iconURL: `${interaction.client.user.displayAvatarURL({ dynamic: true })}`,
                        name: 'Inertia Lighting | User Profiles',
                    },
                    fields: [
                        {
                            name: 'Discord',
                            value: `<@${db_user_data.identity.discord_user_id}>`,
                        }, {
                            name: 'Roblox',
                            value: `[@${roblox_user.name}](https://roblox.com/users/${roblox_user.id}/profile) (${roblox_user.displayName})`,
                        }, {
                            name: 'Products',
                            value: `${user_products.length === 0 ? 'n/a' : user_products.map(product => `- ${product.name}`).join('\n')}`,
                        },
                    ],
                }),
            ],
        }).catch(console.warn);
    },
};
