//------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
//------------------------------------------------------------//

//---------------------------------------------------------------------------------------------------------------//

import { Discord } from '../discord_client';

import { command_permission_levels } from '../common/bot';

import { CustomEmbed } from '../common/message';

//---------------------------------------------------------------------------------------------------------------//

export default {
    name: 'support',
    description: 'redirect to support channel',
    aliases: ['support'],
    permission_level: command_permission_levels.PUBLIC,
    cooldown: 5_000,
    async execute(
        message: Discord.Message<true>,
        args: {
            [key: string]: unknown;
            command_args: string[];
        },
    ) {

        if (!message.member) return;

        message.channel.send({
            embeds: [
                CustomEmbed.from({
                    description: 'The support command no longer exist! Please look at <#814197612491833354> for more info!',
                }),
            ],
        }).catch(console.warn);
    },
};
