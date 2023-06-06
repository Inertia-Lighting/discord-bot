//------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
//------------------------------------------------------------//

import * as Discord from 'discord.js';

import { CustomEmbed } from '@root/bot/common/message';

import { CustomInteraction, CustomInteractionAccessLevel, CustomInteractionRunContext, CustomInteractionsManager } from '@root/bot/common/managers/custom_interactions_manager';

//------------------------------------------------------------//

export default new CustomInteraction({
    identifier: 'help',
    type: Discord.InteractionType.ApplicationCommand,
    data: {
        type: Discord.ApplicationCommandType.ChatInput,
        description: 'Lists all available commands for you to use!',
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

        await interaction.deferReply({ ephemeral: false });

        const chat_input_custom_interactions = CustomInteractionsManager.interactions.filter(
            (custom_interaction) =>
                custom_interaction.type === Discord.InteractionType.ApplicationCommand &&
                'type' in custom_interaction.data &&
                custom_interaction.data.type === Discord.ApplicationCommandType.ChatInput
        );

        await interaction.editReply({
            embeds: [
                CustomEmbed.from({
                    title: 'Commands List',
                    description: [
                        '\`\`\`',
                        ...chat_input_custom_interactions.map(
                            (custom_interaction) => `/${custom_interaction.data.name}`
                        ),
                        '\`\`\`',
                    ].join('\n'),
                }),
            ],
        });
    },
});
