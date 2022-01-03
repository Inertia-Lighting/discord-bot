/* Copyright © Inertia Lighting | All Rights Reserved */

//---------------------------------------------------------------------------------------------------------------//

'use strict';

//---------------------------------------------------------------------------------------------------------------//

const Discord = require('discord.js');

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
        Discord.Intents.FLAGS.GUILDS,
        Discord.Intents.FLAGS.GUILD_MEMBERS,
        Discord.Intents.FLAGS.GUILD_MESSAGES,
        Discord.Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
        Discord.Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS,
        Discord.Intents.FLAGS.GUILD_INTEGRATIONS,
        Discord.Intents.FLAGS.GUILD_WEBHOOKS,
        Discord.Intents.FLAGS.GUILD_INVITES,
        Discord.Intents.FLAGS.GUILD_BANS,
        Discord.Intents.FLAGS.DIRECT_MESSAGES,
    ],
    partials: [
        'CHANNEL',
    ],
    presence: {
        status: 'online',
        activities: [
            {
                type: 'LISTENING',
                name: `${process.env.BOT_COMMAND_PREFIX}help`,
            },
        ],
    },
});

client.$ = {
    commands: new Discord.Collection(),
    interactions: new Discord.Collection(),
    verification_contexts: new Discord.Collection(),
};

//---------------------------------------------------------------------------------------------------------------//

/* login the discord bot */
client.login(process.env.BOT_TOKEN);

//---------------------------------------------------------------------------------------------------------------//

module.exports = {
    Discord,
    client,
};
