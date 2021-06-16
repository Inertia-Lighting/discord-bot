/* Copyright © Inertia Lighting | All Rights Reserved */

//---------------------------------------------------------------------------------------------------------------//

'use strict';

//---------------------------------------------------------------------------------------------------------------//

const { string_ellipses, Timer } = require('../../utilities.js');

const { Discord } = require('../discord_client.js');

//---------------------------------------------------------------------------------------------------------------//

/**
 * @param {Discord.Message} message
 */
async function suggestionsCategoryHandler(message) {
    if (message.author.system || message.author.bot) return;
    if (message.content.length === 0) return;

    const suggestions_channel = message.channel;

    /* suggestion text */
    const suggestion_text = string_ellipses(message.content, 1000);

    /* suggestion embed */
    const bot_suggestion_message = await suggestions_channel.send(new Discord.MessageEmbed({
        color: 0x60A0FF,
        author: {
            iconURL: `${message.author.displayAvatarURL({ dynamic: true })}`,
            name: `@${message.member.user.tag} (${message.member.id})`,
        },
        description: `${suggestion_text}`,
    })).catch(console.warn);

    /* add the reactions to the suggestion embed */
    await bot_suggestion_message.react('⬆️');
    await bot_suggestion_message.react('⬇️');

    await Timer(500);

    /* remove the original message */
    await message.delete();
}

//---------------------------------------------------------------------------------------------------------------//

module.exports = {
    suggestionsCategoryHandler,
};
