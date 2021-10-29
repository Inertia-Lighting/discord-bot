/* Copyright © Inertia Lighting | All Rights Reserved */

//---------------------------------------------------------------------------------------------------------------//

'use strict';

//---------------------------------------------------------------------------------------------------------------//

/**
 * @typedef {import('discord.js').SelectMenuInteraction} SelectMenuInteraction
 */

//---------------------------------------------------------------------------------------------------------------//

const automatic_role_ids = [
    '835003393734737952', // Product Announcements
    '835003401812574228', // Outage Announcements
    '835011400086716426', // Misc Announcements
    '835003400882094090', // Server Update Announcements
    '835003345348722758', // Partner Announcements
    '835003307381489674', // Game Announcements
    '779463039325700147', // Streams Announcements
    '891339307527335936', // Community Poll Announcements
];

//---------------------------------------------------------------------------------------------------------------//

module.exports = {
    identifier: 'automatic_roles_menu',
    /** @param {SelectMenuInteraction} interaction */
    async execute(interaction) {
        if (!interaction.guildId) return;

        await interaction.deferUpdate();

        const guild_member = await interaction.guild.members.fetch(interaction.user.id);

        const role_ids = interaction.values;

        const roles_to_add = automatic_role_ids.filter(automatic_role_id => role_ids.includes(automatic_role_id));
        const roles_to_remove = automatic_role_ids.filter(automatic_role_id => !role_ids.includes(automatic_role_id));

        if (roles_to_add.length > 0) {
            await guild_member.roles.add(roles_to_add);
        }

        if (roles_to_remove.length > 0) {
            await guild_member.roles.remove(roles_to_remove);
        }
    },
};
