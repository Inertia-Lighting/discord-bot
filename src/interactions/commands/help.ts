// ------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
// ------------------------------------------------------------//

import * as Discord from 'discord.js';

import { CustomEmbed } from '@root/common/utilities/embed';

import { fetchPermissions } from '@root/common/utilities/permissions';
import { Interaction, InteractionsManager } from '@root/common/interactions/handler';

// ------------------------------------------------------------//

export default new Interaction({
    identifier: 'help',
    type: Discord.InteractionType.ApplicationCommand,
    data: {
        type: Discord.ApplicationCommandType.ChatInput,
        description: 'Shows a list of available commands.',
        options: [],
    },
    metadata: {
        required_run_context: InteractionRunContext.Guild,
        required_access_level: PermissionLevel.Public,
    },
    handler: async (client, interaction) => {
        if (!interaction.isChatInputCommand()) return;
        if (!interaction.inCachedGuild()) return;
        if (!interaction.channel) return;

        await interaction.deferReply({ ephemeral: false });

        const highest_access_level_for_user = fetchPermissions(interaction.member);
        const chat_input_custom_interactions = InteractionsManager.cached_interactions.filter(
            (client_itneraction) =>
                client_itneraction.type === Discord.InteractionType.ApplicationCommand &&
                'type' in client_itneraction.data &&
                client_itneraction.data.type === Discord.ApplicationCommandType.ChatInput &&
                client_itneraction.metadata.required_access_level <= highest_access_level_for_user
        );

        await interaction.editReply({
            embeds: [
                CustomEmbed.from({
                    title: 'Commands List',
                    description: [
                        '\`\`\`',
                        ...chat_input_custom_interactions.map(
                            (client_itneraction) => `/${client_itneraction.data.name}`
                        ),
                        '\`\`\`',
                    ].join('\n'),
                }),
            ],
        });
    },
});