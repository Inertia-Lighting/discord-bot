/* Copyright © Inertia Lighting | All Rights Reserved */

//---------------------------------------------------------------------------------------------------------------//

import { command_permission_levels } from '../common/bot.js';

import { Discord } from '../discord_client.js';

//---------------------------------------------------------------------------------------------------------------//

export default {
    name: 'purge',
    description: 'removes up to 100 messages sent within 2 weeks',
    usage: '<amount_of_messages>',
    aliases: ['purge', 'clear'],
    permission_level: command_permission_levels.ADMINS,
    cooldown: 5_000,
    async execute(
        message: Discord.Message<true>,
        args: {
            [key: string]: unknown;
            command_args: string[];
        },
    ) {
        const { command_args } = args;

        const amount_of_messages_to_remove = Number.parseInt(command_args[0], 10);

        /* validate the amount of messages to purge */
        if (Number.isNaN(amount_of_messages_to_remove) || amount_of_messages_to_remove < 1 || amount_of_messages_to_remove > 100) {
            await message.reply({
                content: `${message.author}, you need to specify a number within 1-100 next time.`,
            }).catch(console.warn);
            return;
        }

        /* remove the message sent by staff */
        await message.delete().catch(console.warn);

        /** @type {Number} */
        const number_of_messages_removed = await message.channel.bulkDelete(amount_of_messages_to_remove, true).then((removed_messages) => removed_messages.size).catch(() => 0);

        /* check if messages were removed */
        if (number_of_messages_removed === 0) {
            await message.reply({
                content: `${message.author}, I was unable to purge any messages.`,
            }).catch(console.warn);
            return;
        }

        await message.reply({
            content: `${message.author}, purged ${number_of_messages_removed} / ${amount_of_messages_to_remove} message(s) from the channel.`,
        }).catch(console.warn);
    },
};
