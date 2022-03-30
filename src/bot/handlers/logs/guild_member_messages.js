/* Copyright © Inertia Lighting | All Rights Reserved */

//---------------------------------------------------------------------------------------------------------------//

'use strict';

//---------------------------------------------------------------------------------------------------------------//

const { Discord, client } = require('../../discord_client.js');

const { string_ellipses } = require('../../../utilities.js');

//---------------------------------------------------------------------------------------------------------------//

const logging_channel_id = process.env.BOT_LOGGING_CHANNEL_ID;
if (typeof logging_channel_id !== 'string') throw new TypeError('logging_channel_id is not a string');

//---------------------------------------------------------------------------------------------------------------//

/**
 * @param {Discord.Message} old_message
 * @param {Discord.Message} new_message
 */
async function guildMemberMessageUpdateLogger(old_message, new_message) {
    if (new_message.author.bot) return;
    if (new_message.author.system) return;
    if (old_message.content === new_message.content) return;

    const logging_channel = await client.channels.fetch(logging_channel_id);
    if (!(logging_channel instanceof Discord.TextChannel)) throw new Error('Failed to fetch logging channel');

    await logging_channel.send({
        embeds: [
            new Discord.MessageEmbed({
                color: 0xFFFF00,
                description: `A message was modified in <#${new_message.channelId}>.`,
                fields: [
                    {
                        name: 'Message',
                        value: `[${new_message.id}](${new_message.url})`,
                        inline: true,
                    }, {
                        name: 'Author',
                        value: `@${new_message.author.tag} (${new_message.author.id})`,
                        inline: true,
                    }, {
                        name: 'Before',
                        value: string_ellipses(old_message.content, 2048),
                        inline: false,
                    }, {
                        name: 'After',
                        value: string_ellipses(new_message.content, 2048),
                        inline: false,
                    },
                ],
                timestamp: Date.now(),
            }),
        ],
    }).catch(console.trace);
}

/**
 * @param {Discord.Message} message
 */
async function guildMemberMessageDeleteLogger(message) {
    if (message.author.bot) return;
    if (message.author.system) return;

    const logging_channel = await client.channels.fetch(logging_channel_id);
    if (!(logging_channel instanceof Discord.TextChannel)) throw new Error('Failed to fetch logging channel');

    await logging_channel.send({
        embeds: [
            new Discord.MessageEmbed({
                color: 0xFFFF00,
                description: `A message was deleted in <#${message.channelId}>.`,
                fields: [
                    {
                        name: 'Message',
                        value: '\`message.id\`',
                        inline: true,
                    }, {
                        name: 'Author',
                        value: `@${message.author.tag} (${message.author.id})`,
                        inline: true,
                    }, {
                        name: 'Content',
                        value: string_ellipses(message.content, 2048),
                        inline: false,
                    },
                ],
            }),
        ],
    }).catch(console.trace);
}

//---------------------------------------------------------------------------------------------------------------//

module.exports = {
    guildMemberMessageUpdateLogger,
    guildMemberMessageDeleteLogger,
};
