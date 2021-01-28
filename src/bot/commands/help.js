'use strict';

//---------------------------------------------------------------------------------------------------------------//

const { Discord, client } = require('../discord_client.js');

//---------------------------------------------------------------------------------------------------------------//

const command_prefix = process.env.BOT_COMMAND_PREFIX;

//---------------------------------------------------------------------------------------------------------------//

module.exports = {
    name: 'help',
    description: 'Shows a list of commands for you to use.',
    usage: 'help',
    async execute(message, args) {
        if (args[0]) {
            /* display help for a specified command */
            const specified_command_name = args[0].toLowerCase();
            const specified_command = client.$.commands.get(specified_command_name) ?? client.$.commands.find(c => c.aliases?.includes(specified_command_name));
            if (specified_command) {
                message.channel.send(new Discord.MessageEmbed({
                    color: 0x43DE6C,
                    author: {
                        iconURL: `${message.author.displayAvatarURL({ dynamic: true })}`,
                        name: `${message.author.tag}`,
                    },
                    description: [
                        `**Name:** ${specified_command.name}`,
                        `**Aliases:** ${specified_command.aliases?.join(', ') ?? 'n/a'}`,
                        `**Description:** ${specified_command.description ?? 'n/a'}`,
                        `**Usage:** ${specified_command.usage ? `\`${command_prefix}${specified_command.name} ${specified_command.usage}\`` : 'n/a'}`,
                        `**Public:** ${!(specified_command.staffOnly || specified_command.ownerOnly)}`,
                    ].join('\n'),
                })).catch(console.warn);
            } else {
                message.reply(`That's not a valid command!`).catch(console.warn);
            }
        } else {
            /* display all commands */
            const all_commands_with_prefix = client.$.commands.map(command => `${command_prefix}${command.name}`);
            message.channel.send(new Discord.MessageEmbed({
                color: 0x43de6c,
                author: {
                    iconURL: `${message.author.displayAvatarURL({ dynamic: true })}`,
                    name: `${message.author.tag}`,
                },
                title: 'Here\'s a list of all my commands!',
                description: [
                    `You can send \`${command_prefix}help [command name]\` to get info on a specific command!`,
                    `\`\`\`${all_commands_with_prefix.join('\n')}\`\`\``,
                ].join('\n'),
            })).catch(console.warn);
        }
    },
};
