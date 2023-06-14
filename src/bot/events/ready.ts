//------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
//------------------------------------------------------------//

// import { DbProductData } from '@root/types';

// import axios from 'axios';

import moment from 'moment-timezone';

import * as Discord from 'discord.js';

import { Timer } from '../../utilities';

// import { go_mongo_db } from '../../mongo/mongo';

import { client } from '../discord_client';

import { CustomInteractionsManager } from '../common/managers/custom_interactions_manager';

import { illegalNicknameHandler } from '../handlers/illegal_nickname_handler';

//------------------------------------------------------------//

const bot_guild_id = `${process.env.BOT_GUILD_ID ?? ''}`;
if (bot_guild_id.length < 1) throw new Error('environment variable: BOT_GUILD_ID; was not properly set or is empty');

//------------------------------------------------------------//

// async function setProductPricesInDB() {
//     /* fetch all products from the database */
//     const db_roblox_products = await go_mongo_db.find(process.env.MONGO_DATABASE_NAME as string, process.env.MONGO_PRODUCTS_COLLECTION_NAME as string, {}) as unknown as DbProductData[];

//     /* fetch the product prices from roblox and apply it to the database */
//     for (const db_roblox_product of db_roblox_products) {
//         let product_price_in_robux;
//         try {
//             const response = await axios({
//                 method: 'get',
//                 url: `https://api.roblox.com/marketplace/productDetails?productId=${encodeURIComponent(db_roblox_product.roblox_product_id)}`,
//                 headers: {
//                     'Content-Type': 'application/json',
//                 },
//                 validateStatus: (status) => status === 200,
//             });

//             product_price_in_robux = response?.data?.PriceInRobux ?? null;

//             if (!product_price_in_robux) throw new Error('Failed to fetch product price from Roblox!');
//         } catch {
//             console.warn(`Unable to fetch price for product: ${db_roblox_product.code}; skipping product!`);
//             continue; // skip this product since the price cannot be fetched
//         }

//         const parsed_product_price_in_robux = Number.parseInt(product_price_in_robux, 10); // Robux can only be an integer

//         if (Number.isNaN(parsed_product_price_in_robux)) {
//             console.warn(`Unable to parse price for product: ${db_roblox_product.code}; skipping product!`);
//             continue; // skip this product since the price cannot be parsed
//         }

//         await go_mongo_db.update(process.env.MONGO_DATABASE_NAME as string, process.env.MONGO_PRODUCTS_COLLECTION_NAME as string, {
//             roblox_product_id: db_roblox_product.roblox_product_id,
//         }, {
//             $set: {
//                 'price_in_robux': parsed_product_price_in_robux,
//             },
//         });

//         await Timer(250); // prevent api abuse
//     }
// }

async function updateBotNickname() {
    const bot_guild = await client.guilds.fetch(bot_guild_id);

    const bot_member = await bot_guild.members.fetchMe();
    bot_member.setNickname(`/ | ${client.user!.username}`, 'fixing my nickname').catch(console.trace);
}

async function removeIllegalNicknames() {
    const bot_guild = await client.guilds.fetch(bot_guild_id);

    const bot_guild_members = await bot_guild.members.fetch();

    for (const bot_guild_member of bot_guild_members.values()) {
        illegalNicknameHandler(bot_guild_member);
        await Timer(10_000); // prevent api abuse
    }
}

//------------------------------------------------------------//

export default {
    name: Discord.Events.ClientReady,
    async handler() {
        const ready_timestamp = `${moment()}`;
        console.log('----------------------------------------------------------------------------------------------------------------');
        console.log(`Discord Bot Logged in as @${client.user!.username} on ${ready_timestamp}`);
        console.log('----------------------------------------------------------------------------------------------------------------');

        /* register interactions to CustomInteractionsManager */
        CustomInteractionsManager.registerClientInteractions();

        /* register interactions to discord */
        setTimeout(() => CustomInteractionsManager.syncInteractionsToDiscord(client), 1 * 30_000);

        /* set the product prices in the database after 1 minute */
        // setTimeout(() => setProductPricesInDB(), 1 * 60_000);

        /* update the bot nickname after 10 minutes */
        setTimeout(() => updateBotNickname(), 10 * 60_000);

        /* remove illegal nicknames after 30 minutes */
        setTimeout(() => removeIllegalNicknames(), 30 * 60_000);
    },
};
