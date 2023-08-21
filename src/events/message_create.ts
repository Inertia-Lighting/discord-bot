//------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
//------------------------------------------------------------//

import * as Discord from 'discord.js';

import { automatedQuickSupportHandler, suggestionsCategoryHandler } from '@root/common/handlers';

//------------------------------------------------------------//

const bot_guild_id = `${process.env.BOT_GUILD_ID ?? ''}`;
if (bot_guild_id.length < 1) throw new Error('environment variable: BOT_GUILD_ID; was not properly set or is empty');

const suggestions_category_id = `${process.env.BOT_SUGGESTIONS_CATEGORY_ID ?? ''}`;
if (suggestions_category_id.length < 1) throw new Error('environment variable: BOT_SUGGESTIONS_CATEGORY_ID; was not properly set or is empty');

//------------------------------------------------------------//

export default {
    name: Discord.Events.MessageCreate,
    async handler(
        client: Discord.Client,
        message: Discord.Message,
    ) {
        /* don't allow bots */
        if (message.author.bot) return;

        /* don't allow system accounts */
        if (message.author.system) return;

        /* only allow messages from inside of a guild */
        if (!message.inGuild()) return;

        /* only allow messages from inside of the bot guild */
        if (message.guild.id !== bot_guild_id) return;

        /* only allow text channels */
        if (!message.channel.isTextBased()) return;

        /* handle messages sent in suggestions channels */
        if (message.channel.parent?.id === suggestions_category_id) {
            suggestionsCategoryHandler(message);
            return;
        }

        /* respond to mentions of this bot */
        if (
            message.content.startsWith(
                Discord.userMention(message.client.user.id)
            )
        ) {
            await message.reply({
                content: [
                    'To see a list of commands do \`/help\`!',
                ].join('\n'),
            }).catch(console.warn);

            return;
        }

        /* attempt automated quick support */
        automatedQuickSupportHandler(message).catch(console.trace);

        if (message.content.toLowerCase().includes('can i ask a question')) {
            const guild_staff_role_id = `${process.env.BOT_STAFF_ROLE_ID ?? ''}`;
            if (guild_staff_role_id.length < 1) throw new Error('Environment variable: BOT_STAFF_ROLE_ID; was not set correctly!');
            if (message.member && !message.member.roles.cache.has(guild_staff_role_id)) {
                message.reply({ content: 'Hey, instead of asking if you can ask a question, ask the question. This ensures that you get quick support on whatever you need. This also helps our support staff and those that try to support you by letting them know what your question is. \n [Learn More](https://nohello.net)' });
            }
        }

    },
};
