// ------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
// ------------------------------------------------------------//

import * as Discord from 'discord.js';

import { CustomEmbed } from '@root/common/utilities/embed';

import { fetchPermissions, isDeveloper } from '@root/common/utilities/permissions';
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

        const highestPermission = fetchPermissions(interaction.member);
        const commands = InteractionsManager.cached_interactions.filter(
            (client_interaction) =>
                client_interaction.type === Discord.InteractionType.ApplicationCommand &&
                'type' in client_interaction.data &&
                client_interaction.data.type === Discord.ApplicationCommandType.ChatInput &&
                client_interaction.metadata.required_access_level <= highestPermission
        );
        const is_dev = isDeveloper(interaction.member);

        const filteredCommands = commands.filter(
            (client_interaction) =>
                (!client_interaction.metadata.dev_only || is_dev)
        );
        // const filteredCommands = commands.filter((client_interaction) => !client_interaction.metadata.dev_only)
        await interaction.editReply({
            embeds: [
                CustomEmbed.from({
                    title: 'Commands List',
                    description: [
                        '\`\`\`',
                        ...filteredCommands.map(
                            (client_interaction) => `/${client_interaction.data.name}`
                        ),
                        '\`\`\`',
                    ].join('\n'),
                }),
            ],
        });
    },
});