/* Copyright © Inertia Lighting | All Rights Reserved */

//---------------------------------------------------------------------------------------------------------------//

'use strict';

//---------------------------------------------------------------------------------------------------------------//

const { Discord, client } = require('../../discord_client.js');

//---------------------------------------------------------------------------------------------------------------//

const member_retention_logging_channel_id = process.env.BOT_LOGGING_USER_RETENTION_CHANNEL_ID;
if (typeof member_retention_logging_channel_id !== 'string') throw new TypeError('member_retention_logging_channel_id is not a string');

//---------------------------------------------------------------------------------------------------------------//

/**
 * @param {number} timestamp timestamp in milliseconds
 * @returns {string} base 10 timestamp in seconds
 */
function getMarkdownFriendlyTimestamp(timestamp) {
    if (typeof timestamp !== 'number') throw new TypeError('getMarkdownFriendlyTimestamp(): timestamp is not a number');

    return Math.floor(timestamp / 1000).toString(10);
}

//---------------------------------------------------------------------------------------------------------------//

/**
 * @param {Discord.GuildMember} member
 */
async function guildMemberAddLogger(member) {
    if (!(member instanceof Discord.GuildMember)) throw new TypeError('guildMemberAddLogger(): member is not a GuildMember');

    const member_retention_logging_channel = await client.channels.fetch(member_retention_logging_channel_id);
    if (!member_retention_logging_channel) throw new Error('Failed to fetch logging channel');

    const user_creation_timestamp = getMarkdownFriendlyTimestamp(member.user.createdTimestamp);
    const member_joined_timestamp = getMarkdownFriendlyTimestamp(member.joinedTimestamp);

    await member_retention_logging_channel.send({
        embeds: [
            new Discord.MessageEmbed({
                color: 0x00FF00,
                title: `@${member.user.tag} (${member.user.id})`,
                description: [
                    `**Creation:** <t:${user_creation_timestamp}:F> (<t:${user_creation_timestamp}:R>)`,
                    `**Joined:** <t:${member_joined_timestamp}:F> (<t:${member_joined_timestamp}:R>)`,
                ].join('\n'),
            }),
        ],
    }).catch(console.trace);
}

/**
 * @param {Discord.GuildMember} member
 */
 async function guildMemberRemoveLogger(member) {
    if (!(member instanceof Discord.GuildMember)) throw new TypeError('guildMemberRemoveLogger(): member is not a GuildMember');

    const member_retention_logging_channel = await client.channels.fetch(member_retention_logging_channel_id);
    if (!member_retention_logging_channel) throw new Error('Failed to fetch logging channel');

    const user_creation_timestamp = getMarkdownFriendlyTimestamp(member.user.createdTimestamp);
    const member_joined_timestamp = getMarkdownFriendlyTimestamp(member.joinedTimestamp);
    const member_left_timestamp = getMarkdownFriendlyTimestamp(Date.now());

    await member_retention_logging_channel.send({
        embeds: [
            new Discord.MessageEmbed({
                color: 0xFFFF00,
                title: `@${member.user.tag} (${member.user.id})`,
                description: [
                    `**Creation:** <t:${user_creation_timestamp}:F> (<t:${user_creation_timestamp}:R>)`,
                    `**Joined:** <t:${member_joined_timestamp}:F> (<t:${member_joined_timestamp}:R>)`,
                    `**Left:** <t:${member_left_timestamp}:F> (<t:${member_left_timestamp}:R>)`,
                ].join('\n'),
            }),
        ],
    }).catch(console.trace);
}

//---------------------------------------------------------------------------------------------------------------//

module.exports = {
    guildMemberAddLogger,
    guildMemberRemoveLogger,
};
