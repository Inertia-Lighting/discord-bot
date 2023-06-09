//------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
//------------------------------------------------------------//

//------------------------------------------------------------//

import * as Discord from 'discord.js';

//------------------------------------------------------------//

const bot_token = `${process.env.BOT_TOKEN ?? ''}`;
if (bot_token.length < 1) throw new Error('Environment variable: BOT_TOKEN; is not set correctly.');

//------------------------------------------------------------//

const client = new Discord.Client({
    allowedMentions: {
        parse: [
            Discord.AllowedMentionsTypes.User,
            Discord.AllowedMentionsTypes.Role,
        ],
        repliedUser: true,
    },
    intents: [
        Discord.GatewayIntentBits.MessageContent,
        Discord.GatewayIntentBits.Guilds,
        Discord.GatewayIntentBits.GuildMembers,
        Discord.GatewayIntentBits.GuildModeration,
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
                name: '/help',
            },
        ],
    },
});

//------------------------------------------------------------//

/* login the discord bot */
client.login(bot_token);

//------------------------------------------------------------//

export {
    Discord,
    client,
};
