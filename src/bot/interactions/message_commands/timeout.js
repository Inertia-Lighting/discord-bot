/* Copyright © Inertia Lighting | All Rights Reserved */

//---------------------------------------------------------------------------------------------------------------//

'use strict';

//---------------------------------------------------------------------------------------------------------------//

const { logModerationActionToDatabase } = require('../../handlers/log_moderation_action_handler.js');

const {
    getUserPermissionLevel,
    command_permission_levels,
    user_is_not_allowed_access_to_command_message_options,
} = require('../../common/bot.js');

//---------------------------------------------------------------------------------------------------------------//

/**
 * @typedef {import('discord.js').CommandInteraction} CommandInteraction
 * @typedef {import('discord.js').GuildMember} GuildMember
 */

//---------------------------------------------------------------------------------------------------------------//

module.exports = {
    identifier: 'timeout',
    /**
     * @param {CommandInteraction} interaction
     */
    async execute(interaction) {
        if (!interaction.isCommand()) return;

        await interaction.deferReply();

        const interaction_guild_member = await interaction.guild.members.fetch(interaction.user.id);

        const user_permission_level = getUserPermissionLevel(interaction_guild_member);

        if (user_permission_level < command_permission_levels.MODERATORS) {
            interaction.editReply(user_is_not_allowed_access_to_command_message_options).catch(console.warn);
            return; // user is not allowed to access this command
        }
        const staff_member = interaction_guild_member;

        /** @type {GuildMember} */
        const member = await interaction.guild.members.fetch({
            user: interaction.options.getMember('member', true),
            limit: 1,
        });
        const duration = interaction.options.getInteger('duration', true); // in milliseconds
        const reason = interaction.options.getString('reason', false) || 'no reason was specified';

        /* handle when a staff member specifies themself */
        if (staff_member.id === member.id) {
            await interaction.editReply({
                embeds: [
                    {
                        color: 0xFFFF00,
                        description: 'You aren\'t allowed to timeout yourself!',
                    },
                ],
            }).catch(console.warn);
            return;
        }

        /* handle when a staff member specifies the guild owner */
        if (member.id === interaction.guild.ownerId) {
            await interaction.editReply({
                embeds: [
                    {
                        color: 0xFFFF00,
                        description: 'You aren\'t allowed to timeout the owner of this server!',
                    },
                ],
            });
            return;
        }

        /* handle when a staff member tries to moderate someone with an equal/higher role */
        if (staff_member.roles.highest.comparePositionTo(member.roles.highest) <= 0) {
            await interaction.editReply({
                embeds: [
                    {
                        color: 0xFFFF00,
                        description: 'You aren\'t allowed to timeout someone with an equal/higher role!',
                    },
                ],
            }).catch(console.warn);
            return;
        }

        const moderation_message_options = {
            content: [
                `${member}`,
                `You were put in timeout by ${staff_member} for ${duration / 60_000} minutes for:`,
                '\`\`\`',
                `${reason}`,
                '\`\`\`',
            ].join('\n'),
        };

        /* dm the member */
        try {
            const dm_channel = await interaction.client.users.createDM(member.id);
            await dm_channel.send(moderation_message_options);
        } catch {
            // ignore any errors
        }

        /* message the member in the server */
        await interaction.editReply(moderation_message_options).catch(console.warn);

        /* log to the database */
        await logModerationActionToDatabase({
            discord_user_id: member.id,
        }, {
            type: 'TIMEOUT',
            epoch: Date.now(),
            reason: `${reason} (duration: ${duration / 60_000} minutes)`,
            staff_member_id: staff_member.id,
        });
    },
};
