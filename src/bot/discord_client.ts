//------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
//------------------------------------------------------------//

//---------------------------------------------------------------------------------------------------------------//

import * as Discord from 'discord.js';

//---------------------------------------------------------------------------------------------------------------//

const client = new Discord.Client({
    allowedMentions: {
        parse: [
            'users',
            'roles',
        ],
        repliedUser: true,
    },
    intents: [
        Discord.GatewayIntentBits.Guilds,
        Discord.GatewayIntentBits.GuildMembers,
        Discord.GatewayIntentBits.GuildBans,
        Discord.GatewayIntentBits.GuildEmojisAndStickers,
        Discord.GatewayIntentBits.GuildIntegrations,
        Discord.GatewayIntentBits.GuildWebhooks,
        Discord.GatewayIntentBits.GuildInvites,
        Discord.GatewayIntentBits.GuildMessages,
        Discord.GatewayIntentBits.GuildMessageReactions,
        Discord.GatewayIntentBits.DirectMessages,
    ],
    partials: [
        Discord.Partials.Channel,
    ],
    presence: {
        status: 'online',
        activities: [
            {
                type: Discord.ActivityType.Listening,
                name: `${process.env.BOT_COMMAND_PREFIX}help`,
            },
        ],
    },
}) as Discord.Client & {
    $: {
        [key: string]: unknown;
    },
};

client.$ = {
    commands: new Discord.Collection(),
};

//---------------------------------------------------------------------------------------------------------------//

/* login the discord bot */
client.login(process.env.BOT_TOKEN);

//---------------------------------------------------------------------------------------------------------------//

export {
    Discord,
    client,
};
