/* Copyright © Inertia Lighting | All Rights Reserved */

//---------------------------------------------------------------------------------------------------------------//

'use strict';

//---------------------------------------------------------------------------------------------------------------//

/**
 * @typedef {import('discord.js').SelectMenuInteraction} SelectMenuInteraction
 */

//---------------------------------------------------------------------------------------------------------------//

module.exports = {
    identifier: 'automatic_roles_menu',
    /** @param {SelectMenuInteraction} interaction */
    async execute(interaction) {
        if (!interaction.guildId) return;

        const automatic_role_ids = interaction.values;

        for (const automatic_role_id of automatic_role_ids) {
            const member = await interaction.guild.members.fetch(interaction.user.id);

            if (member.roles.cache.has(automatic_role_id)) {
                member.roles.remove(automatic_role_id);
            } else {
                member.roles.add(automatic_role_id);
            }
        }
    },
};
