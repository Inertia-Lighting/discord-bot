/* Copyright © Inertia Lighting | All Rights Reserved */

//---------------------------------------------------------------------------------------------------------------//

'use strict';

//---------------------------------------------------------------------------------------------------------------//

const { client } = require('../discord_client.js');

//---------------------------------------------------------------------------------------------------------------//

module.exports = {
    name: 'reload',
    description: 'reloads commands',
    usage: 'command_name',
    aliases: ['reload'],
    permission_level: 'admin',
    async execute(message, args) {
        const { command_args } = args;

        if (command_args.length === 0) {
            message.channel.send({
                content: `You didn't pass any command to reload, ${message.author}!`,
            });
            return;
        }

        const specified_command_name = command_args[0].toLowerCase();
        const command = client.$.commands.find(cmd => cmd.aliases.includes(specified_command_name));

        if (!command) {
            message.channel.send({
                content: `There is no command with name or alias \`${specified_command_name}\`, ${message.author}!`,
            });
            return;
        }

        delete require.cache[require.resolve(`./${command.name}.js`)];

        try {
            const new_command = require(`./${command.name}.js`);
            client.$.commands.set(new_command.name, new_command);
            message.channel.send({
                content: `Command \`${new_command.name}\` was reloaded!`,
            });
        } catch (error) {
            console.error(error);
            message.channel.send({
                content: `There was an error while reloading command \`${command.name}\`:\n\`\`\`${error.message}\`\`\``,
            });
        }
    },
};
