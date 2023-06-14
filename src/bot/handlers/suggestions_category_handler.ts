//------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
//------------------------------------------------------------//

//---------------------------------------------------------------------------------------------------------------//

import { Timer, string_ellipses } from '../../utilities';

import { CustomEmbed } from '../common/message';

import { Discord } from '../discord_client';

//---------------------------------------------------------------------------------------------------------------//

async function suggestionsCategoryHandler(message: Discord.Message) {
    if (!message.member) return;
    if (message.author.system || message.author.bot) return;
    if (message.content.length === 0) return;

    /* don't allow staff to create suggestions */
    if (message.member.roles.cache.has(process.env.BOT_STAFF_ROLE_ID as string)) return;

    const suggestions_channel = message.channel;

    /* suggestion text */
    const suggestion_text = string_ellipses(message.content, 1000);

    /* suggestion embed */
    const bot_suggestion_message = await suggestions_channel.send({
        embeds: [
            CustomEmbed.from({
                author: {
                    icon_url: `${message.author.displayAvatarURL({ forceStatic: false })}`,
                    name: `@${message.member.user.username} (${message.member.id})`,
                },
                description: `${suggestion_text}`,
            }),
        ],
    }).catch(console.warn);
    if (!bot_suggestion_message) return;

    /* add the reactions to the suggestion embed */
    await bot_suggestion_message.react('<:approved:813023668211810334>');
    await bot_suggestion_message.react('<:declined:813023668187824158>');

    await Timer(500);

    /* remove the original message */
    await message.delete();
}

//---------------------------------------------------------------------------------------------------------------//

export {
    suggestionsCategoryHandler,
};
