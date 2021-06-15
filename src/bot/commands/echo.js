/* Copyright © Inertia Lighting | All Rights Reserved */

//---------------------------------------------------------------------------------------------------------------//

'use strict';

//---------------------------------------------------------------------------------------------------------------//

const { Timer } = require('../../utilities.js');

//---------------------------------------------------------------------------------------------------------------//

module.exports = {
    name: 'echo',
    description: 'echoes what a user says into the same channel',
    aliases: ['echo'],
    permission_level: 'admin',
    async execute(message, args) {
        const { command_prefix, command_name, command_args } = args;

        const message_to_echo = command_args.join(' ').trim();

        if (message_to_echo.length === 0) {
            message.reply({
                content: [
                    'Please provide a message to echo!',
                    'Example:',
                    '\`\`\`',
                    `${command_prefix}${command_name} Hello world!`,
                    '\`\`\`',
                ].join('\n'),
            }).catch(console.warn);
            return;
        }

        message.channel.send({
            content: [
                `${message_to_echo}`,
            ],
        }).catch(console.warn);

        await Timer(500); // prevent api abuse
        message.delete().catch(console.warn);
    },
};
