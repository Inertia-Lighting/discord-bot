// ------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
// ------------------------------------------------------------//

import Discord from 'discord.js'
import { findBestMatch, Rating } from 'string-similarity';

import { CustomEmbed } from '@/common/message';
import { delay, ellipseString } from '@/utilities/index';

// ------------------------------------------------------------//

const bot_staff_role_id = `${process.env.BOT_STAFF_ROLE_ID ?? ''}`;
if (bot_staff_role_id.length < 1) throw new Error('Environment variable: BOT_STAFF_ROLE_ID; was not properly set or is empty');

// ------------------------------------------------------------//

const camera_words: string[] = [
    'camera',
    'camreas',
    'cam',
    'live camera',
    'working camera',
    'cody cam pack',
    'cam pack',
    'cody'
];

interface coolStuff {
    match: boolean;
    detected: Rating[];
}

function checkCameraMention(msg: string): coolStuff {
    const check = findBestMatch(msg, camera_words)
    const match = check.ratings.some((rating) => rating.rating > 0.4)
    console.log(match)
    return ({
        match,
        detected: check.ratings
    });
}

export async function suggestionsCategoryHandler(
    message: Discord.Message,
) {
    if (!message.member) return;
    if (message.author.system || message.author.bot) return;
    if (message.content.length === 0) return;
    const isStaff = message.member.roles.cache.has(bot_staff_role_id)
    /* don't allow staff to create suggestions */
    if (isStaff && !message.content.startsWith('!s ')) {
        return;
    }

    const suggestions_channel = message.channel;
    const check = checkCameraMention(message.content)
    const highest = check.detected.sort((a, b) => a.rating - b.rating)
    if (check.match) {
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
                    footer: {
                        text: `Detected: ${highest[0].target}, ${highest[0].rating}`
                    }
                }),
            ],
        });
        let msg = ''
        highest.forEach((rate) => {
            msg = msg + ` ${rate.rating}/${rate.target}`
        })
        if (!message.channel.isSendable()) return;
        const ratingmsg = await message.channel.send({
            content: msg
        })
        message.delete();
        setTimeout(() => {
            camera_message.delete();
            ratingmsg.delete()
        }, 30_000);
        return;
    }

    /* suggestion text */
    let suggestion_text: string = message.content
    if (isStaff) suggestion_text = suggestion_text.slice(3);
    console.log(suggestion_text)
    suggestion_text = ellipseString(suggestion_text, 1000);
    console.log(suggestion_text)

    /* suggestion embed */
    if (!suggestions_channel.isSendable()) return;
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
