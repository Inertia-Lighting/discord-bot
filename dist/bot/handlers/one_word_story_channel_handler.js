/* Copyright © Inertia Lighting | All Rights Reserved */
//---------------------------------------------------------------------------------------------------------------//
'use strict';
//---------------------------------------------------------------------------------------------------------------//
const { Timer } = require('../../utilities.js');
//---------------------------------------------------------------------------------------------------------------//
const oneWordStoryFilter = /^[^\s]*$/i; // match a single word
//---------------------------------------------------------------------------------------------------------------//
/**
 * @param {Discord.Message} message
 */
async function oneWordStoryChannelHandler(message) {
    if (message.author.system || message.author.bot)
        return;
    if (message.content.length === 0)
        return;
    const message_passes_filter = oneWordStoryFilter.test(message.content);
    if (message_passes_filter)
        return; // the message is allowed to pass
    await Timer(1_000); // prevent api abuse
    await message.delete(); // remove the message
}
//---------------------------------------------------------------------------------------------------------------//
module.exports = {
    oneWordStoryChannelHandler,
};
//# sourceMappingURL=one_word_story_channel_handler.js.map