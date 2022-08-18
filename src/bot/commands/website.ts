//------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
//------------------------------------------------------------//

//---------------------------------------------------------------------------------------------------------------//

import { Discord } from '../discord_client';

import { command_permission_levels } from '../common/bot';

import { CustomEmbed } from '../common/message';

//---------------------------------------------------------------------------------------------------------------//

export default {
    name: 'website',
    description: 'why does this even exist',
    aliases: ['website', 'site'],
    permission_level: command_permission_levels.PUBLIC,
    cooldown: 500,
    async execute(
        message: Discord.Message,
        args: {
            [key: string]: unknown;
        },
    ) {
        message.channel.send({
            embeds: [
                CustomEmbed.from({
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
