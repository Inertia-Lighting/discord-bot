// ------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
// ------------------------------------------------------------//

import { userProfileHandler } from '@root/common/handlers';
import { CustomInteraction, CustomInteractionAccessLevel, CustomInteractionRunContext } from '@root/common/managers/custom_interactions_manager';
import * as Discord from 'discord.js';

// ------------------------------------------------------------//

export default new CustomInteraction({
    identifier: 'verify_command_user_profile_button',
    type: Discord.InteractionType.MessageComponent,
    data: undefined,
    metadata: {
        required_run_context: CustomInteractionRunContext.Guild,
        required_access_level: CustomInteractionAccessLevel.Public,
    },
    handler: async (discord_client, interaction) => {
        if (!interaction.inCachedGuild()) return;
        if (!interaction.isButton()) return;

        await interaction.deferReply({ flags: ['Ephemeral'] });

        const original_interaction_user_id = interaction.message.interaction?.user.id;
        const user_id = original_interaction_user_id ?? interaction.user.id;

        await userProfileHandler(interaction, user_id);
    },
});
