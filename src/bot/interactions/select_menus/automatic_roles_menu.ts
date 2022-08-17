/* Copyright © Inertia Lighting | All Rights Reserved */

//---------------------------------------------------------------------------------------------------------------//

import { Discord } from '../../discord_client';

//---------------------------------------------------------------------------------------------------------------//

const allowed_role_ids: string[] = [
    '835003401812574228', // Outage Announcements
    '835003393734737952', // Product Announcements
    '835003400882094090', // Community Announcements
    '891339307527335936', // Survey Announcements
    '914540830994358294', // Event Announcements
    '835011400086716426', // Misc Announcements
];

//---------------------------------------------------------------------------------------------------------------//

export default {
    identifier: 'automatic_roles_menu',
    async execute(interaction: Discord.SelectMenuInteraction) {
        if (!interaction.inCachedGuild()) return;

        await interaction.deferReply({ ephemeral: true });

        const guild_member = await interaction.guild.members.fetch(interaction.user.id);

        const supplied_role_ids = interaction.values;

        const roles_to_add = allowed_role_ids.filter(role_id => supplied_role_ids.includes(role_id));
        const roles_to_remove = allowed_role_ids.filter(role_id => !supplied_role_ids.includes(role_id));

        try {
            if (roles_to_add.length > 0) {
                await guild_member.roles.add(roles_to_add);
            }
            if (roles_to_remove.length > 0) {
                await guild_member.roles.remove(roles_to_remove);
            }
        } catch (error) {
            console.trace(error);
            return;
        }

        await interaction.editReply({
            embeds: [
                new Discord.MessageEmbed({
                    color: 0x60A0FF,
                    title: 'Automatic Roles',
                    description: [
                        'Your roles have been updated to be the following:',
                        ...roles_to_add.map(role_id => `- <@&${role_id}>`),
                    ].join('\n'),
                }),
            ],
        });
    },
};
