// ------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
// ------------------------------------------------------------//

import { automatedQuickSupportHandler, suggestionsCategoryHandler } from '@root/common/handlers';
import { loadSupportSystemConfig } from '@root/support_system/config';
import { getEscalationService } from '@root/support_system/core/escalation-service';
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
            await handleSupportTicketMessage(client, message);
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

/**
 * Handles messages in support ticket channels for priority tracking
 */
async function handleSupportTicketMessage(client: Discord.Client, message: Discord.Message): Promise<void> {
    try {
        if (!message.inGuild() || !message.member) return;
        
        const escalationService = getEscalationService(client);
        
        // Check if the message author is staff
        if (escalationService.isStaffMember(message.member)) {
            // Record staff response to stop escalation
            await escalationService.recordStaffResponse(message.channel.id, message.member);
        } else if (await isUserTicketOwner(message.channel, message.member)) {
            // Record user response to stop user pinging
            await escalationService.recordUserResponse(message.channel.id, message.member);
        }
    } catch (error) {
        console.error('Error handling support ticket message:', error);
    }
}

/**
 * Checks if a user is the owner of a ticket channel
 */
async function isUserTicketOwner(channel: Discord.TextBasedChannel, member: Discord.GuildMember): Promise<boolean> {
    if (!('name' in channel) || !channel.name) return false;
    
    const channelName = channel.name;
    
    // Remove priority emoji if present
    let baseName = channelName;
    const priorityEmojis = ['🟢', '🟡', '🔴'];
    for (const emoji of priorityEmojis) {
        if (channelName.startsWith(emoji + '-')) {
            baseName = channelName.substring(2);
            break;
        }
    }
    
    // Extract user ID from channel name (format: categoryId-userId)
    const parts = baseName.split('-');
    if (parts.length >= 2) {
        const ticketOwnerId = parts[parts.length - 1]; // Last part should be user ID
        return member.id === ticketOwnerId;
    }
    
    return false;
}
