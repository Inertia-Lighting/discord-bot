// ------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
// ------------------------------------------------------------//

import * as Discord from 'discord.js';

import { userProfileHandler } from '@/common/handlers/index.js'
;
import { CustomInteraction, CustomInteractionAccessLevel, CustomInteractionRunContext } from '@/common/managers/custom_interactions_manager.js'
;

// ------------------------------------------------------------//

export default new CustomInteraction({
    identifier: 'User Profile',
    type: Discord.InteractionType.ApplicationCommand,
    data: {
        type: Discord.ApplicationCommandType.User,
    },
    metadata: {
        required_run_context: CustomInteractionRunContext.Guild,
        required_access_level: CustomInteractionAccessLevel.Public,
    },
    handler: async (discord_client, interaction) => {
        if (!interaction.inCachedGuild()) return;
        if (!interaction.isUserContextMenuCommand()) return;

        await interaction.deferReply({ flags: ['Ephemeral'] });

        await userProfileHandler(interaction, interaction.targetUser.id);
    },
});
