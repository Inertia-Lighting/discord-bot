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
    identifier: 'i_fd_up',
    type: Discord.InteractionType.ApplicationCommand,
    data: {
        type: Discord.ApplicationCommandType.ChatInput,
        description: 'You f\'d up and now you need to reset your V3 account',
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
            flags: 'IsComponentsV2',
            components: [{
                type: Discord.ComponentType.Container,
                accent_color: CustomEmbed.Color.Blue,
                components: [{
                    type: Discord.ComponentType.TextDisplay,
                    content: '# Account Reset'
                },
                {
                    type: Discord.ComponentType.TextDisplay,
                    content: 'Are you sure you want to do this? This will clear ALL V3 data?',
                },]
            },
            {
                type: Discord.ComponentType.ActionRow,
                components: [
                    {
                        type: Discord.ComponentType.Button,
                        style: Discord.ButtonStyle.Danger,
                        label: 'Yes, I\'m sure',
                        custom_id: 'i_fd_up_confirm'
                    },
                    {
                        type: Discord.ComponentType.Button,
                        style: Discord.ButtonStyle.Secondary,
                        label: 'No, I don\'t want to',
                        custom_id: 'i_fd_up_cancel'
                    }
                ]
            }]
        })
    },
});
