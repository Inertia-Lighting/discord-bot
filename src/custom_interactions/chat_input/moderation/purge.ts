// ------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
// ------------------------------------------------------------//

import * as Discord from 'discord.js';

import { CustomInteraction, CustomInteractionAccessLevel, CustomInteractionRunContext } from '@/common/managers/custom_interactions_manager.js'

// ------------------------------------------------------------//

export default new CustomInteraction({
    identifier: 'purge',
    type: Discord.InteractionType.ApplicationCommand,
    data: {
        type: Discord.ApplicationCommandType.ChatInput,
        description: 'Used by staff to purge messages from a channel.',
        options: [
            {
                name: 'amount',
                type: Discord.ApplicationCommandOptionType.Integer,
                description: 'The amount of messages to purge.',
                minValue: 1,
                maxValue: 100,
                required: true,
            },
        ],
    },
    metadata: {
        required_run_context: CustomInteractionRunContext.Guild,
        required_access_level: CustomInteractionAccessLevel.Admins,
    },
    handler: async (discord_client, interaction) => {
        if (!interaction.isChatInputCommand()) return;
        if (!interaction.inCachedGuild()) return;
        if (!interaction.channel) return;

        const bot_msg = await interaction.reply({
            flags: [],
            content: 'Purging messages...',
        });

        const amount_to_purge = interaction.options.getInteger('amount', true);

        if (
            amount_to_purge < 1 ||
            amount_to_purge > 100
        ) {
            await interaction.editReply({
                content: 'You must specify an amount between 1 and 100.',
            });

            return;
        }

        const messages_to_purge = await interaction.channel.messages.fetch({
            limit: amount_to_purge,
            before: bot_msg.id,
        });

        let purged_messages;
        try {
            purged_messages = await interaction.channel.bulkDelete(messages_to_purge);
        } catch (error) {
            console.trace(error);

            await interaction.editReply({
                content: 'An error occurred while trying to purge messages.',
            });

            return;
        }

        await interaction.editReply({
            content: `${interaction.user} purged ${purged_messages.size} messages from this channel.`,
        });
    },
});
