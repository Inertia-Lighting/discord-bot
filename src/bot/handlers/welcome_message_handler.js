/* Copyright © Inertia Lighting | All Rights Reserved */

//---------------------------------------------------------------------------------------------------------------//

'use strict';

//---------------------------------------------------------------------------------------------------------------//

const { Discord, client } = require('../discord_client.js');

//---------------------------------------------------------------------------------------------------------------//

const general_chat_channel_id = process.env.BOT_GENERAL_CHANNEL_ID;

//---------------------------------------------------------------------------------------------------------------//

/**
 * @param {Discord.GuildMember} member
 */
async function welcomeMessageHandler(member) {
    const welcome_message_options = {
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
                        custom_id: 'welcome_message_captcha_button',
                        label: 'I am a human!',
                    },
                ],
            },
        ],
    };

    let dm_welcome_message_sent_successfully = true; // assume success until proven otherwise
    try {
        const dm_channel = await member.createDM();
        await dm_channel.send(welcome_message_options);
    } catch {
        dm_welcome_message_sent_successfully = false;
    }

    try {
        /** @type {Discord.TextChannel} */
        const general_chat_channel = await client.channels.fetch(general_chat_channel_id);
        await general_chat_channel.send(dm_welcome_message_sent_successfully ? {
            content: `${member}`,
            embeds: [
                new Discord.MessageEmbed({
                    color: 0x60A0FF,
                    title: 'Welcome to Inertia Lighting!',
                    description: [
                        'Please check your DMs for a CAPTCHA message sent by our bot!',
                        'You need to complete the CAPTCHA to gain access to the server!',
                    ].join('\n'),
                }),
            ],
        } : welcome_message_options);
    } catch (error) {
        console.trace('Failed to send welcome_message to general_chat_channel:', error);
    }
}

//---------------------------------------------------------------------------------------------------------------//

module.exports = {
    welcomeMessageHandler,
};
