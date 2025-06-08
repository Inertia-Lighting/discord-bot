// ------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
// ------------------------------------------------------------//

import { CustomInteraction, CustomInteractionAccessLevel, CustomInteractionRunContext, CustomInteractionsManager } from '@root/common/managers/custom_interactions_manager';
import { CustomEmbed } from '@root/common/message';
import { fetchHighestAccessLevelForUser } from '@root/common/permissions';
import * as Discord from 'discord.js';

// ------------------------------------------------------------//

export default new CustomInteraction({
    identifier: 'help',
    type: Discord.InteractionType.ApplicationCommand,
    data: {
        type: Discord.ApplicationCommandType.ChatInput,
        description: 'Shows a list of available commands.',
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

        const highest_access_level_for_user = await fetchHighestAccessLevelForUser(discord_client, interaction.user);
        const chat_input_custom_interactions = CustomInteractionsManager.interactions.filter(
            (custom_interaction) =>
                custom_interaction.type === Discord.InteractionType.ApplicationCommand &&
                'type' in custom_interaction.data &&
                custom_interaction.data.type === Discord.ApplicationCommandType.ChatInput &&
                custom_interaction.metadata.required_access_level <= highest_access_level_for_user
        );

        await interaction.editReply({
            embeds: [
                CustomEmbed.from({
                    title: 'Commands List',
                    description: [
                        '```',
                        ...chat_input_custom_interactions.map(
                            (custom_interaction) => `/${custom_interaction.data.name}`
                        ),
                        '```',
                    ].join('\n'),
                }),
            ],
        });
    },
});
