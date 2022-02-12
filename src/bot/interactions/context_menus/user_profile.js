/* Copyright © Inertia Lighting | All Rights Reserved */

//---------------------------------------------------------------------------------------------------------------//

'use strict';

//---------------------------------------------------------------------------------------------------------------//

const { userProfileHandler } = require('../../handlers/user_profile_handler.js');

//---------------------------------------------------------------------------------------------------------------//

module.exports = {
    identifier: 'User Profile',
    /** @param {Discord.ContextMenuInteraction} interaction */
    async execute(interaction) {
        if (!interaction.inCachedGuild()) return;

        await interaction.deferReply({ ephemeral: true });

        const user = interaction.options.resolved.users.first();

        userProfileHandler(interaction, user.id);
    },
};
