// ------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
// ------------------------------------------------------------//

import * as Discord from 'discord.js';

import { CustomInteraction, CustomInteractionAccessLevel, CustomInteractionRunContext } from '@/common/managers/custom_interactions_manager.js'
;
import { CustomEmbed } from '@/common/message.js'
;

// ------------------------------------------------------------//

export default new CustomInteraction({
    identifier: 'product_hub',
    type: Discord.InteractionType.ApplicationCommand,
    data: {
        type: Discord.ApplicationCommandType.ChatInput,
        description: 'Get a link to the Product Hub!',
        options: [],
    },
    metadata: {
        required_run_context: CustomInteractionRunContext.Guild,
        required_access_level: CustomInteractionAccessLevel.Public,
    },
    handler: async (discord_client, interaction) => {
        if (!interaction.isChatInputCommand()) return;
        if (!interaction.inCachedGuild()) return;
        if (!interaction.channel) return;

        await interaction.deferReply({ flags: ['Ephemeral'] });

        await interaction.editReply({
            embeds: [
                CustomEmbed.from({
                    description: 'Check out our Product Hub!',
                }),
            ],
            components: [
                {
                    type: Discord.ComponentType.ActionRow,
                    components: [
                        {
                            type: Discord.ComponentType.Button,
                            style: Discord.ButtonStyle.Link,
                            label: 'Product Hub',
                            url: 'https://hub.inertia.lighting/',
                        },
                    ],
                },
            ],
        }).catch(console.warn);
    },
});
