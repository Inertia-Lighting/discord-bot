/* Copyright © Inertia Lighting | All Rights Reserved */

//---------------------------------------------------------------------------------------------------------------//

'use strict';

//---------------------------------------------------------------------------------------------------------------//

const { Discord, client } = require('../discord_client.js');

//---------------------------------------------------------------------------------------------------------------//

const new_user_role_ids = process.env.BOT_NEW_USER_AUTO_ROLE_IDS.split(',');
const general_chat_channel_id = process.env.BOT_GENERAL_CHANNEL_ID;

//---------------------------------------------------------------------------------------------------------------//

/**
 * @param {Discord.GuildMember} member
 */
async function welcomeMessageHandler(member) {
    await member.fetch(true);

    const message_options = {
        content: `${member}`,
        embeds: [
            new Discord.MessageEmbed({
                color: 0x60A0FF,
                title: 'Welcome to Inertia Lighting!',
                description: [
                    'Please click the button so that we know you are a human!',
                ].join('\n'),
            }),
        ],
        components: [
            {
                type: 1,
                components: [
                    {
                        type: 2,
                        style: 3,
                        custom_id: 'user_is_a_human',
                        label: 'I am a human!',
                    },
                ],
            },
        ],
    };

    let welcome_message;
    try {
        const dm_channel = await member.createDM();
        welcome_message = await dm_channel.send(message_options);
    } catch {
        try {
            /** @type {Discord.TextChannel} */
            const general_chat_channel = await client.channels.fetch(general_chat_channel_id);
            welcome_message = await general_chat_channel.send(message_options);
        } catch (error) {
            console.trace('Failed to send welcome_message to general_chat_channel:', error);
        }
    }

    /* check if the message was sent */
    if (!welcome_message) return;

    /* handle the button presses */
    const welcome_message_component_interaction_collector = await welcome_message.channel.createMessageComponentCollector();

    welcome_message_component_interaction_collector.on('collect', (message_component_interaction) => {
        message_component_interaction.deferUpdate({ ephemeral: false });

        switch (message_component_interaction.customId) {
            case 'user_is_a_human': {
                welcome_message_component_interaction_collector.stop();

                /* give roles to the user */
                member.roles.add(new_user_role_ids).catch(console.warn);

                /* welcome the user to the server */
                message_component_interaction.update({
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
                }).catch(console.warn);

                break;
            }

            default: {
                welcome_message_component_interaction_collector.stop();
                break;
            }
        }
    });

    welcome_message_component_interaction_collector.on('end', () => {
        /* remove the welcome message */
        welcome_message.channel.messages.delete(welcome_message.id).catch(() => null);
    });
}

//---------------------------------------------------------------------------------------------------------------//

module.exports = {
    welcomeMessageHandler,
};
