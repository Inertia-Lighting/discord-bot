//------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
//------------------------------------------------------------//

import * as Discord from 'discord.js';

import { CustomInteraction, CustomInteractionAccessLevel, CustomInteractionRunContext } from '@root/bot/common/managers/custom_interactions_manager';

//------------------------------------------------------------//

export default new CustomInteraction({
    identifier: 'purge',
    type: Discord.InteractionType.ApplicationCommand,
    data: {
        type: Discord.ApplicationCommandType.ChatInput,
        description: 'Purges a specified amount of messages from the channel.',
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

        await interaction.deferReply({ ephemeral: false });

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

        let purged_messages;
        try {
            purged_messages = await interaction.channel.bulkDelete(amount_to_purge);
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
