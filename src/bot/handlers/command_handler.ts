//------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
//------------------------------------------------------------//

//---------------------------------------------------------------------------------------------------------------//

import { Discord, client } from '../discord_client';

import { command_permission_levels, getUserPermissionLevel, user_is_not_allowed_access_to_command_message_options } from '../common/bot';

import { CustomEmbed } from '../common/message';

//---------------------------------------------------------------------------------------------------------------//

/**
 * This is defined in-place as a temporary definition to make typescript happy.
 */
type PseudoCommand = {
    name: string;
    description: string;
    usage?: string;
    aliases: string[];
    permission_level: number;
    cooldown?: number;
    execute: (message: Discord.Message, options: { [key: string]: unknown }) => Promise<void>;
};

//---------------------------------------------------------------------------------------------------------------//

const command_prefix = process.env.BOT_COMMAND_PREFIX as string;

//---------------------------------------------------------------------------------------------------------------//

const command_cooldown_tracker = new Discord.Collection<string, { last_command_epoch: number }>();

//---------------------------------------------------------------------------------------------------------------//

async function commandHandler(message: Discord.Message) {
    if (!message.member) return;
    if (message.author.system) return;
    if (message.author.bot) return;
    if (message.content.length === 0) return;

    const command_name = message.content.split(/\s+/g)[0].replace(command_prefix, '').toLowerCase();
    const command_args = message.content.split(/\s+/g).slice(1);

    if (command_name.length === 0) return; // don't continue if the only thing sent was the command prefix

    /* find the command */
    const command = (client.$.commands as Discord.Collection<string, PseudoCommand>).find(cmd => cmd.aliases?.includes(command_name));
    if (!command) {
        await message.reply({
            embeds: [
                CustomEmbed.from({
                    color: CustomEmbed.colors.RED,
                    description: 'That command does not exist!',
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
    const user_permission_level = getUserPermissionLevel(message.member);

    /* command permission checking */
    const user_has_access_to_command = user_permission_level >= command.permission_level;
    if (!user_has_access_to_command) {
        await message.channel.send(user_is_not_allowed_access_to_command_message_options).catch(console.warn);

        return;
    }

    /* command cooldown */
    const command_cooldown_in_ms = command.cooldown ?? 1_500;
    const last_command_epoch_for_user = command_cooldown_tracker.get(message.author.id)?.last_command_epoch ?? Date.now() - command_cooldown_in_ms;
    const current_command_epoch = Date.now();
    command_cooldown_tracker.set(message.author.id, { last_command_epoch: current_command_epoch });
    const user_triggered_command_cooldown = current_command_epoch - last_command_epoch_for_user < command_cooldown_in_ms;
    const user_is_a_staff_member = user_permission_level >= command_permission_levels.STAFF;
    if (user_triggered_command_cooldown && !user_is_a_staff_member) {
        await message.reply({
            embeds: [
                CustomEmbed.from({
                    color: CustomEmbed.colors.YELLOW,
                    author: {
                        icon_url: `${client.user!.displayAvatarURL({ forceStatic: false })}`,
                        name: `${client.user!.username} | Command Cooldown System`,
                    },
                    description: `\`${command_name}\` is on a cooldown of  \`${command_cooldown_in_ms / 1000}s\`!`,
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
                CustomEmbed.from({
                    color: 0xFF0000,
                    author: {
                        icon_url: `${client.user!.displayAvatarURL({ forceStatic: false })}`,
                        name: `${client.user!.username}`,
                    },
                    title: 'Command Error',
                    description: `It looks like I ran into an error with the \`${command_name}\` command!`,
                }),
            ],
        }).catch(console.warn);
    }
}

//---------------------------------------------------------------------------------------------------------------//

export {
    commandHandler,
};
