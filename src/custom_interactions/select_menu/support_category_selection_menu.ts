//------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
//------------------------------------------------------------//

import * as Discord from 'discord.js';

import { CustomInteraction, CustomInteractionAccessLevel, CustomInteractionRunContext } from '@root/common/managers/custom_interactions_manager';

import { support_categories } from '@root/common/handlers';

//------------------------------------------------------------//

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

        const support_category_id = interaction.values.at(0);

        const support_category = support_categories.find(({ id }) => id === support_category_id);
        if (!support_category) {
            await interaction.reply({
                content: 'An error occurred while processing your request!',
            });

            return;
        }

        /* send the support category's modal */
        await interaction.showModal(support_category.modal);
    },
});
