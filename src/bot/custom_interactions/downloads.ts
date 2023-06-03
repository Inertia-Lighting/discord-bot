//------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
//------------------------------------------------------------//

import * as Discord from 'discord.js';

import { CustomEmbed } from '../common/message';

import { CustomInteraction, CustomInteractionAccessLevel } from '../common/managers/custom_interactions_manager';

//------------------------------------------------------------//

export default new CustomInteraction({
    identifier: 'download',
    type: Discord.InteractionType.ApplicationCommand,
    data: {
        type: Discord.ApplicationCommandType.ChatInput,
        description: 'why does this even exist',
        options: [],
    },
    metadata: {
        required_access_level: CustomInteractionAccessLevel.Public,
    },
    handler: async (discord_client, interaction) => {
        if (!interaction.isChatInputCommand()) return;
        if (!interaction.inCachedGuild()) return;
        if (!interaction.channel) return;

        await interaction.deferReply({ ephemeral: false });

        await interaction.editReply({
            embeds: [
                CustomEmbed.from({
                    description: 'You can download purchased products from our website!',
                }),
            ],
            components: [
                {
                    type: Discord.ComponentType.ActionRow,
                    components: [
                        {
                            type: Discord.ComponentType.Button,
                            style: Discord.ButtonStyle.Link,
                            label: 'Products & Downloads',
                            url: 'https://inertia.lighting/products',
                        },
                    ],
                },
            ],

        }).catch(console.warn);
    },
});
