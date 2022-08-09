/* Copyright © Inertia Lighting | All Rights Reserved */
//---------------------------------------------------------------------------------------------------------------//
'use strict';
//---------------------------------------------------------------------------------------------------------------//
const { Discord, client } = require('../../discord_client.js');
const { getMarkdownFriendlyTimestamp } = require('../../../utilities.js');
//---------------------------------------------------------------------------------------------------------------//
const member_retention_logging_channel_id = process.env.BOT_LOGGING_USER_RETENTION_CHANNEL_ID;
if (typeof member_retention_logging_channel_id !== 'string')
    throw new TypeError('member_retention_logging_channel_id is not a string');
//---------------------------------------------------------------------------------------------------------------//
/**
 * @param {Discord.GuildMember} member
 */
async function guildMemberAddLogger(member) {
    if (!(member instanceof Discord.GuildMember))
        throw new TypeError('guildMemberAddLogger(): member is not a GuildMember');
    const member_retention_logging_channel = await client.channels.fetch(member_retention_logging_channel_id);
    if (!member_retention_logging_channel)
        throw new Error('Failed to fetch logging channel');
    const user_creation_timestamp = getMarkdownFriendlyTimestamp(member.user.createdTimestamp);
    const member_joined_timestamp = getMarkdownFriendlyTimestamp(member.joinedTimestamp);
    await member_retention_logging_channel.send({
        embeds: [
            new Discord.MessageEmbed({
                color: 0x00FF00,
                title: 'A member has joined the server!',
                fields: [
                    {
                        name: 'Member',
                        value: `@${member.user.tag} (${member.user.id})`,
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
/**
 * @param {Discord.GuildMember} member
 */
async function guildMemberRemoveLogger(member) {
    if (!(member instanceof Discord.GuildMember))
        throw new TypeError('guildMemberRemoveLogger(): member is not a GuildMember');
    const member_retention_logging_channel = await client.channels.fetch(member_retention_logging_channel_id);
    if (!member_retention_logging_channel)
        throw new Error('Failed to fetch logging channel');
    const user_creation_timestamp = getMarkdownFriendlyTimestamp(member.user.createdTimestamp);
    const member_joined_timestamp = getMarkdownFriendlyTimestamp(member.joinedTimestamp);
    const member_left_timestamp = getMarkdownFriendlyTimestamp(Date.now());
    await member_retention_logging_channel.send({
        embeds: [
            new Discord.MessageEmbed({
                color: 0xFFFF00,
                title: 'A member has left the server!',
                fields: [
                    {
                        name: 'Member',
                        value: `@${member.user.tag} (${member.user.id})`,
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
                        value: `${Math.floor((member_left_timestamp - member_joined_timestamp) / (60 * 60 * 24))} days`,
                    },
                ],
            }),
        ],
    }).catch(console.trace);
}
//---------------------------------------------------------------------------------------------------------------//
module.exports = {
    guildMemberAddLogger,
    guildMemberRemoveLogger,
};
//# sourceMappingURL=guild_member_retention.js.map