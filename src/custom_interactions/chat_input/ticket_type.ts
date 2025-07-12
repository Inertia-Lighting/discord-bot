// ------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
// ------------------------------------------------------------//

import { CustomInteraction, CustomInteractionAccessLevel, CustomInteractionRunContext } from '@root/common/managers/custom_interactions_manager';
import { supportSystemManager } from '@root/support_system';
import { loadSupportSystemConfig } from '@root/support_system/config';
import { SupportCategoryId } from '@root/support_system/types';
import * as Discord from 'discord.js';

// ------------------------------------------------------------//

const config = loadSupportSystemConfig();

// ------------------------------------------------------------//

export default new CustomInteraction({
    identifier: 'ticket_type',
    type: Discord.InteractionType.ApplicationCommand,
    data: {
        type: Discord.ApplicationCommandType.ChatInput,
        description: 'Change the type of a support ticket (staff only).',
        options: [
            {
                name: 'type',
                type: Discord.ApplicationCommandOptionType.String,
                description: 'The new ticket type',
                required: true,
                choices: [
                    {
                        name: 'Product Issues',
                        value: SupportCategoryId.Issues,
                    },
                    {
                        name: 'Account Recovery',
                        value: SupportCategoryId.Recovery,
                    },
                    {
                        name: 'Product Transfers',
                        value: SupportCategoryId.Transfers,
                    },
                    {
                        name: 'Product Transactions',
                        value: SupportCategoryId.Transactions,
                    },
                    {
                        name: 'Partnership Requests',
                        value: SupportCategoryId.PartnershipRequests,
                    },
                    {
                        name: 'Other Questions',
                        value: SupportCategoryId.Other,
                    },
                ],
            },
        ],
    },
    metadata: {
        required_run_context: CustomInteractionRunContext.Guild,
        required_access_level: CustomInteractionAccessLevel.CustomerService,
    },
    handler: async (discord_client, interaction) => {
        if (!interaction.isChatInputCommand()) return;
        if (!interaction.inCachedGuild()) return;
        if (!interaction.channel) return;

        await interaction.deferReply({ flags: ['Ephemeral'] });

        const newType = interaction.options.getString('type', true) as SupportCategoryId;

        // Validate that the command is being used in a support ticket channel
        const channel_exists_in_support_tickets_category = interaction.channel?.parentId === config.channels.ticketsCategoryId;
        const channel_is_not_transcripts_channel = interaction.channel?.id !== config.channels.transcriptsChannelId;
        
        if (!(channel_exists_in_support_tickets_category && channel_is_not_transcripts_channel)) {
            await interaction.editReply({
                content: 'This command can only be used in an active support ticket channel.',
            });
            return;
        }

        const support_channel = interaction.channel;
        if (!(support_channel instanceof Discord.TextChannel)) {
            await interaction.editReply({
                content: 'This command can only be used in a text channel.',
            });
            return;
        }

        // Validate channel name format (should be like "ISSUES-123456789" or "🟢-ISSUES-123456789")
        
        // Handle priority emoji prefix - check if the channel name starts with an emoji
        const priorityEmojis = ['🟢', '🟡', '🔴', '⏸️'];
        let nameWithoutEmoji = support_channel.name;
        for (const emoji of priorityEmojis) {
            if (support_channel.name.startsWith(emoji + '-')) {
                nameWithoutEmoji = support_channel.name.substring(emoji.length + 1);
                break;
            }
        }
        
        // Now split the name without emoji
        let channelNameParts = nameWithoutEmoji.split('-');
        
        if (channelNameParts.length < 2) {
            await interaction.editReply({
                content: 'Invalid ticket channel format. This does not appear to be a support ticket.',
            });
            return;
        }

        try {
            await supportSystemManager.changeTicketType(support_channel, newType, interaction.member);
            
            await interaction.editReply({
                content: `✅ Successfully changed ticket type to **${newType}**.`,
            });
        } catch (error) {
            console.error('Error changing ticket type:', error);
            
            let errorMessage = 'An error occurred while changing the ticket type.';
            if (error instanceof Error) {
                errorMessage = error.message;
            }
            
            await interaction.editReply({
                content: `❌ ${errorMessage}`,
            });
        }
    },
});