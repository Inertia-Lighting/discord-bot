//------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
//------------------------------------------------------------//

//---------------------------------------------------------------------------------------------------------------//

import { Discord } from '../discord_client';

import { interactionHandler } from '../handlers/interaction_handler';

//---------------------------------------------------------------------------------------------------------------//

export default {
    name: 'interactionCreate',
    async handler(interaction: Discord.Interaction) {
        if (interaction.user.system) return; // don't allow system accounts to interact
        if (interaction.user.bot) return; // don't allow bots to interact

        /* handle interactions */
        interactionHandler(interaction);
    },
};
