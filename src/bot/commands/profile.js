/* Copyright © Inertia Lighting | All Rights Reserved */

//---------------------------------------------------------------------------------------------------------------//

'use strict';

//---------------------------------------------------------------------------------------------------------------//

const axios = require('axios');

const { go_mongo_db } = require('../../mongo/mongo.js');

const { Discord, client } = require('../discord_client.js');

const { command_permission_levels } = require('../common/bot.js');

//---------------------------------------------------------------------------------------------------------------//

module.exports = {
    name: 'profile',
    description: 'displays a user\'s profile',
    aliases: ['profile'],
    permission_level: command_permission_levels.PUBLIC,
    cooldown: 5_000,
    async execute(message, args) {
        const { command_prefix, command_name, command_args } = args;

        const member_lookup_query = message.mentions.members.first()?.id ?? command_args[0];

        /** @type {Discord.GuildMember?} */
        const member = await message.guild.members.fetch(member_lookup_query);
        if (!member) {
            await message.channel.send({
                embeds: [
                    new Discord.MessageEmbed({
                        color: 0xFFFF00,
                        author: {
                            iconURL: `${client.user.displayAvatarURL({ dynamic: true })}`,
                            name: 'Inertia Lighting | User Profiles',
                        },
                        title: 'Missing Command Arguments',
                        description: [
                            'Please provide a valid @user mention to view their profile!',
                            '',
                            'Example:',
                            `> ${command_prefix}${command_name} <@!163646957783482370>`,
                        ].join('\n'),
                    }),
                ],
            }).catch(console.warn);
        }

        /* fetch the user document */
        const [ db_user_data ] = await go_mongo_db.find(process.env.MONGO_DATABASE_NAME, process.env.MONGO_USERS_COLLECTION_NAME, {
            'identity.discord_user_id': member.id,
        }, {
            projection: {
                '_id': false,
            },
        });

        if (!db_user_data) {
            message.reply({
                embeds: [
                    new Discord.MessageEmbed({
                        color: 0xFFFF00,
                        author: {
                            iconURL: `${client.user.displayAvatarURL({ dynamic: true })}`,
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

        await message.channel.send({
            embeds: [
                new Discord.MessageEmbed({
                    color: 0x60A0FF,
                    author: {
                        iconURL: `${client.user.displayAvatarURL({ dynamic: true })}`,
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
