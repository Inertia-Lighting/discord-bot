/* Copyright © Inertia Lighting | All Rights Reserved */
//---------------------------------------------------------------------------------------------------------------//
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
//---------------------------------------------------------------------------------------------------------------//
const discord_client_js_1 = require("../../discord_client.js");
const user_profile_handler_js_1 = require("../../handlers/user_profile_handler.js");
//---------------------------------------------------------------------------------------------------------------//
module.exports = {
    identifier: 'User Profile',
    async execute(interaction) {
        if (!interaction.inCachedGuild())
            return;
        await interaction.deferReply({ ephemeral: true });
        const user = interaction.options.resolved.users.first();
        if (!user) {
            return interaction.editReply({
                embeds: [
                    new discord_client_js_1.Discord.MessageEmbed({
                        color: 0xFF0000,
                        title: 'An unexpected error occurred!',
                        description: 'The user you are trying to view does not exist!',
                    }),
                ],
            });
        }
        (0, user_profile_handler_js_1.userProfileHandler)(interaction, user.id);
    },
};
//# sourceMappingURL=user_profile.js.map