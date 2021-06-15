/* Copyright © Inertia Lighting | All Rights Reserved */

//---------------------------------------------------------------------------------------------------------------//

'use strict';

//---------------------------------------------------------------------------------------------------------------//

const { Discord } = require('../discord_client.js');

//---------------------------------------------------------------------------------------------------------------//

const general_chat_id = '601890659439476766';

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
                'Welcome to Inertia Lighting, the largest lighting company at scale on ROBLOX sourcing some of today\'s best gear.',
                'To get yourself started, view the following channels to obtain an understanding of our server.',
                'Here for our product hub? View [**this!**](https://www.roblox.com/games/5438256564)',
                'Require Support? View <#814197612491833354>**!**',
                'Just looking to interact with the community? Go to <#601890659439476766>**!**',
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
