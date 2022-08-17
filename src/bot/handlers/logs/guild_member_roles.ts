/* Copyright © Inertia Lighting | All Rights Reserved */

//---------------------------------------------------------------------------------------------------------------//

import { Discord, client } from '../../discord_client';

//---------------------------------------------------------------------------------------------------------------//

const logging_channel_id = process.env.BOT_LOGGING_CHANNEL_ID as string;
if (typeof logging_channel_id !== 'string') throw new TypeError('logging_channel_id is not a string');

//---------------------------------------------------------------------------------------------------------------//

async function guildMemberRolesAddedLogger(
    old_member: Discord.GuildMember,
    new_member: Discord.GuildMember,
) {
    if (!(old_member instanceof Discord.GuildMember)) throw new TypeError('guildMemberRolesAddedLogger(): old_member is not a GuildMember');
    if (!(new_member instanceof Discord.GuildMember)) throw new TypeError('guildMemberRolesAddedLogger(): new_member is not a GuildMember');

    const logging_channel = await client.channels.fetch(logging_channel_id);
    if (!logging_channel) throw new Error('Failed to fetch logging channel');
    if (!logging_channel.isTextBased()) throw new TypeError('logging_channel is not a text channel');

    const roles_added = new_member.roles.cache.filter(role => !old_member.roles.cache.has(role.id));

    await logging_channel.send({
        embeds: [
            new Discord.MessageEmbed({
                color: 0x00FF00,
                description: `**Roles were added to ${new_member}.**`,
                fields: [
                    {
                        name: 'Member',
                        value: `@${new_member.user.tag} (${new_member.user.id})`,
                        inline: false,
                    }, {
                        name: 'Roles added',
                        value: roles_added.map(role => `<@&${role.id}>`).join('\n'),
                        inline: false,
                    },
                ],
            }),
        ],
    }).catch(console.trace);
}

async function guildMemberRolesRemovedLogger(
    old_member: Discord.GuildMember,
    new_member: Discord.GuildMember,
) {
    if (!(old_member instanceof Discord.GuildMember)) throw new TypeError('guildMemberRolesRemovedLogger(): old_member is not a GuildMember');
    if (!(new_member instanceof Discord.GuildMember)) throw new TypeError('guildMemberRolesRemovedLogger(): new_member is not a GuildMember');

    const logging_channel = await client.channels.fetch(logging_channel_id);
    if (!logging_channel) throw new Error('Failed to fetch logging channel');
    if (!logging_channel.isTextBased()) throw new TypeError('logging_channel is not a text channel');

    const roles_removed = old_member.roles.cache.filter(role => !new_member.roles.cache.has(role.id));

    await logging_channel.send({
        embeds: [
            new Discord.MessageEmbed({
                color: 0xFFFF00,
                description: `**Roles were removed from ${old_member}.**`,
                fields: [
                    {
                        name: 'Member',
                        value: `@${new_member.user.tag} (${new_member.user.id})`,
                        inline: false,
                    }, {
                        name: 'Roles removed',
                        value: roles_removed.map(role => `<@&${role.id}>`).join('\n'),
                        inline: false,
                    },
                ],
            }),
        ],
    }).catch(console.trace);
}

//---------------------------------------------------------------------------------------------------------------//

export {
    guildMemberRolesAddedLogger,
    guildMemberRolesRemovedLogger,
};
