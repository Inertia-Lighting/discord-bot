/* Copyright © Inertia Lighting | All Rights Reserved */

//---------------------------------------------------------------------------------------------------------------//

'use strict';

//---------------------------------------------------------------------------------------------------------------//

const { Discord, client } = require('../discord_client.js');

const { command_permission_levels } = require('../common/bot.js');

//---------------------------------------------------------------------------------------------------------------//

const command_prefix = process.env.BOT_COMMAND_PREFIX;

const guild_staff_role_id = process.env.BOT_STAFF_ROLE_ID;
const guild_moderator_role_id = process.env.BOT_MODERATOR_ROLE_ID;
const guild_admin_role_id = process.env.BOT_ADMIN_ROLE_ID;
const guild_team_leaders_role_id = process.env.BOT_TEAM_LEADERS_ROLE_ID;
const guild_board_of_directors_role_id = process.env.BOT_BOARD_OF_DIRECTORS_ROLE_ID;
const guild_founders_role_id = process.env.BOT_FOUNDERS_ROLE_ID;

//---------------------------------------------------------------------------------------------------------------//

const command_cooldown_tracker = new Discord.Collection();

//---------------------------------------------------------------------------------------------------------------//

async function commandHandler(message) {
    const command_name = message.content.split(/\s+/g)[0].replace(command_prefix, '').toLowerCase();
    const command_args = message.content.split(/\s+/g).slice(1);

    if (command_name.length === 0) return; // don't continue if the only thing sent was the command prefix

    /* find the command */
    const command = client.$.commands.find(cmd => cmd.aliases?.includes(command_name));
    if (!command) {
        await message.reply({
            embeds: [
                new Discord.MessageEmbed({
                    color: 0xFF0000,
                    author: {
                        iconURL: `${client.user.displayAvatarURL({ dynamic: true })}`,
                        name: `${client.user.username}`,
                    },
                    title: 'Unknown Command Error',
                    description: 'That is not a known command!',
                }),
            ],
        });
        return;
    }

    /* command validation */
    if (typeof command.name !== 'string') throw new TypeError(`\`command.name\` is not a string for command: ${command}`);
    if (typeof command.description !== 'string') throw new TypeError(`\`command.description\` is not a string for command: ${command}`);
    if (!Array.isArray(command.aliases)) throw new TypeError(`\`command.aliases\` is not an array for command: ${command}`);
    if (typeof command.permission_level !== 'number') throw new TypeError(`\`command.permission_level\` is not a number for command: ${command}`);

    /* command permission preparation */
    let user_permission_level = command_permission_levels.PUBLIC;

    if (message.member.roles.cache.has(guild_staff_role_id)) {
        user_permission_level = command_permission_levels.STAFF;
    }
    if (message.member.roles.cache.has(guild_moderator_role_id)) {
        user_permission_level = command_permission_levels.MODERATORS;
    }
    if (message.member.roles.cache.has(guild_admin_role_id)) {
        user_permission_level = command_permission_levels.ADMINS;
    }
    if (message.member.roles.cache.has(guild_team_leaders_role_id)) {
        user_permission_level = command_permission_levels.TEAM_LEADERS;
    }
    if (message.member.roles.cache.has(guild_board_of_directors_role_id)) {
        user_permission_level = command_permission_levels.BOARD_OF_DIRECTORS;
    }
    if (message.member.roles.cache.has(guild_founders_role_id)) {
        user_permission_level = command_permission_levels.FOUNDERS;
    }

    /* command permission checking */
    if (user_permission_level < command.permission_level) {
        await message.channel.send({
            embeds: [
                new Discord.MessageEmbed({
                    color: 0xFF0000,
                    author: {
                        iconURL: `${client.user.displayAvatarURL({ dynamic: true })}`,
                        name: `${client.user.username} | Command Access System`,
                    },
                    description: 'You\'re lacking permissions required to use this command!',
                }),
            ],
        }).catch(console.warn);

        return;
    }

    /* command cooldown */
    const command_cooldown_in_ms = command.cooldown ?? 5_000;
    const last_command_epoch_for_user = command_cooldown_tracker.get(message.author.id)?.last_command_epoch ?? Date.now() - command_cooldown_in_ms;
    const current_command_epoch = Date.now();
    command_cooldown_tracker.set(message.author.id, { last_command_epoch: current_command_epoch });

    const user_triggered_command_cooldown = current_command_epoch - last_command_epoch_for_user < command_cooldown_in_ms;
    const user_is_not_a_staff_member = user_permission_level < command_permission_levels.STAFF;
    if (user_triggered_command_cooldown && user_is_not_a_staff_member) {
        await message.reply({
            embeds: [
                new Discord.MessageEmbed({
                    color: 0xFF0000,
                    author: {
                        iconURL: `${client.user.displayAvatarURL({ dynamic: true })}`,
                        name: `${client.user.username}`,
                    },
                    title: 'Command Cooldown',
                    description: `\`${command_name}\` is on a cooldown of  \`${command_cooldown_for_user_in_seconds / 1000}s\`!`,
                }),
            ],
        }).catch(console.warn);
        return;
    }

    /* command logging */
    console.info({
        discord_user_id: message.author.id,
        command_name: command_name,
        command_args: command_args,
    });

    /* command execution */
    try {
        await command.execute(message, {
            user_permission_level,
            command_prefix,
            command_name,
            command_args,
        });
    } catch (error) {
        console.trace({
            command_name: command_name,
            command_args: command_args,
            error_message: error,
        });

        await message.reply({
            embeds: [
                new Discord.MessageEmbed({
                    color: 0xFF0000,
                    author: {
                        iconURL: `${client.user.displayAvatarURL({ dynamic: true })}`,
                        name: `${client.user.username}`,
                    },
                    title: 'Command Error',
                    description: `It looks like I ran into an error with the \`${command_name}\` command!`,
                }),
            ],
        }).catch(console.warn);
    }
}

//---------------------------------------------------------------------------------------------------------------//

module.exports = {
    commandHandler,
};
