/* Copyright © Inertia Lighting | All Rights Reserved */

//---------------------------------------------------------------------------------------------------------------//

'use strict';

//---------------------------------------------------------------------------------------------------------------//

/**
 * @typedef {import('discord.js').SelectMenuInteraction} SelectMenuInteraction
 */

//---------------------------------------------------------------------------------------------------------------//

const automatic_role_ids = [
    '835003393734737952',
    '835003401812574228',
    '835011400086716426',
    '835003400882094090',
    '835003345348722758',
    '891339307527335936',
];

//---------------------------------------------------------------------------------------------------------------//

module.exports = {
    identifier: 'automatic_roles_menu',
    /** @param {SelectMenuInteraction} interaction */
    async execute(interaction) {
        if (!interaction.guildId) return;

        await interaction.deferUpdate();

        const guild_member = await interaction.guild.members.fetch(interaction.userId);

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
