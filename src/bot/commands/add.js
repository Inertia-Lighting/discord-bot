'use strict';

//---------------------------------------------------------------------------------------------------------------//

const { Discord, client } = require('../discord_client.js');

//---------------------------------------------------------------------------------------------------------------//

module.exports = {
    name: 'add',
    description: 'Adds a user to the database.',
    staffOnly: true,
    aliases: ['add'],
    usage: 'roblox_id discord id',
    async execute(message, args) {
        message.channel.send(`Pong: ${client.ws.ping}ms`).catch(console.warn);
    },
};
