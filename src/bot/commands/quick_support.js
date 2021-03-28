const { Discord, client } = require('../discord_client.js');

module.exports = {
    name: 'quick_support',
    description: 'quick support help command',
    aliases: ['qs'],
    permission_level: 'staff',
    async execute(message, args) {
        const { command_prefix, command_name, command_args } = args;

        switch (command_args[0]?.toLowerCase()) {
            case 'studio_output':
                message.channel.send(new Discord.MessageEmbed({
                    author: {
                        iconURL: `${client.user.displayAvatarURL({ dynamic: true })}`,
                        name: 'Inertia Lighting | Blacklisted User Document',
                    },
                    title: 'Roblox Studio Output Help',
                    color: 0x60A0FF,
                    description: 'To open the output window in Roblox Studio, click on the View tab and then click on Ouput.',
                })).catch(console.warn);
                break;
            case 'roblox_output':
                message.channel.send(new Discord.MessageEmbed({
                    author: {
                        iconURL: `${client.user.displayAvatarURL({ dynamic: true })}`,
                        name: 'Inertia Lighting | Blacklisted User Document',
                    },
                    title: 'Roblox Developer Console Help',
                    color: 0x60A0FF,
                    description: 'To open the Developer Console (Output) in Roblox, press F9 or type /console in the Chat.',
                })).catch(console.warn);
                break;
            case 'templates':
                message.channel.send(new Discord.MessageEmbed({
                    author: {
                        iconURL: `${client.user.displayAvatarURL({ dynamic: true })}`,
                        name: 'Inertia Lighting | Blacklisted User Document',
                    },
                    title: 'Products is not liscensed to game owner. (Templates)',
                    color: 0x60A0FF,
                    description: 'To fix this issue, make sure your game is published, then restart the studio session you are currently in.',
                })).catch(console.warn);
                break;
            default:
                message.reply(new Discord.MessageEmbed({
                    color: 0x60A0FF,
                    author: {
                        iconURL: `${client.user.displayAvatarURL({ dynamic: true })}`,
                        name: 'Inertia Lighting | Quick Support System',
                    },
                    description: [
                        'Please use one of the following sub-commands:',
                        '\`\`\`',
                        ...[
                            'studio_output',
                            'roblox_output>',
                            'templates',
                        ].map(sub_command => `${command_prefix}${command_name} ${sub_command}`),
                        '\`\`\`',
                    ].join('\n'),
                })).catch(console.warn);
                break;
        }
    }
}