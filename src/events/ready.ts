// ------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
// ------------------------------------------------------------//

import * as Discord from 'discord.js';
import moment from 'moment-timezone';

import { illegalNicknameHandler } from '@/common/handlers/index.js'
import { CustomInteractionsManager } from '@/common/managers/custom_interactions_manager.js'
import prisma from '@/lib/prisma_client.js'
import { delay } from '@/utilities/index.js'

// ------------------------------------------------------------//

const bot_guild_id = `${process.env.BOT_GUILD_ID ?? ''}`;
if (bot_guild_id.length < 1) throw new Error('environment variable: BOT_GUILD_ID; was not properly set or is empty');

// ------------------------------------------------------------//


async function updateBotNickname(
    client: Discord.Client<true>,
) {
    const bot_guild = await client.guilds.fetch(bot_guild_id);

    const bot_member = await bot_guild.members.fetchMe();
    bot_member.setNickname(`/ | ${client.user!.username}`, 'fixing my nickname').catch(console.trace);
}

async function removeIllegalNicknames(
    client: Discord.Client<true>,
) {
    const bot_guild = await client.guilds.fetch(bot_guild_id);

    const bot_guild_members = await bot_guild.members.fetch();

    for (const bot_guild_member of bot_guild_members.values()) {
        illegalNicknameHandler(client, bot_guild_member);
        await delay(10_000); // prevent api abuse
    }
}

// ------------------------------------------------------------//

export default {
    name: Discord.Events.ClientReady,
    async handler(
        client: Discord.Client<true>,
    ) {
        if (!client.isReady()) {
            throw new Error('This shouldn\'t happen, but if it does, the client was not ready in the ready event!');
        }
        prisma.$connect()
        const ready_timestamp = `${moment()}`;
        console.log('----------------------------------------------------------------------------------------------------------------');
        console.log(`Discord Bot Logged in as @${client.user!.username} on ${ready_timestamp}`);
        console.log('----------------------------------------------------------------------------------------------------------------');
        /* register interactions to CustomInteractionsManager */
        console.info('Registering interactions')
        CustomInteractionsManager.registerClientInteractions();

        /* register interactions to discord */
        setTimeout(() => CustomInteractionsManager.syncInteractionsToDiscord(client), 1 * 30_000);

        /* set the product prices in the database after 1 minute */
        // setTimeout(() => setProductPricesInDB(client), 1 * 60_000);

        /* update the bot nickname after 10 minutes */
        setTimeout(() => updateBotNickname(client), 10 * 60_000);

        // const guild = await client.guilds.fetch(bot_guild_id)
        // const cheese_role = await guild.roles.fetch('1346309480706478090')
        // cheese_role?.setIcon('1370431726685388840')

        /* remove illegal nicknames after 30 minutes */
        setTimeout(() => removeIllegalNicknames(client), 30 * 60_000);
    },
};
