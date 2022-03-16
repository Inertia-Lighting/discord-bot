/* Copyright © Inertia Lighting | All Rights Reserved */

//---------------------------------------------------------------------------------------------------------------//

'use strict';

//---------------------------------------------------------------------------------------------------------------//

const {
    Discord,
} = require('../../discord_client.js');

const { userProfileHandler } = require('../../handlers/user_profile_handler.js');

//---------------------------------------------------------------------------------------------------------------//

module.exports = {
    identifier: 'User Profile',
    /** @param {Discord.ContextMenuInteraction} interaction */
    async execute(interaction) {
        if (!interaction.inCachedGuild()) return;

        await interaction.deferReply({ ephemeral: true });

        const user = interaction.options.resolved.users.first();

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
