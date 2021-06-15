/* Copyright © Inertia Lighting | All Rights Reserved */

//---------------------------------------------------------------------------------------------------------------//

'use strict';

//---------------------------------------------------------------------------------------------------------------//

const { Discord } = require('../discord_client.js');

//---------------------------------------------------------------------------------------------------------------//

const general_chat_id = '<#601890659439476766>';
const support_channel_id = '<#814197612491833354>';
const rules_channel_id = '<#601890376667889684>';
const info_channel_id = '<#737156807910359091>';
const news_channel_id = '<#854442081899642950>';

//---------------------------------------------------------------------------------------------------------------//

async function welcomeMessageHandler(member) {
    const message_contents = {
        content: `${member}`,
        embed: new Discord.MessageEmbed({
            author: {
                iconURL: `${client.user.displayAvatarURL({ dynamic: true })}`,
                name: `${client.user.username}`,
            },
            title: 'Welcome!',
            description: [
                'Welcome to the Inertia Lighting discord server!',
                'To get started, visit the following channels to learn about our server:',
                `- ${general_chat_id}`, // general channel id
                `- ${support_channel_id}`, // support channel id
                `- ${rules_channel_id}`, // rules channel id
                `- ${info_channel_id}`, // info channel id
                `- ${news_channel_id}`, // news channel id
                'Also, check out our [product hub](https://www.roblox.com/games/5438256564) to purchase our products!',
            ].join('\n'),
        }),
    };

    try {
        const dm_channel = await member.createDM();
        await dm_channel.send(message_contents);
    } catch {
        const general_chat_channel = client.channels.resolve(general_chat_id);
        await general_chat_channel.send(message_contents).catch(console.warn);
    }
}

//---------------------------------------------------------------------------------------------------------------//

module.exports = {
    welcomeMessageHandler,
};
