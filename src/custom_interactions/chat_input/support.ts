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
    identifier: 'support',
    type: Discord.InteractionType.ApplicationCommand,
    data: {
        type: Discord.ApplicationCommandType.ChatInput,
        description: 'Get support for our products!',
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
                    description: 'Go to <#814197612491833354> to open a support ticket!',
                }),
            ],
        }).catch(console.warn);
    },
});
