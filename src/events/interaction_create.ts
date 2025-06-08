// ------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
// ------------------------------------------------------------//

import { CustomInteractionsManager } from '@root/common/managers/custom_interactions_manager';
import * as Discord from 'discord.js';

// ------------------------------------------------------------//

export default {
    name: Discord.Events.InteractionCreate,
    async handler(
        client: Discord.Client,
        interaction: Discord.Interaction,
    ) {
        if (!interaction.client.isReady()) return; // don't allow interactions to be handled until the client is ready
        if (interaction.user.system) return; // don't allow system accounts to interact
        if (interaction.user.bot) return; // don't allow bots to interact

        /* handle interactions */
        CustomInteractionsManager.handleInteractionFromDiscord(interaction.client, interaction);
    },
};
