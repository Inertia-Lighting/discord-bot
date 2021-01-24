'use strict';

//---------------------------------------------------------------------------------------------------------------//

module.exports = {
    name: 'reload',
    description: 'shows bot ping',
    ownerOnly: true,
    aliases: ['reload', 'r'],
    usage: 'command_name',
    execute(message, args, client, Discord) {
        if (!args.lenght) {
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
