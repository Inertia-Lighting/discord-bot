/* Copyright © Inertia Lighting | All Rights Reserved */

//---------------------------------------------------------------------------------------------------------------//

'use strict';

//---------------------------------------------------------------------------------------------------------------//

const { command_permission_levels } = require('../common/bot.js');

//---------------------------------------------------------------------------------------------------------------//

module.exports = {
    name: 'ban',
    description: 'bans a user from the server',
    usage: '@mention reason',
    aliases: ['ban'],
    permission_level: command_permission_levels.MODERATORS,
    cooldown: 2_000,
    async execute(message, args) {
        const { command_args } = args;

        const staff_member = message.member;
        const member_lookup_query = message.mentions.members.first()?.id ?? command_args[0];
        const member = message.guild.members.resolve(member_lookup_query);
        const reason = command_args.slice(1).join(' ').trim() || 'no reason was specified';

        /* handle when a member is not specified */
        if (!member) {
            await message.reply('You need to specify a user when using this command!').catch(console.warn);
            return;
        }

        /* handle when a staff member specifies themself */
        if (staff_member.id === member.id) {
            await message.reply('You aren\'t allowed to ban yourself!').catch(console.warn);
            return;
        }

        /* handle when a staff member specifies the guild owner */
        if (member.id === message.guild.ownerID) {
            await message.reply('You aren\'t allowed to ban the owner of this server!');
            return;
        }

        /* handle when a staff member tries to moderate someone with an equal/higher role */
        if (staff_member.roles.highest.comparePositionTo(member.roles.highest) <= 0) {
            await message.reply('You aren\'t allowed to ban someone with an equal/higher role!').catch(console.warn);
            return;
        }

        const moderation_message_contents = [
            `${member}`,
            `You were banned from the Inertia Lighting Discord by ${staff_member.user} for:`,
            '\`\`\`',
            `${reason}`,
            '\`\`\`',
        ].join('\n');

        /* dm the member */
        try {
            const dm_channel = await member.createDM();
            await dm_channel.send(moderation_message_contents);
        } catch {
            // ignore any errors
        }

        /* message the member in the server */
        await message.channel.send(moderation_message_contents).catch(console.warn);

        /* perform the moderation action on the member */
        try {
            await member.ban({ reason: reason });
        } catch (error) {
            console.trace(error);
            await message.reply('Failed to ban that member!').catch(console.warn);
            return;
        }
    },
};
