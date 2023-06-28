//------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
//------------------------------------------------------------//

import * as Discord from 'discord.js';

import { CustomInteraction, CustomInteractionAccessLevel, CustomInteractionRunContext } from '@root/common/managers/custom_interactions_manager';

import { support_categories } from '@root/common/handlers';

//------------------------------------------------------------//

export default new CustomInteraction({
    identifier: 'open_support_ticket_button',
    type: Discord.InteractionType.MessageComponent,
    data: undefined,
    metadata: {
        required_run_context: CustomInteractionRunContext.Guild,
        required_access_level: CustomInteractionAccessLevel.Public,
    },
    handler: async (discord_client, interaction) => {
        if (!interaction.isButton()) return;
        if (!interaction.inCachedGuild()) return;
        if (!interaction.channel) return;

        /* send the support category selection menu */
        await interaction.reply({
            ephemeral: true,
            content: 'Please select a support category!',
            components: [
                {
                    type: Discord.ComponentType.ActionRow,
                    components: [
                        {
                            type: Discord.ComponentType.StringSelect,
                            custom_id: 'support_category_selection_menu',
                            placeholder: 'Select a support category...',
                            options: support_categories.map((support_category) => ({
                                value: support_category.id,
                                label: support_category.name,
                                description: support_category.description,
                            })),
                            min_values: 1,
                            max_values: 1,
                        },
                    ],
                },
            ],
        });
    },
});
