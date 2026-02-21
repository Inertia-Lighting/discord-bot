// ------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
// ------------------------------------------------------------//

import * as Discord from 'discord.js';

import { CustomInteraction, CustomInteractionAccessLevel, CustomInteractionRunContext } from '@/common/managers/custom_interactions_manager.js'
import { supportSystemManager } from '@/support_system/index.js'

// ------------------------------------------------------------//

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

        const categories = supportSystemManager.getEnabledCategories();

        /* send the support category selection menu */
        await interaction.reply({
            flags: ['Ephemeral'],
            content: 'Please select a support category!',
            components: [
                {
                    type: Discord.ComponentType.ActionRow,
                    components: [
                        {
                            type: Discord.ComponentType.StringSelect,
                            custom_id: 'support_category_selection_menu',
                            placeholder: 'Select a support category...',
                            options: categories.map((category) => ({
                                value: category.id,
                                label: category.name,
                                description: category.description,
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
