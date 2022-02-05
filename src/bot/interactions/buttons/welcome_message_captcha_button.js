/* Copyright © Inertia Lighting | All Rights Reserved */

//---------------------------------------------------------------------------------------------------------------//

'use strict';

//---------------------------------------------------------------------------------------------------------------//

const { Discord, client } = require('../../discord_client.js');

const { automaticVerificationHandler } = require('../../handlers/automatic_verification_handler.js');

//---------------------------------------------------------------------------------------------------------------//

const bot_guild_id = process.env.BOT_GUILD_ID;
const new_server_member_role_ids = process.env.BOT_SERVER_MEMBER_AUTO_ROLE_IDS.split(',');
const new_to_the_server_role_ids = process.env.BOT_NEW_TO_THE_SERVER_AUTO_ROLE_IDS.split(',');

//---------------------------------------------------------------------------------------------------------------//

module.exports = {
    identifier: 'welcome_message_captcha_button',
    /** @param {Discord.ButtonInteraction} interaction */
    async execute(interaction) {
        interaction.deferUpdate({ ephemeral: false });

        const guild = client.guilds.cache.get(bot_guild_id);
        const member = await guild.members.fetch(interaction.user.id).catch(() => null);

        if (!(member instanceof Discord.GuildMember)) {
            console.warn(`Unable to fetch member from user: ${interaction.user.id}; skipping...`);
            return;
        }

        const welcome_message = await interaction.channel.messages.fetch(interaction.message.id);
        const member_from_welcome_message = welcome_message.mentions.members.first();

        if (!(member_from_welcome_message instanceof Discord.GuildMember)) {
            console.warn(`Unable to fetch member from welcome message: ${interaction.message.id}; skipping...`);
            return;
        }

        if (member_from_welcome_message.id !== member.id) {
            await interaction.followUp({
                ephemeral: true,
                content: 'You are not the member mentioned in the welcome message.',
            }).catch(console.warn);
            return;
        }

        /* give new-server-member roles to the user */
        try {
            await member.roles.add(new_server_member_role_ids);
        } catch (error) {
            console.trace('Failed to give new-server-member roles to the member:', error);
        }

        /* remove the new-to-the-server roles from the user */
        try {
            await member.roles.remove(new_to_the_server_role_ids);
        } catch (error) {
            console.trace('Failed to remove new-to-the-server roles from the member:', error);
        }

        /* welcome the user to the server */
        await interaction.editReply({
            embeds: [
                new Discord.MessageEmbed({
                    color: 0x60A0FF,
                    title: 'Welcome to Inertia Lighting!',
                    description: [
                        'Thank you for joining our server, and welcome to what\'s possible!',
                        '',
                        'Check out our product hub to purchase our products using Robux!',
                        'Alternatively, you can make a purchase using PayPal on our website!',
                    ].join('\n'),
                }),
            ],
            components: [
                {
                    type: 1,
                    components: [
                        {
                            type: 2,
                            style: 5,
                            label: 'Our Website',
                            url: 'https://inertia.lighting/',
                        }, {
                            type: 2,
                            style: 5,
                            label: 'Our Products',
                            url: 'https://inertia.lighting/products',
                        }, {
                            type: 2,
                            style: 5,
                            label: 'Product Hub',
                            url: 'https://product-hub.inertia.lighting/',
                        }, {
                            type: 2,
                            style: 5,
                            label: 'F.A.Q.',
                            url: 'https://inertia.lighting/faq',
                        }, {
                            type: 2,
                            style: 5,
                            label: 'Privacy Policy',
                            url: 'https://inertia.lighting/privacy',
                        },
                    ],
                },
            ],
        });

        setTimeout(() => {
            /* prompt the user to automatically link their accounts (if possible) */
            automaticVerificationHandler(member).catch(console.trace);
        }, 5_000); // wait 5 seconds
    },
};
