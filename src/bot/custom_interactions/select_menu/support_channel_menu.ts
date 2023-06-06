//------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
//------------------------------------------------------------//

import * as Discord from 'discord.js';

import { CustomInteraction, CustomInteractionAccessLevel, CustomInteractionRunContext } from '@root/bot/common/managers/custom_interactions_manager';

import { support_categories } from '@root/bot/handlers/support_system_handler';

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

        await interaction.deferReply({ ephemeral: true });

        /**
         * @todo Investigate why this is here, it shouldn't be necessary.
         */
        // await interaction.message.edit({
        //     components: [
        //         {
        //             type: Discord.ComponentType.ActionRow,
        //             components: [
        //                 {
        //                     type: Discord.ComponentType.StringSelect,
        //                     customId: 'support_category_selection_menu',
        //                     placeholder: 'Select a support category!',
        //                     minValues: 1,
        //                     maxValues: 1,
        //                     options: support_categories.map(({ id, name, description }) => ({
        //                         label: name,
        //                         description: description.slice(0, 100),
        //                         value: id,
        //                     })),
        //                 },
        //             ],
        //         },
        //     ],
        // });

        const support_category_id = interaction.values.at(0);

        const support_category = support_categories.find(({ id }) => id === support_category_id);
        if (!support_category) return;

        await interaction.showModal(support_category.modal);
    },
});
