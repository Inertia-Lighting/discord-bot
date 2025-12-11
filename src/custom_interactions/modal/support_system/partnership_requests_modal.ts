// ------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
// ------------------------------------------------------------//

import * as Discord from 'discord.js';

import { CustomInteraction, CustomInteractionAccessLevel, CustomInteractionRunContext } from '@/common/managers/custom_interactions_manager.js'
;
import { supportSystemManager } from '@/support_system/index.js'
;
import { SupportCategoryId } from '@/support_system/types/index.js'
;

// ------------------------------------------------------------//

export default new CustomInteraction({
    identifier: 'support_system_partnership_request_modal',
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
            flags: ['Ephemeral'],
            fetchReply: true,
        });

        try {
            await supportSystemManager.handleModalSubmission(interaction, SupportCategoryId.PartnershipRequests);

            const modalReplyMessage = await interaction.editReply({
                content: [
                    'You selected Partnership Requests.',
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
