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
    presence: {
        status: 'online',
        type: 4,
        activity: {
            type: 'PLAYING',
            name: 'Just restarted!',
        },
    },
    intens: [
        Discord.Intents.FLAGS.GUILDS,
        Discord.Intents.FLAGS.GUILD_MESSAGES,
    ],
});

client.$ = {
    commands: new Discord.Collection(),
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
