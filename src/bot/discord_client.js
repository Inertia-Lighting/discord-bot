/* Copyright © Inertia Lighting | All Rights Reserved */

//---------------------------------------------------------------------------------------------------------------//

'use strict';

//---------------------------------------------------------------------------------------------------------------//

const Discord = require('discord.js');

//---------------------------------------------------------------------------------------------------------------//

const client = new Discord.Client({
    disableMentions: 'everyone',
    presence: {
        status: 'online',
        type: 4,
        activity: {
            type: 'PLAYING',
            name: 'Just restarted!',
        },
    },
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
