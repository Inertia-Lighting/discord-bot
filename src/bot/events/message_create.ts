//------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
//------------------------------------------------------------//

import { Discord, client } from '../discord_client';

import { automatedQuickSupportHandler } from '../handlers/automated_quick_support_handler';

import { suggestionsCategoryHandler } from '../handlers/suggestions_category_handler';

//------------------------------------------------------------//

const suggestions_category_id = process.env.BOT_SUGGESTIONS_CATEGORY_ID as string;

//------------------------------------------------------------//

export default {
    name: Discord.Events.MessageCreate,
    async handler(
        message: Discord.Message,
    ) {
        /* don't allow bots */
        if (message.author.bot) return;

        /* don't allow system accounts */
        if (message.author.system) return;

        /* only allow messages from inside of a guild */
        if (!message.inGuild()) return;

        /* only allow text channels */
        if (!message.channel.isTextBased()) return;

        /* handle messages sent in suggestions channels */
        if (message.channel.parent?.id === suggestions_category_id) {
            suggestionsCategoryHandler(message);
            return;
        }

        /* respond to mentions of this bot */
        if (message.content.startsWith(`<@!${client.user!.id}>`)) {
            message.reply({
                content: [
                    'To see a list of commands do \`/help\`!',
                ].join('\n'),
            }).catch(console.warn);
            return;
        }

        /* attempt automated quick support */
        automatedQuickSupportHandler(message).catch(console.trace);
    },
};
