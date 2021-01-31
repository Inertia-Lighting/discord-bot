'use strict';

//---------------------------------------------------------------------------------------------------------------//

const { Discord, client } = require('../discord_client.js');

//---------------------------------------------------------------------------------------------------------------//

const command_prefix = process.env.BOT_COMMAND_PREFIX;

//---------------------------------------------------------------------------------------------------------------//

async function commandHandler(message) {
    const command_name = message.content.split(/\s+/g)[0].toLowerCase();
    const command_args = message.content.split(/\s+/g).slice(1);

    /* find command by command_name */
    const command = client.$.commands.find(cmd => cmd.aliases?.includes(command_name.replace(command_prefix, '')));
    if (!command) {
        message.reply(new Discord.MessageEmbed({
            color: 0xFF0000,
            author: {
                iconURL: `${client.user.displayAvatarURL({ dynamic: true })}`,
                name: `${client.user.username}`,
            },
            title: 'Command Error',
            description: 'That is not a valid command!',
        }));
        return;
    }

    /* command permissions */
    if (command.staffOnly && !message.member.roles.cache.has('789342326978772992')) {
        sendCommandAccessLevelError(message);
        return;
    }
    if (command.ownerOnly && message.author.id !== `196254672418373632` && message.author.id !== '331938622733549590' && message.author.id !== '159170842528448512' && message.author.id !== '163646957783482370') {
        sendCommandAccessLevelError(message);
        return;
    }

    /* command permissions */
    let user_is_allowed_to_run_command;
    const guild_staff_role_id = '789342326978772992';
    const bot_admin_ids = [
        '331938622733549590', // Drawn
        '159170842528448512', // Ross
        '163646957783482370', // MidSpike
        '196254672418373632', // Will
    ];
    switch (command.permission_level) {
        case 'admin':
            if (bot_admin_ids.includes(message.author.id)) user_is_allowed_to_run_command = true;
            break;
        case 'staff':
            if (message.member.roles.cache.has(guild_staff_role_id)) user_is_allowed_to_run_command = true;
            break;
        case 'public':
            user_is_allowed_to_run_command = true;
            break;
        default:
            console.error(`command: ${command.name} is missing a valid \`command.permission_level\`!`);
            user_is_allowed_to_run_command = false;
            break;
    }

    /* command execution */
    if (user_is_allowed_to_run_command) {
        try {
            await command.execute(message, command_args);
        } catch (error) {
            console.trace(error);
            message.reply(new Discord.MessageEmbed({
                color: 0xFF0000,
                author: {
                    iconURL: `${client.user.displayAvatarURL({ dynamic: true })}`,
                    name: `${client.user.username}`,
                },
                title: 'Command Error',
                description: `It looks like I ran into an error while trying to run the command: \`\`${command_name}\`\`!`,
            }));
        }
    } else {
        message.channel.send(new Discord.MessageEmbed({
            color: 0xFF0000,
            author: {
                iconURL: `${client.user.displayAvatarURL({ dynamic: true })}`,
                name: `${client.user.username}`,
            },
            title: 'Command Access Level Error',
            description: 'You do not have the required permissions to use this command!',
        })).catch(console.warn);
    }
}

//---------------------------------------------------------------------------------------------------------------//

module.exports = {
    commandHandler,
};
