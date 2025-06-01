//------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
//------------------------------------------------------------//

import * as Discord from 'discord.js';

import { delay, ellipseString } from '@root/utilities';

import { CustomEmbed } from '@root/common/message';
import { findBestMatch } from 'string-similarity';

//------------------------------------------------------------//

const bot_staff_role_id = `${process.env.BOT_STAFF_ROLE_ID ?? ''}`;
if (bot_staff_role_id.length < 1) throw new Error('Environment variable: BOT_STAFF_ROLE_ID; was not properly set or is empty');

//------------------------------------------------------------//

const camera_words: string[] = [
    'camera',
    'camreas',
    'cam',
    'live camera',
    'working camera',
];

function checkCameraMention(msg: string): boolean {
    return (findBestMatch(msg, camera_words).ratings.some((rating) => rating.rating > 0.5));
}

export async function suggestionsCategoryHandler(
    message: Discord.Message,
) {
    if (!message.member) return;
    if (message.author.system || message.author.bot) return;
    if (message.content.length === 0) return;

    /* don't allow staff to create suggestions */
    if (message.member.roles.cache.has(bot_staff_role_id) && !message.content.startsWith('!s ')) {
        return;
    }

    const suggestions_channel = message.channel;
    if(!suggestions_channel.isSendable()) throw new Error('The identity manager logging channel is not sendable!');
    if (checkCameraMention(message.content)) {
        const camera_message = await message.reply({
            embeds: [
                CustomEmbed.from({
                    color: CustomEmbed.Color.Violet,
                    title: 'Camera System',
                    description: `
                    Camera systems are certainly possible; however, it’s important to consider their practicality and feasibility within the context of your project. While implementing a functional camera system is achievable, there are several challenges and limitations to keep in mind:
\n Increased Cost: Developing and maintaining a robust camera system can significantly raise overall project expenses.
\n Complex Installation: Setup and integration may require advanced configuration and expertise.
\n Performance Impact: Camera systems can introduce lag and increase the number of server/client requests, affecting overall performance.
\n Rendering Limitations: Not all elements may render correctly or consistently through the camera.
\n Resource Demands: More staff or contributors may be needed to manage and support the system.
\n Functionality Constraints: There are strict limitations on what can and cannot be achieved, especially within platforms like Roblox.
\n Additionally, Roblox cameras attempt to render everything within their view. This means that when a camera faces a densely populated or complex scene, it may attempt to load everything, potentially causing system slowdowns or complete failure to render.`,
                }),
            ],
        });
        message.delete();
        setTimeout(() => {
            camera_message.delete();
        }, 5_000);
        return;
    }

    /* suggestion text */
    let suggestion_text = message.content.slice(3);
    suggestion_text = ellipseString(message.content, 1000);

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

    await delay(500);

    /* remove the original message */
    await message.delete();
}
