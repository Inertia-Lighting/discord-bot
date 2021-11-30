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
                author: {
                    iconURL: `${client.user.displayAvatarURL({ dynamic: true })}`,
                    name: `${client.user.username}`,
                },
                title: 'Welcome!',
                description: [
                    'Welcome to the Inertia Lighting discord server!',
                    'To get started, visit the following channels to learn about our server:',
                    `- <#${member.guild.rulesChannelId}>`,
                    `- <#${process.env.BOT_INFO_CHANNEL_ID}>`,
                    `- <#${process.env.BOT_NEWS_CHANNEL_ID}>`,
                    `- <#${process.env.BOT_SUPPORT_CHANNEL_ID}>`,
                    `- <#${process.env.BOT_GENERAL_CHANNEL_ID}>`,
                    `Also, check out our [product hub](${process.env.ROBLOX_PRODUCT_HUB_URL}) to purchase products using Robux!`,
                    'Or, you can go to [our website](https://inertia.lighting/products) to purchase products using PayPal!',
                ].join('\n'),
            }),
        ],
    };

    try {
        const dm_channel = await member.createDM();
        await dm_channel.send(message_options);
    } catch {
        const general_chat_channel = client.channels.resolve(process.env.BOT_GENERAL_CHANNEL_ID);
        await general_chat_channel.send(message_options).catch(console.warn);
    }
}

//---------------------------------------------------------------------------------------------------------------//

module.exports = {
    welcomeMessageHandler,
};
