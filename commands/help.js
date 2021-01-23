'use strict';

module.exports = {
    name: 'help',
    description: 'Shows a list of commands for you to use.',
    usage: 'help',
    execute(message, args, client, Discord, prefix) {
        if (args[0]) {
            /* display help for a specified command */
            const specified_command_name = args[0].toLowerCase();
            const specified_command = client.$.commands.get(specified_command_name) ?? client.$.commands.find(c => c.aliases?.includes(specified_command_name));
            if (specified_command) {
                message.channel.send(new Discord.MessageEmbed({
                    color: 0x43DE6C,
                    author: {
                        name: `${message.author.tag}`,
                        icon_url: message.author.displayAvatarURL()
                    },
                    description: [
                        `**Name:** ${specified_command.name}`,
                        `**Aliases:** ${specified_command.aliases?.join(', ') ?? 'n/a'}`,
                        `**Description:** ${specified_command.description ?? 'n/a'}`,
                        `**Usage:** ${specified_command.usage ? `\`${prefix}${specified_command.name} ${specified_command.usage}\`` : 'n/a'}`
                    ].join('\n'),
                }));
            } else {
                message.reply(`That's not a valid command!`);
            }
        } else {
            /* display all commands */
            const all_commands_with_prefix = client.$.commands.map(command => `${prefix}${command.name}`);
            message.channel.send(new Discord.MessageEmbed({
                color: 0x43de6c,
                author: {
                    name: `${message.author.tag}`,
                    icon_url: message.author.displayAvatarURL()
                },
                title: 'Here\'s a list of all my commands!',
                description: [
                    `You can send \`${prefix}help [command name]\` to get info on a specific command!`,
                    `\`\`\`${all_commands_with_prefix.join('\n')}\`\`\``,
                ].join('\n'),
            }));
        }
    },
}
