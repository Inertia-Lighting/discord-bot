//------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
//------------------------------------------------------------//

//---------------------------------------------------------------------------------------------------------------//

import { Discord, client } from '../../discord_client';

import { getMarkdownFriendlyTimestamp } from '../../../utilities';

import { CustomEmbed } from '@root/bot/common/message';

//---------------------------------------------------------------------------------------------------------------//

const member_retention_logging_channel_id = process.env.BOT_LOGGING_USER_RETENTION_CHANNEL_ID as string;
if (typeof member_retention_logging_channel_id !== 'string') throw new TypeError('member_retention_logging_channel_id is not a string');

//---------------------------------------------------------------------------------------------------------------//

async function guildMemberAddLogger(member: Discord.GuildMember) {
    if (!(member instanceof Discord.GuildMember)) throw new TypeError('guildMemberAddLogger(): member is not a GuildMember');

    const member_retention_logging_channel = await client.channels.fetch(member_retention_logging_channel_id);
    if (!member_retention_logging_channel) throw new Error('Failed to fetch logging channel');
    if (!member_retention_logging_channel.isTextBased()) throw new TypeError('member_retention_logging_channel is not a text channel');

    const user_creation_timestamp = getMarkdownFriendlyTimestamp(member.user.createdTimestamp);
    const member_joined_timestamp = getMarkdownFriendlyTimestamp(member.joinedTimestamp ?? Date.now());

    await member_retention_logging_channel.send({
        embeds: [
            CustomEmbed.from({
                color: CustomEmbed.colors.GREEN,
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

async function guildMemberRemoveLogger(member: Discord.GuildMember) {
    if (!(member instanceof Discord.GuildMember)) throw new TypeError('guildMemberRemoveLogger(): member is not a GuildMember');

    const member_retention_logging_channel = await client.channels.fetch(member_retention_logging_channel_id);
    if (!member_retention_logging_channel) throw new Error('Failed to fetch logging channel');
    if (!member_retention_logging_channel.isTextBased()) throw new TypeError('member_retention_logging_channel is not a text channel');

    const user_creation_timestamp = getMarkdownFriendlyTimestamp(member.user.createdTimestamp);
    const member_joined_timestamp = getMarkdownFriendlyTimestamp(member.joinedTimestamp ?? Date.now());
    const member_left_timestamp = getMarkdownFriendlyTimestamp(Date.now());

    await member_retention_logging_channel.send({
        embeds: [
            CustomEmbed.from({
                color: CustomEmbed.colors.YELLOW,
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
                        value: `${Math.floor((Number.parseInt(member_left_timestamp, 10) - Number.parseInt(member_joined_timestamp, 10)) / (60 * 60 * 24))} days`,
                    },
                ],
            }),
        ],
    }).catch(console.trace);
}

//---------------------------------------------------------------------------------------------------------------//

export {
    guildMemberAddLogger,
    guildMemberRemoveLogger,
};
