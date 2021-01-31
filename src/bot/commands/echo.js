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
        const { command_args } = args;

        message.delete({ timeout: 500 }).catch(console.warn);
        message.channel.send(`${command_args.join(' ')}`).catch(console.warn);
    },
};
