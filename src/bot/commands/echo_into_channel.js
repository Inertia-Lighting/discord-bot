/* Copyright © Inertia Lighting | All Rights Reserved */

//---------------------------------------------------------------------------------------------------------------//

'use strict';

//---------------------------------------------------------------------------------------------------------------//

const { Timer } = require('../../utilities.js');

//---------------------------------------------------------------------------------------------------------------//

module.exports = {
    name: 'echo_into_channel',
    description: 'echoes what a user says into a specific channel',
    aliases: ['echo_into_channel'],
    permission_level: 'admin',
    async execute(message, args) {
        const { command_prefix, command_name, command_args } = args;

        const [ potential_channel_id='', ...command_args_to_echo ] = command_args;

        const parsed_potential_channel_id = potential_channel_id.replace(/[^0-9]/g, '');

        const channel = message.guild.channels.resolve(parsed_potential_channel_id);

        const message_to_echo = command_args_to_echo.join(' ').trim();

        if (!channel || message_to_echo.length === 0) {
            message.reply({
                content: [
                    'Please specify a valid channel and provide a message to echo!',
                    'Example:',
                    '\`\`\`',
                    `${command_prefix}${command_name} <#601972296185282571> Hello world!`,
                    '\`\`\`',
            ].join('\n').catch(console.warn),
        });
            return;
        }

        channel.send({
            content: [
                `${message_to_echo}`
            ]
        }).catch(console.warn);

        await Timer(500); // prevent api abuse
        message.delete().catch(console.warn);
    },
};
