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
        if (!support_category_id) {
            console.trace('Missing support category id from support category selection menu!');

            await interaction.reply({
                content: 'An error occurred while processing your request!',
            });

            return;
        }

        const support_category = support_categories.find(({ id }) => id === support_category_id);
        if (!support_category) {
            console.trace(`Invalid support category id from support category selection menu: ${support_category_id}`);

            await interaction.reply({
                content: 'An error occurred while processing your request!',
            });

            return;
        }

        /* send the support category's modal */
        await interaction.showModal(support_category.modal_data);

        /* wait for the modal to be submitted */
        await interaction.awaitModalSubmit({
            time: 15 * 60_000, // give up after this amount of time
        });

        /* delete the support category selection menu */
        try {
            await interaction.deleteReply();
            await interaction.message?.delete();
        } catch {
            // ignore any errors
        }
    },
});
