// ------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
// ------------------------------------------------------------//

import { CustomEmbed } from '@root/common/message';
import { getMarkdownFriendlyTimestamp } from '@root/utilities';
import * as Discord from 'discord.js';

// ------------------------------------------------------------//

const member_retention_logging_channel_id = process.env.BOT_LOGGING_USER_RETENTION_CHANNEL_ID as string;
if (typeof member_retention_logging_channel_id !== 'string') throw new TypeError('member_retention_logging_channel_id is not a string');

// ------------------------------------------------------------//

function discordTimestampsDifferenceInDays(
    newest_timestamp: number | string, // in seconds
    oldest_timestamp: number | string, // in seconds
) {
    // Math.floor() to round down to the nearest whole number of days
    // Math.abs() to not care about the order of the timestamps
    // 60 * 60 * 24 = 86400 seconds in a day

    const parsed_newest_timestamp = Number.parseInt(`${newest_timestamp}`, 10);
    const parsed_oldest_timestamp = Number.parseInt(`${oldest_timestamp}`, 10);

    return Math.floor(
        (parsed_newest_timestamp - parsed_oldest_timestamp) / (60 * 60 * 24)
    );
}

// ------------------------------------------------------------//

async function guildMemberAddLogger(
    member: Discord.GuildMember,
) {
    if (!(member instanceof Discord.GuildMember)) throw new TypeError('guildMemberAddLogger(): member is not a GuildMember');

    const client = member.guild.client;

    const member_retention_logging_channel = await client.channels.fetch(member_retention_logging_channel_id);
    if (!member_retention_logging_channel) throw new Error('Failed to fetch logging channel');
    if (!member_retention_logging_channel.isTextBased()) throw new TypeError('member_retention_logging_channel is not a text channel');
    if(!member_retention_logging_channel.isSendable()) throw new Error('member_retention_logging_channel is not sendable!');

    const user_creation_timestamp = getMarkdownFriendlyTimestamp(member.user.createdTimestamp);
    const member_joined_timestamp = getMarkdownFriendlyTimestamp(member.joinedTimestamp ?? Date.now());

    await member_retention_logging_channel.send({
        embeds: [
            CustomEmbed.from({
                color: CustomEmbed.Color.Green,
                title: 'A member has joined the server!',
                fields: [
                    {
                        name: 'Member',
                        value: `@${member.user.username} (${member.user.id})`,
                        inline: false,
                    }, {
                        name: 'Account creation date',
                        value: `<t:${user_creation_timestamp}:F> (<t:${user_creation_timestamp}:R>)`,
                    }, {
                        name: 'Account join date',
                        value: `<t:${member_joined_timestamp}:F> (<t:${member_joined_timestamp}:R>)`,
                    },
                ],
            }),
        ],
    }).catch(console.trace);
}

async function guildMemberRemoveLogger(
    member: Discord.GuildMember,
) {
    if (!(member instanceof Discord.GuildMember)) throw new TypeError('guildMemberRemoveLogger(): member is not a GuildMember');

    const client = member.guild.client;

    const member_retention_logging_channel = await client.channels.fetch(member_retention_logging_channel_id);
    if (!member_retention_logging_channel) throw new Error('Failed to fetch logging channel');
    if (!member_retention_logging_channel.isTextBased()) throw new TypeError('member_retention_logging_channel is not a text channel');
    if(!member_retention_logging_channel.isSendable()) throw new Error('member_retention_logging_channel is not sendable!');

    const user_creation_timestamp = getMarkdownFriendlyTimestamp(member.user.createdTimestamp);
    const member_joined_timestamp = getMarkdownFriendlyTimestamp(member.joinedTimestamp ?? Date.now());
    const member_left_timestamp = getMarkdownFriendlyTimestamp(Date.now());

    await member_retention_logging_channel.send({
        embeds: [
            CustomEmbed.from({
                color: CustomEmbed.Color.Yellow,
                title: 'A member has left the server!',
                fields: [
                    {
                        name: 'Member',
                        value: `@${member.user.username} (${member.user.id})`,
                        inline: false,
                    }, {
                        name: 'Account creation date',
                        value: `<t:${user_creation_timestamp}:F> (<t:${user_creation_timestamp}:R>)`,
                    }, {
                        name: 'Account join date',
                        value: `<t:${member_joined_timestamp}:F> (<t:${member_joined_timestamp}:R>)`,
                    }, {
                        name: 'Account leave date',
                        value: `<t:${member_left_timestamp}:F> (<t:${member_left_timestamp}:R>)`,
                    }, {
                        name: 'Account stayed for',
                        value: `${discordTimestampsDifferenceInDays(member_left_timestamp, member_joined_timestamp)} days`,
                    },
                ],
            }),
        ],
    }).catch(console.trace);
}

async function guildMemberBannedLogger(
    guild_ban: Discord.GuildBan,
) {
    if (!(guild_ban instanceof Discord.GuildBan)) throw new TypeError('guildMemberBannedLogger(): ban is not a GuildBan');

    const client = guild_ban.guild.client;

    const member_retention_logging_channel = await client.channels.fetch(member_retention_logging_channel_id);
    if (!member_retention_logging_channel) throw new Error('Failed to fetch logging channel');
    if (!member_retention_logging_channel.isTextBased()) throw new TypeError('member_retention_logging_channel is not a text channel');
    if(!member_retention_logging_channel.isSendable()) throw new Error('member_retention_logging_channel is not sendable!');

    const member_banned_timestamp = getMarkdownFriendlyTimestamp(Date.now());

    const ban_reason = guild_ban.reason ?? 'Unknown';

    await member_retention_logging_channel.send({
        embeds: [
            CustomEmbed.from({
                color: CustomEmbed.Color.Orange,
                title: 'A member has been banned from the server!',
                fields: [
                    {
                        name: 'User',
                        value: `@${guild_ban.user.username} (${guild_ban.user.id})`,
                        inline: false,
                    }, {
                        name: 'Banned date',
                        value: `<t:${member_banned_timestamp}:F> (<t:${member_banned_timestamp}:R>)`,
                    }, {
                        name: 'Banned for',
                        value: `\n${ban_reason}\n`,
                    },
                ],
            }),
        ],
    }).catch(console.trace);
}

// ------------------------------------------------------------//

export {
    guildMemberAddLogger,
    guildMemberBannedLogger,
    guildMemberRemoveLogger,
};
