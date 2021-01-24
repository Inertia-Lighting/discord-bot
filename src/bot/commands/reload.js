'use strict';

//---------------------------------------------------------------------------------------------------------------//

const { Discord, client } = require('../discord_client.js');

//---------------------------------------------------------------------------------------------------------------//

module.exports = {
    name: 'reload',
    description: 'reloads commands',
    ownerOnly: true,
    aliases: ['reload', 'r'],
    usage: 'command_name',
    async execute(message, args) {
        if (args.length === 0) {
            message.channel.send(`You didn't pass any command to reload, ${message.author}!`);
            return;
        }

        const commandName = args[0].toLowerCase();
        const command = client.$.commands.get(commandName) || client.$.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

        if (!command) {
            message.channel.send(`There is no command with name or alias \`${commandName}\`, ${message.author}!`);
            return;
        }

        delete require.cache[require.resolve(`./${command.name}.js`)];

        try {
            const newCommand = require(`./${command.name}.js`);
            client.$.commands.set(newCommand.name, newCommand);
            message.channel.send(`Command \`${command.name}\` was reloaded!`);
        } catch (error) {
            console.error(error);
            message.channel.send(`There was an error while reloading a command \`${command.name}\`:\n\`${error.message}\``);
        }

    },
};
