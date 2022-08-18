//------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
//------------------------------------------------------------//

//---------------------------------------------------------------------------------------------------------------//

import { Discord, client } from '../discord_client';

import { command_permission_levels } from '../common/bot';

import { userProfileHandler } from '../handlers/user_profile_handler';

import { CustomEmbed } from '../common/message';

//---------------------------------------------------------------------------------------------------------------//

export default {
    name: 'profile',
    description: 'displays a user\'s profile',
    usage: '[user_mention]',
    aliases: ['profile'],
    permission_level: command_permission_levels.PUBLIC,
    cooldown: 1_500,
    async execute(
        message: Discord.Message<true>,
        args: {
            [key: string]: unknown;
            command_args: string[];
        },
    ) {
        const { command_prefix, command_name, command_args } = args;

        const user_lookup_query = message.mentions.users.first()?.id ?? command_args[0] ?? '';

        /** @type {Discord.User?} */
        const user = client.users.cache.get(user_lookup_query) ?? message.author;

        if (user_lookup_query.length > 0 && !user) {
            await message.channel.send({
                embeds: [
                    CustomEmbed.from({
                        color: CustomEmbed.colors.YELLOW,
                        author: {
                            icon_url: `${client.user!.displayAvatarURL({ forceStatic: false })}`,
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
