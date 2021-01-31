'use strict';

//---------------------------------------------------------------------------------------------------------------//

const { Discord, client } = require('../discord_client.js');

//---------------------------------------------------------------------------------------------------------------//

module.exports = {
    name: 'echo',
    description: 'echo\'s a message',
    aliases: ['echo'],
    permission_level: 'admin',
    async execute(message, args) {
        message.delete();
        message.channel.send(`${args.join(' ')}`).catch(console.warn);
    },
};
