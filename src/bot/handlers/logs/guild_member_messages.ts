//------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
//------------------------------------------------------------//

import { Discord, client } from '../../discord_client';

import { getMarkdownFriendlyTimestamp, string_ellipses } from '../../../utilities';

import { CustomEmbed } from '@root/bot/common/message';

//------------------------------------------------------------//

const logging_channel_id = process.env.BOT_LOGGING_CHANNEL_ID as string;
if (typeof logging_channel_id !== 'string') throw new TypeError('logging_channel_id is not a string');

//------------------------------------------------------------//

export async function guildMemberMessageUpdateLogger(
    old_message: Discord.Message,
    new_message: Discord.Message,
) {
    if (new_message.author.bot) return;
    if (new_message.author.system) return;
    if (old_message.content === new_message.content) return;

    const logging_channel = await client.channels.fetch(logging_channel_id);
    if (!(logging_channel instanceof Discord.TextChannel)) throw new Error('Failed to fetch logging channel');

    const message_update_timestamp = getMarkdownFriendlyTimestamp(new_message.editedTimestamp ?? Date.now());

    const old_message_attachments_list = old_message.attachments.map(
        (attachment) => `\`${attachment.name}\` - [link](${attachment.url})`
    );

    const new_message_attachments_list = new_message.attachments.map(
        (attachment) => `\`${attachment.name}\` - [link](${attachment.url})`
    );

    await logging_channel.send({
        embeds: [
            CustomEmbed.from({
                color: CustomEmbed.Color.Yellow,
                description: `**A message sent by <@${new_message.author.id}> in <#${new_message.channelId}> was modified.**`,
                fields: [
                    {
                        name: 'Message',
                        value: `[${new_message.id}](${new_message.url})`,
                        inline: false,
                    }, {
                        name: 'Author',
                        value: `@${new_message.author.username} (${new_message.author.id})`,
                        inline: false,
                    }, {
                        name: 'Modified',
                        value: `<t:${message_update_timestamp}:F> (<t:${message_update_timestamp}:R>)`,
                        inline: false,
                    }, {
                        name: 'Content Before',
                        value: old_message.content.length > 0 ? string_ellipses(Discord.escapeMarkdown(old_message.content), 2048) : '\`n/a\`',
                        inline: false,
                    }, {
                        name: 'Content After',
                        value: new_message.content.length > 0 ? string_ellipses(Discord.escapeMarkdown(new_message.content), 2048) : '\`n/a\`',
                        inline: false,
                    }, {
                        name: 'Attachments Before',
                        value: old_message_attachments_list.length > 0 ? old_message_attachments_list.join('\n') : '\`n/a\`',
                        inline: false,
                    }, {
                        name: 'Attachments After',
                        value: new_message_attachments_list.length > 0 ? new_message_attachments_list.join('\n') : '\`n/a\`',
                        inline: false,
                    },
                ],
            }),
        ],
    }).catch(console.trace);
}

export async function guildMemberMessageDeleteLogger(
    message: Discord.Message,
) {
    if (message.author.bot) return;
    if (message.author.system) return;

    const logging_channel = await client.channels.fetch(logging_channel_id);
    if (!(logging_channel instanceof Discord.TextChannel)) throw new Error('Failed to fetch logging channel');

    const message_delete_timestamp = getMarkdownFriendlyTimestamp(Date.now());

    const message_attachments_list = message.attachments.map(
        (attachment) => `\`${attachment.name}\` - [link](${attachment.url})`
    );

    await logging_channel.send({
        embeds: [
            CustomEmbed.from({
                color: CustomEmbed.Color.Orange,
                description: `**A message sent by <@${message.author.id}> in <#${message.channelId}> was deleted.**`,
                fields: [
                    {
                        name: 'Message',
                        value: `[${message.id}](${message.url})`,
                        inline: false,
                    }, {
                        name: 'Author',
                        value: `@${message.author.username} (${message.author.id})`,
                        inline: false,
                    }, {
                        name: 'Deleted',
                        value: `<t:${message_delete_timestamp}:F> (<t:${message_delete_timestamp}:R>)`,
                    }, {
                        name: 'Content',
                        value: message.content.length > 0 ? string_ellipses(Discord.escapeMarkdown(message.content), 2048) : '\`n/a\`',
                        inline: false,
                    }, {
                        name: 'Attachments',
                        value: message_attachments_list.length > 0 ? message_attachments_list.join('\n') : '\`n/a\`',
                        inline: false,
                    },
                ],
            }),
        ],
    }).catch(console.trace);
}
