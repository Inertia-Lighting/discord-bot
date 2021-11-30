/* Copyright © Inertia Lighting | All Rights Reserved */

//---------------------------------------------------------------------------------------------------------------//

'use strict';

//---------------------------------------------------------------------------------------------------------------//

const Discord = require('discord.js');

const { Timer } = require('../../utilities.js');

//---------------------------------------------------------------------------------------------------------------//

const new_user_role_ids = process.env.BOT_NEW_USER_AUTO_ROLE_IDS.split(',');

//---------------------------------------------------------------------------------------------------------------//

module.exports = {
    identifier: 'consent_to_guild_rules',
    /** @param {Discord.ButtonInteraction} interaction */
    async execute(interaction) {
        if (!interaction.inCachedGuild()) return;

        await interaction.reply({
            ephemeral: true,
            embeds: [
                new Discord.MessageEmbed({
                    color: 0x60A0FF,
                    description: 'Thank you for agreeing to our rules!',
                }),
            ],
        }).catch(console.warn);

        const guild_member = await interaction.guild.members.fetch(interaction.user.id);

        /* give roles to the user once they have agreed to the rules */
        for (const role_id of new_user_role_ids) {
            await guild_member.roles.add(role_id).catch(console.warn);
            await Timer(1_000); // prevent api abuse
        }
    },
};
