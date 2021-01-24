'use strict';

//---------------------------------------------------------------------------------------------------------------//

const { Discord, client } = require('../discord_client.js');

//---------------------------------------------------------------------------------------------------------------//

const command_prefix = process.env.COMMAND_PREFIX;

//---------------------------------------------------------------------------------------------------------------//

async function commandHandler(message) {
    function errorEmbed(message) {
        message.channel.send(new Discord.MessageEmbed({
            color: 0xeb8d1a,
            author: {
                iconURL: `${client.user.displayAvatarURL({ dynamic: true })}`,
                name: `${client.user.username}`,
                url: 'https://inertia-lighting.xyz',
            },
            title: 'Command Error',
            description: 'You do not have access to use this command!'
        })).catch(console.warn);
    }

    /* find command by command_name */
    const args = message.content.slice(command_prefix.length).trim().split(/\s+/g);
    const command_name = args.shift().toLowerCase();
    const command = client.$.commands.get(command_name) ?? client.$.commands.find(cmd => cmd.aliases?.includes(command_name));
    if (!command) {
        message.reply(new Discord.MessageEmbed({
            color: 0xFF0000,
            author: {
                iconURL: `${client.user.displayAvatarURL({ dynamic: true })}`,
                name: `${client.user.username}`,
                url: 'https://inertia-lighting.xyz',
            },
            title: 'Command Error',
            description: 'That is not a valid command!',
        }));
        return;
    }

    /* command permissions */
    if (command.staffOnly && !message.member.roles.cache.has('789342326978772992')) {
        errorEmbed(message);
        return;
    }
    if (command.ownerOnly && message.author.id !== `196254672418373632` && message.author.id !== '331938622733549590' && message.author.id !== '159170842528448512' && message.author.id !== '163646957783482370') {
        errorEmbed(message);
        return;
    }

    /* command execution */
    try {
        await command.execute(message, args);
    } catch (error) {
        console.trace(error);

        message.reply(new Discord.MessageEmbed({
            color: 0xFF0000,
            author: {
                iconURL: `${client.user.displayAvatarURL({ dynamic: true })}`,
                name: `${client.user.username}`,
                url: 'https://inertia-lighting.xyz',
            },
            title: 'Command Error',
            description: `Looks like I ran into an error while trying to run ${command_name}`,
        }));
    }
}

//---------------------------------------------------------------------------------------------------------------//

module.exports = {
    commandHandler,
};
