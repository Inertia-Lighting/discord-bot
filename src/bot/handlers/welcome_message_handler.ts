/* Copyright © Inertia Lighting | All Rights Reserved */

//---------------------------------------------------------------------------------------------------------------//

'use strict';

//---------------------------------------------------------------------------------------------------------------//

import { Discord, client } from '../discord_client.js';

//---------------------------------------------------------------------------------------------------------------//

async function welcomeMessageHandler(member: Discord.GuildMember) {
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

    const welcome_message_channel = await client.channels.fetch('936738838309654610').catch(console.trace) as Discord.TextBasedChannel | undefined;
    if (!welcome_message_channel) return;

    const guild_welcome_message = await welcome_message_channel.send(dm_welcome_message_sent_successfully ? {
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
    } : welcome_message_options).catch(console.trace);
    if (!guild_welcome_message) return;

    setTimeout(() => {
        welcome_message_channel.messages.delete(guild_welcome_message.id).catch(console.warn);
    }, 15 * 60_000); // wait 15 minutes before deleting the welcome message
}

//---------------------------------------------------------------------------------------------------------------//

export {
    welcomeMessageHandler,
};
