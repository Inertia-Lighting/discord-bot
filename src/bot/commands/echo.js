'use strict';

//---------------------------------------------------------------------------------------------------------------//

const { Discord, client } = require('../discord_client.js');

//---------------------------------------------------------------------------------------------------------------//

module.exports = {
    name: 'echo',
    description: 'sends message',
    ownerOnly: true,
    aliases: ['echo'],
    async execute(message, args) {
        message.delete();
        message.channel.send(`${args.join(' ')}`).catch(console.warn);
    },
};
