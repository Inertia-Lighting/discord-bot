// ------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
// ------------------------------------------------------------//

import * as Discord from 'discord.js';

import { automatedQuickSupportHandler, suggestionsCategoryHandler } from '@/common/handlers/index.js';
import config from '@/utilities/bot_config.js';

// ------------------------------------------------------------//

export default {
    name: Discord.Events.MessageCreate,
    async handler(client: Discord.Client, message: Discord.Message) {
        /* don't allow bots */
        if (message.author.bot) return;

        /* don't allow system accounts */
        if (message.author.system) return;

        /* only allow messages from inside of a guild */
        if (!message.inGuild()) return;

        /* only allow messages from inside of the bot guild */
        if (message.guild.id !== config.guild_id) return;

        /* only allow text channels */
        if (!message.channel.isTextBased()) return;

        /* handle messages sent in suggestions channels */
        if (message.channel.parent?.id === config.suggestions_category_id) {
            suggestionsCategoryHandler(message);
            return;
        }

        /* respond to mentions of this bot */
        if (message.content.startsWith(Discord.userMention(message.client.user.id))) {
            await message
                .reply({
                    content: ['To see a list of commands do /help!'].join('\n'),
                })
                .catch(console.warn);

            return;
        }

        /* attempt automated quick support */
        automatedQuickSupportHandler(message).catch(console.trace);
    },
};
