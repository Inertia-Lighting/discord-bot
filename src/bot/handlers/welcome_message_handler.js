/* Copyright © Inertia Lighting | All Rights Reserved */

//---------------------------------------------------------------------------------------------------------------//

'use strict';

//---------------------------------------------------------------------------------------------------------------//

const { Discord, client } = require('../discord_client.js');

//---------------------------------------------------------------------------------------------------------------//

/**
 * @param {Discord.GuildMember} member
 */
async function welcomeMessageHandler(member) {
    const message_options = {
        content: `${member}`,
        embeds: [
            new Discord.MessageEmbed({
                color: 0x60A0FF,
                title: 'Welcome to Inertia Lighting!',
                description: [
                    `You need to accept our rules in <#${member.guild.rulesChannelId}> (click the green button)!`,
                    'Once you accept, you will gain access to the rest of the server.',
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
                        label: 'Product Hub',
                        url: 'https://product-hub.inertia.lighting/',
                    }, {
                        type: 2,
                        style: 5,
                        label: 'Privacy Policy',
                        url: 'https://inertia.lighting/privacy',
                    }, {
                        type: 2,
                        style: 5,
                        label: 'F.A.Q.',
                        url: 'https://inertia.lighting/faq',
                    },
                ],
            },
        ],
    };

    try {
        const dm_channel = await member.createDM();
        await dm_channel.send(message_options);
    } catch {} // ignore any errors

    /** @type {Discord.TextChannel} */
    const general_chat_channel = client.channels.resolve(process.env.BOT_GENERAL_CHANNEL_ID);

    /* send welcome message to general chat */
    const welcome_message = await general_chat_channel.send(message_options).catch(console.warn);
    if (welcome_message) client.$.welcome_message_ids.set(member.id, welcome_message.id);
}

//---------------------------------------------------------------------------------------------------------------//

module.exports = {
    welcomeMessageHandler,
};
