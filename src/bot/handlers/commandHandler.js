'use strict';

//---------------------------------------------------------------------------------------------------------------//

const { Discord, client } = require('../discord_client.js');

//---------------------------------------------------------------------------------------------------------------//

const command_prefix = process.env.BOT_COMMAND_PREFIX;

//---------------------------------------------------------------------------------------------------------------//

const command_cooldown_tracker = new Discord.Collection();

//---------------------------------------------------------------------------------------------------------------//

async function commandHandler(message) {
    const command_name = message.content.split(/\s+/g)[0].replace(command_prefix, '').toLowerCase();
    const command_args = message.content.split(/\s+/g).slice(1);

    /* find command by command_name */
    const command = client.$.commands.find(cmd => cmd.aliases?.includes(command_name));
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

    /* command validation */
    if (typeof command.name !== 'string') throw new TypeError(`\`command.name\` is not a string for command: ${command}`);
    if (typeof command.description !== 'string') throw new TypeError(`\`command.description\` is not a string for command: ${command}`);
    if (!Array.isArray(command.aliases)) throw new TypeError(`\`command.aliases\` is not an array for command: ${command}`);
    if (typeof command.permission_level !== 'string') throw new TypeError(`\`command.permission_level\` is not a string for command: ${command}`);

    /* command permissions */
    const user_command_access_levels = ['public']; // valid levels: [ 'public', 'staff', 'admin' ]
    const guild_staff_role_id = '789342326978772992';
    const bot_admin_ids = [
        '331938622733549590', // Drawn
        '159170842528448512', // Ross
        '163646957783482370', // MidSpike
        '196254672418373632', // Will
    ];
    if (message.member.roles.cache.has(guild_staff_role_id)) {
        user_command_access_levels.push('staff');
    }
    if (bot_admin_ids.includes(message.author.id)) {
        user_command_access_levels.push('admin');
    }
    if (!user_command_access_levels.includes(command.permission_level)) {
        message.channel.send(new Discord.MessageEmbed({
            color: 0xFF0000,
            author: {
                iconURL: `${client.user.displayAvatarURL({ dynamic: true })}`,
                name: `${client.user.username}`,
            },
            title: 'Command Access Level Error',
            description: 'You do not have the required permissions to use this command!',
        })).catch(console.warn);
        return;
    }

    /* command cooldown */
    const command_cooldown_in_ms = command.cooldown ?? 5_000;
    const last_command_epoch_for_user = command_cooldown_tracker.get(message.author.id)?.last_command_epoch ?? Date.now() - command_cooldown_in_ms;
    const current_command_epoch = Date.now();
    command_cooldown_tracker.set(message.author.id, { last_command_epoch: current_command_epoch });
    if (current_command_epoch - last_command_epoch_for_user < command_cooldown_in_ms) {
        message.reply('Stop spamming commands!').catch(console.warn);
        return;
    }

    /* command execution */
    try {
        await command.execute(message, {
            user_command_access_levels,
            command_prefix,
            command_name,
            command_args,
        });
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
        })).catch(console.warn);
    }
}

//---------------------------------------------------------------------------------------------------------------//

module.exports = {
    commandHandler,
};
