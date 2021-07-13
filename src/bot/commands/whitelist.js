/* Copyright © Inertia Lighting | All Rights Reserved */

//---------------------------------------------------------------------------------------------------------------//

'use strict';

//---------------------------------------------------------------------------------------------------------------//

const { command_permission_levels } = require('../common/bot.js');

const Discord = require('discord.js');

const { go_mongo_db } = require('../../mongo/mongo.js');

const { Timer } = require('../../utilities.js');

//---------------------------------------------------------------------------------------------------------------//

const new_customer_role_ids = process.env.BOT_NEW_CUSTOMER_AUTO_ROLE_IDS.split(',');

const user_purchases_logging_channel_id = process.env.BOT_LOGGING_PURCHASES_CHANNEL_ID;

//---------------------------------------------------------------------------------------------------------------//

module.exports = {
    name: 'whitelist',
    description: 'whitelists a user to a specific product',
    usage: '@mention product_ID/Product_Name',
    aliases: ['give'],
    permission_level: command_permission_levels.BOARD_OF_DIRECTORS,
    cooldown: 2_000,
    async execute(message, args, client) {
        const { command_args } = args;

        const member_lookup_query = message.mentions.members.first()?.id ?? command_args[0];
        const member = message.guild.members.resolve(member_lookup_query);
        const Product_ID = command_args[1];

        /* handle when a member is not specified */
        if (!member) {
            await message.reply('You need to specify a user when using this command!').catch(console.warn);
            return;
        }

        /* handle when a product is not specified */
        if (!Product_ID) {
            await message.reply('You need to specify a product when using this command!').catch(console.warn);
            return;
        }
        /* fetch the user info from the database */
        const [ db_user_data ] = await go_mongo_db.find(process.env.MONGO_DATABASE_NAME, process.env.MONGO_USERS_COLLECTION_NAME, {
            'identity.discord_user_id': member.id
        });
        if (!db_user_data) {
            await message.reply('That user does not exist in the database!').catch(console.warn);
            return;
        }
        /* fetch the product from the database */
        let [ db_roblox_product_data ] = await go_mongo_db.find(process.env.MONGO_DATABASE_NAME, process.env.MONGO_PRODUCTS_COLLECTION_NAME, {
            'roblox_product_id': Product_ID,
        });

        if (!db_roblox_product_data) {
             db_roblox_product_data = await go_mongo_db.find(process.env.MONGO_DATABASE_NAME, process.env.MONGO_PRODUCTS_COLLECTION_NAME, {
                'name': Product_ID,
            });
            if (!db_roblox_product_data) {
                await message.reply('You need to specify a valid product when using this command!').catch(console.warn);
                return;
            }
        }

        /*update the user in the database */
        try {
            await go_mongo_db.update(process.env.MONGO_DATABASE_NAME, process.env.MONGO_USERS_COLLECTION_NAME, {
                'identity.discord_user_id': member.id
            }, {
                $set: {
                    [`products.${db_roblox_product_data.code}`]: true,
                },
            });
        } catch (error) {
            message.reply(`An error occured! I was unable to update the user in the database because of the Error: ${error}`);
            console.log(error);
        }

        try {
            /* fetch the guild */
            const guild = await client.guilds.fetch(message.guild.id);

            /* fetch the guild member */
            const guild_member = await guild.members.fetch(db_user_data.identity.discord_user_id);

            /* try to add the product role to the guild member */
            await guild_member.roles.add(db_roblox_product_data.discord_role_id);

            /* try to add the customer roles to the guild member */
            for (const customer_role_id of new_customer_role_ids) {
                await guild_member.roles.add(customer_role_id);
                await Timer(250); // prevent api abuse
            }

            /* dm the user a confirmation of their purchase */
            const user_dm_channel = await guild_member.user.createDM();
            await user_dm_channel.send(new Discord.MessageEmbed({
                color: 0x00FF00,
                author: {
                    iconURL: `${client.user.displayAvatarURL({ dynamic: true })}`,
                    name: 'Inertia Lighting | Confirmed Whitelist',
                },
                title: `You have been whitelisted for, ${db_roblox_product_data.name}!`,
                description: [
                    `You obtained the ${db_roblox_product_data.name} role in the Inertia Lighting discord.`,
                    `Go to our [product downloads](https://inertia.lighting/products) to download the ${db_roblox_product_data.name}.`,
                ].join('\n'),
                fields: [
                    {
                        name: `${db_roblox_product_data.name}`,
                        value: `${db_roblox_product_data.description}`,
                    },
                ],
            }));
        } catch (error) {
            console.log('Failed to either give product roles in the discord or dm the guild member!', error);
        }

        /* log to the purchases logging channel */
        try {
            const user_purchases_logging_channel = client.channels.resolve(user_purchases_logging_channel_id);
            await user_purchases_logging_channel.send(new Discord.MessageEmbed({
                color: 0x00FF00,
                author: {
                    iconURL: `${client.user.displayAvatarURL({ dynamic: true })}`,
                    name: 'Inertia Lighting | Confirmed Whitelist',
                },
                description: [
                    `**Discord Mention:** <@${db_user_data.identity.discord_user_id}>`,
                    `**Roblox User Id:** \`${db_user_data.identity.roblox_user_id}\``,
                    `**Product Code:** \`${db_roblox_product_data.code}\``
                ].join('\n'),
            }));
        } catch (error) {
            console.trace('Failed to log the purchase to the purchases logging channel!', error);
        }


         /* log to the console */
         console.log([
            '----------------------------------------------------------------------------------------------------------------',
            `roblox_user_id: ${db_user_data.identity.roblox_user_id}; discord_user_id: ${db_user_data.identity.discord_user_id};`,
            `whitelisted product: ${db_roblox_product_data.code}; successfully!`,
            '----------------------------------------------------------------------------------------------------------------',
        ].join('\n'));

    },
 };
