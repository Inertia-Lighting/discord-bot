//------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
//------------------------------------------------------------//

//---------------------------------------------------------------------------------------------------------------//

import { Discord } from '../discord_client';

import { command_permission_levels } from '../common/bot';

import { CustomEmbed } from '../common/message';

//---------------------------------------------------------------------------------------------------------------//

export default {
    name: 'demo',
    description: 'why does this even exist',
    aliases: ['demo', 'test', 'testing'],
    permission_level: command_permission_levels.PUBLIC,
    cooldown: 500,
    async execute(
        message: Discord.Message<true>,
        args: {
            [key: string]: unknown;
        },
    ) {
        message.channel.send({
            embeds: [
                CustomEmbed.from({
                    description: 'You can try out our products from the testing game!',
                }),
            ],
            components: [
                {
                    type: 1,
                    components: [
                        {
                            type: 2,
                            style: 5,
                            label: 'Testing Game',
                            url: 'https://demo.inertia.lighting/',
                        },
                    ],
                },
            ],
        }).catch(console.warn);
    },
};
