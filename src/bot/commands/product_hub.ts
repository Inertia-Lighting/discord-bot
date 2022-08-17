/* Copyright © Inertia Lighting | All Rights Reserved */

//---------------------------------------------------------------------------------------------------------------//

import { Discord } from '../discord_client';

import { command_permission_levels } from '../common/bot';

//---------------------------------------------------------------------------------------------------------------//

export default {
    name: 'product_hub',
    description: 'why does this even exist',
    aliases: ['product_hub', 'producthub', 'hub'],
    permission_level: command_permission_levels.PUBLIC,
    cooldown: 10_000,
    async execute(
        message: Discord.Message<true>,
        args: {
            [key: string]: unknown;
        },
    ) {
        message.channel.send({
            embeds: [
                new Discord.MessageEmbed({
                    color: 0x60A0FF,
                    description: 'Check out our Product Hub!',
                }),
            ],
            components: [
                {
                    type: 1,
                    components: [
                        {
                            type: 2,
                            style: 5,
                            label: 'Product Hub',
                            url: 'https://product-hub.inertia.lighting/',
                        },
                    ],
                },
            ],
        }).catch(console.warn);
    },
};
