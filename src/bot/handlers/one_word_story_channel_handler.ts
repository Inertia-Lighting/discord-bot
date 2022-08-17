/* Copyright © Inertia Lighting | All Rights Reserved */

//---------------------------------------------------------------------------------------------------------------//

import { Timer } from '../../utilities';

import { Discord } from '../discord_client';

//---------------------------------------------------------------------------------------------------------------//

const oneWordStoryFilter = /^[^\s]*$/i; // match a single word

//---------------------------------------------------------------------------------------------------------------//

async function oneWordStoryChannelHandler(message: Discord.Message) {
    if (message.author.system || message.author.bot) return;
    if (message.content.length === 0) return;

    const message_passes_filter = oneWordStoryFilter.test(message.content);
    if (message_passes_filter) return; // the message is allowed to pass

    await Timer(1_000); // prevent api abuse

    await message.delete(); // remove the message
}

//---------------------------------------------------------------------------------------------------------------//

export {
    oneWordStoryChannelHandler,
};
