/* Copyright © Inertia Lighting | All Rights Reserved */

//---------------------------------------------------------------------------------------------------------------//

'use strict';

//---------------------------------------------------------------------------------------------------------------//

const { Discord, client } = require('../../discord_client.js');

//---------------------------------------------------------------------------------------------------------------//

const logging_channel_id = process.env.BOT_LOGGING_CHANNEL_ID;
if (typeof logging_channel_id !== 'string') throw new TypeError('logging_channel_id is not a string');

//---------------------------------------------------------------------------------------------------------------//

/**
 * @param {Discord.GuildMember} old_member
 * @param {Discord.GuildMember} new_member
 */
async function guildMemberRolesAddedLogger(old_member, new_member) {
    if (!(old_member instanceof Discord.GuildMember)) throw new TypeError('guildMemberRolesAddedLogger(): old_member is not a GuildMember');
    if (!(new_member instanceof Discord.GuildMember)) throw new TypeError('guildMemberRolesAddedLogger(): new_member is not a GuildMember');

    const logging_channel = await client.channels.fetch(logging_channel_id);
    if (!logging_channel) throw new Error('Failed to fetch logging channel');

    const roles_added = new_member.roles.cache.filter(role => !old_member.roles.cache.has(role.id));

    await logging_channel.send({
        embeds: [
            new Discord.MessageEmbed({
                color: 0x00FF00,
                title: `@${new_member.user.tag} (${new_member.user.id})`,
                description: [
                    '**Roles added:**',
                    ...roles_added.map(role => `**${role.name}** (${role.id})`),
                ].join('\n'),
            }),
        ],
    }).catch(console.trace);
}

/**
 * @param {Discord.GuildMember} old_member
 * @param {Discord.GuildMember} new_member
 */
 async function guildMemberRolesRemovedLogger(old_member, new_member) {
    if (!(old_member instanceof Discord.GuildMember)) throw new TypeError('guildMemberRolesRemovedLogger(): old_member is not a GuildMember');
    if (!(new_member instanceof Discord.GuildMember)) throw new TypeError('guildMemberRolesRemovedLogger(): new_member is not a GuildMember');

    const logging_channel = await client.channels.fetch(logging_channel_id);
    if (!logging_channel) throw new Error('Failed to fetch logging channel');

    const roles_removed = old_member.roles.cache.filter(role => !new_member.roles.cache.has(role.id));

    await logging_channel.send({
        embeds: [
            new Discord.MessageEmbed({
                color: 0xFFFF00,
                title: `@${new_member.user.tag} (${new_member.user.id})`,
                description: [
                    '**Roles removed:**',
                    ...roles_removed.map(role => `**${role.name}** (${role.id})`),
                ].join('\n'),
            }),
        ],
    }).catch(console.trace);
}

//---------------------------------------------------------------------------------------------------------------//

module.exports = {
    guildMemberRolesAddedLogger,
    guildMemberRolesRemovedLogger,
};
