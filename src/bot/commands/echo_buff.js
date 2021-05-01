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
        const say_channel = client.channels.resolve(message.mentions.channels.first());
        say_channel.send(`${args.slice(1).join(" ")}`);
    },
};
