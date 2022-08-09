/* Copyright © Inertia Lighting | All Rights Reserved */
//---------------------------------------------------------------------------------------------------------------//
'use strict';
//---------------------------------------------------------------------------------------------------------------//
const { Discord, client } = require('../discord_client.js');
const { command_permission_levels } = require('../common/bot.js');
const { userProfileHandler } = require('../handlers/user_profile_handler.js');
//---------------------------------------------------------------------------------------------------------------//
module.exports = {
    name: 'profile',
    description: 'displays a user\'s profile',
    usage: '[user_mention]',
    aliases: ['profile'],
    permission_level: command_permission_levels.PUBLIC,
    cooldown: 5_000,
    async execute(message, args) {
        const { command_prefix, command_name, command_args } = args;
        const user_lookup_query = message.mentions.users.first()?.id ?? command_args[0] ?? '';
        /** @type {Discord.User?} */
        const user = client.users.cache.get(user_lookup_query) ?? message.author;
        if (user_lookup_query.length > 0 && !user) {
            await message.channel.send({
                embeds: [
                    new Discord.MessageEmbed({
                        color: 0xFFFF00,
                        author: {
                            iconURL: `${client.user.displayAvatarURL({ dynamic: true })}`,
                            name: 'Inertia Lighting | User Profiles',
                        },
                        title: 'Invalid User Mention',
                        description: [
                            'Please provide a valid @user mention to view their profile!',
                            '',
                            'Example:',
                            `> ${command_prefix}${command_name} <@!163646957783482370>`,
                        ].join('\n'),
                    }),
                ],
            }).catch(console.warn);
        }
        userProfileHandler(message, user.id);
    },
};
//# sourceMappingURL=profile.js.map