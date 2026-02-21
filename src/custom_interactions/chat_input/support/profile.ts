// ------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
// ------------------------------------------------------------//

import * as Discord from 'discord.js';

import { userProfileHandler } from '@/common/handlers/index.js'
import { CustomInteraction, CustomInteractionAccessLevel, CustomInteractionRunContext } from '@/common/managers/custom_interactions_manager.js'

// ------------------------------------------------------------//

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
            }, {
                name: 'ephemeral',
                type: Discord.ApplicationCommandOptionType.Boolean,
                description: 'Whether or not to respond with an ephemeral message.',
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

        const respond_as_ephemeral: boolean = interaction.options.getBoolean('ephemeral', false) ?? false; // default to false

        await interaction.deferReply({ flags: respond_as_ephemeral ? ['Ephemeral'] : [] });

        const user = interaction.options.getUser('user', false) ?? interaction.user;

        await userProfileHandler(interaction, user.id);
    },
});
