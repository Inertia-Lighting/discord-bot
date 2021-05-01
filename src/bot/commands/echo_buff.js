'use strict';

//---------------------------------------------------------------------------------------------------------------//

const { Discord, client } = require('../discord_client.js');

//---------------------------------------------------------------------------------------------------------------//

module.exports = {
    name: 'echo_buff',
    description: 'Buffed version of the previous command, echo.js. Contains a channel mention argument & content argument.',
    aliases: ['echobuff', 'eb'],
    permission_level: 'admin',
    async execute(message, args) {
        const { command_args } = args;
        console.log(args)
        message.delete({ timeout: 500 }).catch(console.warn);
        message.channel.send(`${command_args.join(' ')}`).catch(console.warn);
    },
};
