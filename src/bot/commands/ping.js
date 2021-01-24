'use strict';

//---------------------------------------------------------------------------------------------------------------//

const { Discord, client } = require('../discord_client.js');

//---------------------------------------------------------------------------------------------------------------//

module.exports = {
    name: 'ping',
    description: 'shows bot ping',
    staffOnly: true,
    aliases: ['ping'],
    async execute(message, args) {
        message.channel.send(`Pong: ${client.ws.ping}ms`).catch(console.warn);
    },
};
