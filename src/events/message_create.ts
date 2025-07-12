// ------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
// ------------------------------------------------------------//

import { automatedQuickSupportHandler, suggestionsCategoryHandler } from '@root/common/handlers';
import { loadSupportSystemConfig } from '@root/support_system/config';
import { handleTicketMessage } from '@root/support_system/core/message-handler';
import * as Discord from 'discord.js';

// ------------------------------------------------------------//

const bot_guild_id = `${process.env.BOT_GUILD_ID ?? ''}`;
if (bot_guild_id.length < 1) throw new Error('environment variable: BOT_GUILD_ID; was not properly set or is empty');

const suggestions_category_id = `${process.env.BOT_SUGGESTIONS_CATEGORY_ID ?? ''}`;
if (suggestions_category_id.length < 1) throw new Error('environment variable: BOT_SUGGESTIONS_CATEGORY_ID; was not properly set or is empty');

// Load support system config
const supportConfig = loadSupportSystemConfig();

// ------------------------------------------------------------//

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

        /* handle messages in support ticket channels */
        if (message.channel.parent?.id === supportConfig.channels.ticketsCategoryId) {
            await handleTicketMessage(message);
        }

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
                    'To see a list of commands do /help!',
                ].join('\n'),
            }).catch(console.warn);

            return;
        }

        /* attempt automated quick support */
        automatedQuickSupportHandler(message).catch(console.trace);
    },
};
