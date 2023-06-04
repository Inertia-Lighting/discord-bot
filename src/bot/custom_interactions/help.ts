//------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
//------------------------------------------------------------//

import * as Discord from 'discord.js';

import { CustomInteraction, CustomInteractionAccessLevel, CustomInteractionsManager } from '@root/bot/common/managers/custom_interactions_manager';

//------------------------------------------------------------//

export default new CustomInteraction({
    identifier: 'help',
    type: Discord.InteractionType.ApplicationCommand,
    data: {
        type: Discord.ApplicationCommandType.ChatInput,
        description: 'Lists all available commands for you to use!',
        options: [],
    },
    metadata: {
        required_access_level: CustomInteractionAccessLevel.Public,
    },
    handler: async (discord_client, interaction) => {
        if (!interaction.isChatInputCommand()) return;
        if (!interaction.inCachedGuild()) return;
        if (!interaction.channel) return;

        await interaction.deferReply({ ephemeral: false });

        const chat_input_custom_interactions = CustomInteractionsManager.interactions.filter(
            (custom_interaction) =>
                custom_interaction.type === Discord.InteractionType.ApplicationCommand &&
                'type' in custom_interaction.data &&
                custom_interaction.data.type === Discord.ApplicationCommandType.ChatInput
        );

        /** @todo finish the command */
        console.log(chat_input_custom_interactions); // temporary to suppress eslint
    },
});
