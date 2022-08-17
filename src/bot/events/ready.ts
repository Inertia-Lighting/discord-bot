/* Copyright © Inertia Lighting | All Rights Reserved */

//---------------------------------------------------------------------------------------------------------------//

import { DbProductData } from '@root/types/types';

import path from 'node:path';

import axios from 'axios';

import moment from 'moment-timezone';

import { Timer } from '../../utilities';

import { go_mongo_db } from '../../mongo/mongo';

import { Discord, client } from '../discord_client';

import { interactions } from '../common/interaction';

import { illegalNicknameHandler } from '../handlers/illegal_nickname_handler';

const recursiveReadDirectory = require('recursive-read-directory');

//---------------------------------------------------------------------------------------------------------------//

const bot_guild_id = process.env.BOT_GUILD_ID as string;

//---------------------------------------------------------------------------------------------------------------//

const setProductPricesInDB = async () => {
    /* fetch all products from the database */
    const db_roblox_products = await go_mongo_db.find(process.env.MONGO_DATABASE_NAME as string, process.env.MONGO_PRODUCTS_COLLECTION_NAME as string, {}) as unknown as DbProductData[];

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

        const parsed_product_price_in_robux = Number.parseInt(product_price_in_robux, 10); // Robux can only be an integer

        if (Number.isNaN(parsed_product_price_in_robux)) {
            console.warn(`Unable to parse price for product: ${db_roblox_product.code}; skipping product!`);
            continue; // skip this product since the price cannot be parsed
        }

        await go_mongo_db.update(process.env.MONGO_DATABASE_NAME as string, process.env.MONGO_PRODUCTS_COLLECTION_NAME as string, {
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
    const bot_guild = await client.guilds.fetch(bot_guild_id);

    const bot_member = await bot_guild.members.fetchMe();
    bot_member.setNickname(`${process.env.BOT_COMMAND_PREFIX} | ${client.user!.username}`, 'fixing my nickname').catch(console.trace);

    return; // complete async
};

const removeIllegalNicknames = async () => {
    const bot_guild = await client.guilds.fetch(bot_guild_id);

    const bot_guild_members = await bot_guild.members.fetch();

    for (const bot_guild_member of bot_guild_members.values()) {
        illegalNicknameHandler(bot_guild_member);
        await Timer(10_000); // prevent api abuse
    }

    return; // complete async
};

//---------------------------------------------------------------------------------------------------------------//

export default {
    name: Discord.Events.ClientReady,
    async handler() {
        const ready_timestamp = `${moment()}`;
        console.log('----------------------------------------------------------------------------------------------------------------');
        console.log(`Discord Bot Logged in as ${client.user!.tag} on ${ready_timestamp}`);
        console.log('----------------------------------------------------------------------------------------------------------------');

        /* register commands */
        const command_files_path = path.join(process.cwd(), 'dist', 'bot', 'commands');
        const command_files = recursiveReadDirectory(command_files_path);
        for (const command_file of command_files) {
            if (!command_file.endsWith('.js')) continue;

            const command_file_path = path.join(command_files_path, command_file);

            const { default: bot_command } = await import(command_file_path);

            (client.$.commands as Discord.Collection<string, unknown>).set(bot_command.name, bot_command);
        }

        /* register interactions */
        const interaction_files_path = path.join(process.cwd(), 'dist', 'bot', 'interactions');
        const interaction_file_names = recursiveReadDirectory(interaction_files_path);
        for (const interaction_file_name of interaction_file_names) {
            if (!interaction_file_name.endsWith('.js')) continue;

            const interaction_file_path = path.join(interaction_files_path, interaction_file_name);

            const { default: interaction } = await import(interaction_file_path);

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
