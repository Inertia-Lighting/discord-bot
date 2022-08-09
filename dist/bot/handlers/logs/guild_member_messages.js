/* Copyright © Inertia Lighting | All Rights Reserved */
//---------------------------------------------------------------------------------------------------------------//
'use strict';
//---------------------------------------------------------------------------------------------------------------//
const { Discord, client } = require('../../discord_client.js');
const { string_ellipses, getMarkdownFriendlyTimestamp } = require('../../../utilities.js');
//---------------------------------------------------------------------------------------------------------------//
const logging_channel_id = process.env.BOT_LOGGING_CHANNEL_ID;
if (typeof logging_channel_id !== 'string')
    throw new TypeError('logging_channel_id is not a string');
//---------------------------------------------------------------------------------------------------------------//
/**
 * @param {Discord.Message} old_message
 * @param {Discord.Message} new_message
 */
async function guildMemberMessageUpdateLogger(old_message, new_message) {
    if (new_message.author.bot)
        return;
    if (new_message.author.system)
        return;
    if (old_message.content === new_message.content)
        return;
    const logging_channel = await client.channels.fetch(logging_channel_id);
    if (!(logging_channel instanceof Discord.TextChannel))
        throw new Error('Failed to fetch logging channel');
    const message_update_timestamp = getMarkdownFriendlyTimestamp(new_message.editedTimestamp);
    await logging_channel.send({
        embeds: [
            new Discord.MessageEmbed({
                color: 0xFFFF00,
                description: `**A message sent by <@${new_message.author.id}> in <#${new_message.channelId}> was modified.**`,
                fields: [
                    {
                        name: 'Message',
                        value: `[${new_message.id}](${new_message.url})`,
                        inline: false,
                    }, {
                        name: 'Author',
                        value: `@${new_message.author.tag} (${new_message.author.id})`,
                        inline: false,
                    }, {
                        name: 'Modified',
                        value: `<t:${message_update_timestamp}:F> (<t:${message_update_timestamp}:R>)`,
                        inline: false,
                    }, {
                        name: 'Before',
                        value: old_message.content.length > 0 ? string_ellipses(Discord.Util.escapeMarkdown(old_message.content), 2048) : '\`n/a\`',
                        inline: false,
                    }, {
                        name: 'After',
                        value: new_message.content.length > 0 ? string_ellipses(Discord.Util.escapeMarkdown(new_message.content), 2048) : '\`n/a\`',
                        inline: false,
                    },
                ],
            }),
        ],
    }).catch(console.trace);
}
/**
 * @param {Discord.Message} message
 */
async function guildMemberMessageDeleteLogger(message) {
    if (message.author.bot)
        return;
    if (message.author.system)
        return;
    const logging_channel = await client.channels.fetch(logging_channel_id);
    if (!(logging_channel instanceof Discord.TextChannel))
        throw new Error('Failed to fetch logging channel');
    const message_delete_timestamp = getMarkdownFriendlyTimestamp(Date.now());
    await logging_channel.send({
        embeds: [
            new Discord.MessageEmbed({
                color: 0xFF5500,
                description: `**A message sent by <@${message.author.id}> in <#${message.channelId}> was deleted.**`,
                fields: [
                    {
                        name: 'Message',
                        value: `[${message.id}](${message.url})`,
                        inline: false,
                    }, {
                        name: 'Author',
                        value: `@${message.author.tag} (${message.author.id})`,
                        inline: false,
                    }, {
                        name: 'Deleted',
                        value: `<t:${message_delete_timestamp}:F> (<t:${message_delete_timestamp}:R>)`,
                    }, {
                        name: 'Content',
                        value: message.content.length > 0 ? string_ellipses(Discord.Util.escapeMarkdown(message.content), 2048) : '\`n/a\`',
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
//# sourceMappingURL=guild_member_messages.js.map