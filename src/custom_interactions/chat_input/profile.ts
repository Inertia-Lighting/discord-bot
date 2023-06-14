//------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
//------------------------------------------------------------//

import * as Discord from 'discord.js';

import { CustomInteraction, CustomInteractionAccessLevel, CustomInteractionRunContext } from '@root/common/managers/custom_interactions_manager';

import { userProfileHandler } from '@root/common/handlers';

//------------------------------------------------------------//

export default new CustomInteraction({
    identifier: 'profile',
    type: Discord.InteractionType.ApplicationCommand,
    data: {
        type: Discord.ApplicationCommandType.ChatInput,
        description: 'Fetches a user\'s profile with a list of their products.',
        options: [
            {
                name: 'user',
                type: Discord.ApplicationCommandOptionType.User,
                description: 'The user to fetch the profile of, defaults to yourself.',
                required: false,
            },
        ],
    },
    metadata: {
        required_run_context: CustomInteractionRunContext.Guild,
        required_access_level: CustomInteractionAccessLevel.Public,
    },
    handler: async (discord_client, interaction) => {
        if (!interaction.isChatInputCommand()) return;
        if (!interaction.inCachedGuild()) return;
        if (!interaction.channel) return;

        await interaction.deferReply({ ephemeral: false });

        const user = interaction.options.getUser('user', false) ?? interaction.user;

        await userProfileHandler(interaction, user.id);
    },
});
