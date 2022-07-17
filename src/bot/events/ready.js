/* Copyright © Inertia Lighting | All Rights Reserved */

//---------------------------------------------------------------------------------------------------------------//

'use strict';

//---------------------------------------------------------------------------------------------------------------//

const fs = require('node:fs');
const path = require('node:path');
const axios = require('axios');
const moment = require('moment-timezone');
const recursiveReadDirectory = require('recursive-read-directory');

//---------------------------------------------------------------------------------------------------------------//

const { Timer } = require('../../utilities.js');

const { go_mongo_db } = require('../../mongo/mongo.js');

const { client } = require('../discord_client.js');

const { interactions } = require('../common/interaction.js');

const { illegalNicknameHandler } = require('../handlers/illegal_nickname_handler.js');

//---------------------------------------------------------------------------------------------------------------//

const bot_guild_id = process.env.BOT_GUILD_ID;

//---------------------------------------------------------------------------------------------------------------//

const setProductPricesInDB = async () => {
    /* fetch all products from the database */
    const db_roblox_products = await go_mongo_db.find(process.env.MONGO_DATABASE_NAME, process.env.MONGO_PRODUCTS_COLLECTION_NAME, {});

    /* fetch the product prices from roblox and apply it to the database */
    for (const db_roblox_product of db_roblox_products) {
        let product_price_in_robux;
        try {
            const response = await axios({
                method: 'get',
                url: `https://api.roblox.com/marketplace/productDetails?productId=${encodeURIComponent(db_roblox_product.roblox_product_id)}`,
                headers: {
                    'Content-Type': 'application/json',
                },
                validateStatus: (status) => status === 200,
            });

            product_price_in_robux = response?.data?.PriceInRobux ?? null;

            if (!product_price_in_robux) throw new Error('Failed to fetch product price from Roblox!');
        } catch {
            console.warn(`Unable to fetch price for product: ${db_roblox_product.code}; skipping product!`);
            continue; // skip this product since the price cannot be fetched
        }

        const parsed_product_price_in_robux = Number.parseInt(product_price_in_robux); // Robux can only be an integer

        if (Number.isNaN(parsed_product_price_in_robux)) {
            console.warn(`Unable to parse price for product: ${db_roblox_product.code}; skipping product!`);
            continue; // skip this product since the price cannot be parsed
        }

        await go_mongo_db.update(process.env.MONGO_DATABASE_NAME, process.env.MONGO_PRODUCTS_COLLECTION_NAME, {
            roblox_product_id: db_roblox_product.roblox_product_id,
        }, {
            $set: {
                'price_in_robux': parsed_product_price_in_robux,
            },
        });

        await Timer(250); // prevent api abuse
    }

    return; // complete async
};

const updateBotNickname = async () => {
    const bot_guild = client.guilds.resolve(bot_guild_id);

    await bot_guild.me.setNickname(`${process.env.BOT_COMMAND_PREFIX} | ${client.user.username}`, 'fixing my nickname').catch(console.trace);

    return; // complete async
};

const removeIllegalNicknames = async () => {
    const bot_guild = client.guilds.resolve(bot_guild_id);

    const bot_guild_members = await bot_guild.members.fetch();

    for (const bot_guild_member of bot_guild_members.values()) {
        illegalNicknameHandler(bot_guild_member);
        await Timer(10_000); // prevent api abuse
    }

    return; // complete async
};

//---------------------------------------------------------------------------------------------------------------//

module.exports = {
    name: 'ready',
    async handler() {
        const ready_timestamp = `${moment()}`;
        console.log('----------------------------------------------------------------------------------------------------------------');
        console.log(`Discord Bot Logged in as ${client.user.tag} on ${ready_timestamp}`);
        console.log('----------------------------------------------------------------------------------------------------------------');

        /* register commands */
        const command_files_path = path.join(process.cwd(), './src/bot/commands/');
        const command_files = fs.readdirSync(command_files_path).filter(file => file.endsWith('.js'));
        for (const command_file of command_files) {
            const bot_command = require(path.join(command_files_path, command_file));
            client.$.commands.set(bot_command.name, bot_command);
        }

        /* register interactions */
        const interaction_files_path = path.join(process.cwd(), './src/bot/interactions/');
        const interaction_file_names = recursiveReadDirectory(interaction_files_path);
        for (const interaction_file_name of interaction_file_names) {
            const interaction_file_path = path.join(interaction_files_path, interaction_file_name);
            const interaction = require(interaction_file_path);

            const interaction_exists = interactions.has(interaction.identifier);
            if (interaction_exists) {
                console.warn(`Interaction: ${interaction.name}; already exists; skipping \'${interaction_file_path}\'.`);
                continue;
            }

            interactions.set(interaction.identifier, interaction);
        }

        /* set the product prices in the database after 1 minute */
        setTimeout(() => setProductPricesInDB(), 1 * 60_000);

        /* update the bot nickname after 10 minutes */
        setTimeout(() => updateBotNickname(), 10 * 60_000);

        /* remove illegal nicknames after 30 minutes */
        setTimeout(() => removeIllegalNicknames(), 30 * 60_000);
    },
};
