/* Copyright © Inertia Lighting | All Rights Reserved */

//---------------------------------------------------------------------------------------------------------------//

'use strict';

//---------------------------------------------------------------------------------------------------------------//

import { Discord } from '../../discord_client.js';

import { userProfileHandler } from '../../handlers/user_profile_handler.js';

//---------------------------------------------------------------------------------------------------------------//

export default {
    identifier: 'User Profile',
    async execute(
        interaction: Discord.ContextMenuInteraction
    ) {
        if (!interaction.inCachedGuild()) return;

        await interaction.deferReply({ ephemeral: true });

        const user = interaction.options.resolved.users!.first();

        if (!user) {
            return interaction.editReply({
                embeds: [
                    new Discord.MessageEmbed({
                        color: 0xFF0000,
                        title: 'An unexpected error occurred!',
                        description: 'The user you are trying to view does not exist!',
                    }),
                ],
            });
        }

        userProfileHandler(interaction, user.id);
    },
};
