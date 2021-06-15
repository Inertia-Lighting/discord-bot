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
                'Welcome to the Inertia Lighting discord server!',
                'To get started, visit the following channels to learn about our server:',
                '- <#601890659439476766>', // general channel
                '- <#814197612491833354>', // support channel
                '- <#601890376667889684>', // rules
                '- <#737156807910359091>', // info
                '- <#854442081899642950>', // news
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
