'use strict';

//---------------------------------------------------------------------------------------------------------------//

const { string_ellipses } = require('../../utilities.js');

const { Discord, client } = require('../discord_client.js');

//---------------------------------------------------------------------------------------------------------------//

async function suggestionsChannelHandler(message) {
    const suggestions_channel = message.channel;

    /* suggestion text */
    const suggestion_text = string_ellipses(message.cleanContent, 1000);

    /* suggestion embed */
    const bot_suggestion_message = await suggestions_channel.send(new Discord.MessageEmbed({
        color: 0x60A0FF,
        author: {
            iconURL: `${message.author.displayAvatarURL({ dynamic: true })}`,
            name: `${message.member.displayName}`,
        },
        description: `${suggestion_text}`,
    })).catch(console.warn);

    /* suggestion embed reactions */
    await bot_suggestion_message.react(`⬆️`);
    await bot_suggestion_message.react(`⬇️`);

    /* remove original message */
    message.delete({ timeout: 500 });
}

//---------------------------------------------------------------------------------------------------------------//

module.exports = {
    suggestionsChannelHandler,
};
