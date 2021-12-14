/* Copyright © Inertia Lighting | All Rights Reserved */

//---------------------------------------------------------------------------------------------------------------//

'use strict';

//---------------------------------------------------------------------------------------------------------------//

const Discord = require('discord.js');

//---------------------------------------------------------------------------------------------------------------//

const new_user_role_ids = process.env.BOT_NEW_USER_AUTO_ROLE_IDS.split(',');

//---------------------------------------------------------------------------------------------------------------//

module.exports = {
    identifier: 'consent_to_guild_rules',
    /** @param {Discord.ButtonInteraction} interaction */
    async execute(interaction) {
        if (!interaction.inCachedGuild()) return;

        await interaction.deferReply({ ephemeral: true });

        const guild_member = await interaction.guild.members.fetch(interaction.user.id);

        if (guild_member.roles.cache.hasAll(...new_user_role_ids)) {
            interaction.editReply({
                embeds: [
                    new Discord.MessageEmbed({
                        color: 0x60A0FF,
                        description: 'You already agreed to our rules!',
                    }),
                ],
            });

            return;
        }

        /* inform the user that they have agreed to the rules */
        await interaction.editReply({
            embeds: [
                new Discord.MessageEmbed({
                    color: 0x60A0FF,
                    description: 'Thank you for agreeing to our rules!',
                }),
            ],
        }).catch(console.warn);

        /* give roles to the user once they have agreed to the rules */
        await guild_member.roles.add(new_user_role_ids).catch(console.warn);

        /** @type {Discord.Snowflake?} */
        const welcome_message_id = interaction.client.$.welcome_message_ids.get(interaction.user.id);
        if (!welcome_message_id) return;

        /** @type {Discord.TextChannel?} */
        const general_chat_channel = interaction.client.channels.resolve(process.env.BOT_GENERAL_CHANNEL_ID);

        /* remove the welcome message */
        general_chat_channel.messages.delete(welcome_message_id);
    },
};
