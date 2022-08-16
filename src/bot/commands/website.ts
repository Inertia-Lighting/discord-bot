/* Copyright © Inertia Lighting | All Rights Reserved */

//---------------------------------------------------------------------------------------------------------------//

import { Discord } from '../discord_client.js';

import { command_permission_levels } from '../common/bot.js';

//---------------------------------------------------------------------------------------------------------------//

export default {
    name: 'website',
    description: 'why does this even exist',
    aliases: ['website', 'site'],
    permission_level: command_permission_levels.PUBLIC,
    cooldown: 10_000,
    async execute(
        message: Discord.Message,
        args: {
            [key: string]: unknown;
        },
    ) {
        message.channel.send({
            embeds: [
                new Discord.MessageEmbed({
                    color: 0x60A0FF,
                    description: 'Check out our Website!',
                }),
            ],
            components: [
                {
                    type: 1,
                    components: [
                        {
                            type: 2,
                            style: 5,
                            label: 'Our Website',
                            url: 'https://inertia.lighting/',
                        },
                    ],
                },
            ],
        }).catch(console.warn);
    },
};
