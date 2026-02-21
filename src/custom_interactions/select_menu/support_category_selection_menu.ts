// ------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
// ------------------------------------------------------------//

import * as Discord from 'discord.js';

import { CustomInteraction, CustomInteractionAccessLevel, CustomInteractionRunContext } from '@/common/managers/custom_interactions_manager.js'
import { supportSystemManager } from '@/support_system/index.js'
import { SupportCategoryId } from '@/support_system/types/index.js'

// ------------------------------------------------------------//

export default new CustomInteraction({
    identifier: 'support_category_selection_menu',
    type: Discord.InteractionType.MessageComponent,
    data: undefined,
    metadata: {
        required_run_context: CustomInteractionRunContext.Guild,
        required_access_level: CustomInteractionAccessLevel.Public,
    },
    handler: async (discord_client, interaction) => {
        if (!interaction.isStringSelectMenu()) return;
        if (!interaction.inCachedGuild()) return;
        if (!interaction.channel) return;

        /**
         * Do not call `interaction.deferReply()` here,
         * as it will cause the modal to not show.
         */

        const support_category_id = interaction.values.at(0) as SupportCategoryId;
        if (!support_category_id) {
            console.trace('Missing support category id from support category selection menu!');

            await interaction.reply({
                content: 'An error occurred while processing your request!',
            });

            return;
        }

        const modalConfig = supportSystemManager.getModalConfig(support_category_id);
        if (!modalConfig) {
            console.trace(`Invalid support category id from support category selection menu: ${support_category_id}`);

            await interaction.reply({
                content: 'An error occurred while processing your request!',
            });

            return;
        }

        /* send the support category's modal */
        await interaction.showModal(modalConfig);

        /* delete the support category selection menu */
        try {
            await interaction.deleteReply();
            await interaction.message?.delete();
        } catch {
            // ignore any errors
        }
    },
});
