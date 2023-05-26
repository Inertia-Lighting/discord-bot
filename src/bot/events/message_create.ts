//------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
//------------------------------------------------------------//

//---------------------------------------------------------------------------------------------------------------//

import { Discord, client } from '../discord_client';

import { automatedQuickSupportHandler } from '../handlers/automated_quick_support_handler';

import { suggestionsCategoryHandler } from '../handlers/suggestions_category_handler';

// import { oneWordStoryChannelHandler } from '../handlers/one_word_story_channel_handler';

import { commandHandler } from '../handlers/command_handler';

//---------------------------------------------------------------------------------------------------------------//

const command_prefix = process.env.BOT_COMMAND_PREFIX as string;

const suggestions_category_id = process.env.BOT_SUGGESTIONS_CATEGORY_ID as string;

// const one_word_story_channel_id = process.env.BOT_ONE_WORD_STORY_CHANNEL_ID as string;

//---------------------------------------------------------------------------------------------------------------//

export default {
    name: Discord.Events.MessageCreate,
    async handler(message: Discord.Message) {
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

        // /* handle messages sent in the one-word-story channel */
        // if (message.channel.id === one_word_story_channel_id) {
        //     oneWordStoryChannelHandler(message);
        //     return;
        // }

        /* respond to mentions of this bot */
        if (message.content.startsWith(`<@!${client.user!.id}>`)) {
            message.reply({
                content: [
                    `The command_prefix for me is \`${command_prefix}\`.`,
                    `To see a list of commands do \`${command_prefix}help\`!`,
                ].join('\n'),
            }).catch(console.warn);
            return;
        }

        /* handle commands */
        const command_prefix_regex = new RegExp(`^${command_prefix}[a-z0-9_-]+`, 'i');
        const message_starts_with_command_prefix = command_prefix_regex.test(message.cleanContent);
        if (message_starts_with_command_prefix) {
            commandHandler(message);
            return;
        }

        /* attempt automated quick support */
        automatedQuickSupportHandler(message).catch(console.trace);
    },
};
