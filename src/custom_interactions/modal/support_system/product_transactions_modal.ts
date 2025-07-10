// ------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
// ------------------------------------------------------------//

import { CustomInteraction, CustomInteractionAccessLevel, CustomInteractionRunContext } from '@root/common/managers/custom_interactions_manager';
import { supportSystemManager } from '@root/support_system';
import { SupportCategoryId } from '@root/support_system/types';
import * as Discord from 'discord.js';

// ------------------------------------------------------------//

export default new CustomInteraction({
    identifier: 'transaction_modal',
    type: Discord.InteractionType.ModalSubmit,
    data: undefined,
    metadata: {
        required_run_context: CustomInteractionRunContext.Guild,
        required_access_level: CustomInteractionAccessLevel.Public,
    },
    handler: async (discord_client, interaction) => {
        if (!interaction.inCachedGuild()) return;
        if (!interaction.isModalSubmit()) return;

        await interaction.deferReply({
            ephemeral: true,
            fetchReply: true,
        });

        try {
            await supportSystemManager.handleModalSubmission(interaction, SupportCategoryId.Transactions);

            const modalReplyMessage = await interaction.editReply({
                content: [
                    'You selected Transactions.',
                    'Go to your support ticket channel to continue.',
                ].join('\n'),
            });

            setTimeout(async () => {
                try {
                    await interaction.deleteReply(modalReplyMessage);
                } catch {
                    // ignore any errors
                }
            }, 30_000);
        } catch (error) {
            console.error('Error handling support modal submission:', error);
            await interaction.editReply({
                content: 'An error occurred while processing your support request. Please try again.',
            });
        }
    },
});
