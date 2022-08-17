/* Copyright © Inertia Lighting | All Rights Reserved */

//---------------------------------------------------------------------------------------------------------------//

import { Discord } from '../../discord_client';

import { userProfileHandler } from '../../handlers/user_profile_handler';

import { CustomEmbed } from '@root/bot/common/message';

//---------------------------------------------------------------------------------------------------------------//

export default {
    identifier: 'User Profile',
    async execute(
        interaction: Discord.UserContextMenuCommandInteraction
    ) {
        if (!interaction.inCachedGuild()) return;

        await interaction.deferReply({ ephemeral: true });

        const user = await interaction.client.users.fetch(interaction.targetUser, { force: true });

        if (!user) {
            return interaction.editReply({
                embeds: [
                    CustomEmbed.from({
                        color: CustomEmbed.colors.RED,
                        title: 'An unexpected error occurred!',
                        description: 'The user you are trying to view does not exist!',
                    }),
                ],
            });
        }

        userProfileHandler(interaction, user.id);
    },
};
