'use strict';

//---------------------------------------------------------------------------------------------------------------//

module.exports = {
    name: 'add',
    description: 'Adds a user to the database.',
    staffOnly: true,
    aliases: ['add'],
    uasage: 'roblox_id discord id',
    execute(message, args, client, Discord) {
        message.channel.send(`Pong: ${client.ws.ping}ms`).catch(console.warn);
    },
};
