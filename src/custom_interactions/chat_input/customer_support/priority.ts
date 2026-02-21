// ------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
// ------------------------------------------------------------//

import * as Discord from 'discord.js';

import { CustomInteraction, CustomInteractionAccessLevel, CustomInteractionRunContext } from '@/common/managers/custom_interactions_manager.js'
;
import { loadSupportSystemConfig } from '@/support_system/config/index.js'
;
import { TicketPriorityServiceImpl } from '@/support_system/core/priority-service.js'
;
import { TicketPriority } from '@/support_system/types/index.js'
;

// ------------------------------------------------------------//

const config = loadSupportSystemConfig();
const priorityService = new TicketPriorityServiceImpl();

const bot_customer_service_role_id = `${process.env.BOT_CUSTOMER_SERVICE_ROLE_ID ?? ''}`;
if (bot_customer_service_role_id.length < 1) throw new Error('Environment variable: BOT_CUSTOMER_SERVICE_ROLE_ID; is not set correctly.');

// ------------------------------------------------------------//

export default new CustomInteraction({
    identifier: 'priority',
    type: Discord.InteractionType.ApplicationCommand,
    data: {
        type: Discord.ApplicationCommandType.ChatInput,
        description: 'Set or update the priority of a support ticket.',
        options: [
            {
                name: 'level',
                type: Discord.ApplicationCommandOptionType.String,
                description: 'The priority level to set',
                required: true,
                choices: [
                    {
                        name: '🟢 Low Priority (24 hours)',
                        value: TicketPriority.Low,
                    },
                    {
                        name: '🟡 Medium Priority (8 hours)',
                        value: TicketPriority.Medium,
                    },
                    {
                        name: '🔴 High Priority (1 hour)',
                        value: TicketPriority.High,
                    },
                    {
                        name: '⏸️ On Hold (No SLA)',
                        value: TicketPriority.OnHold,
                    },
                ],
            },
        ],
    },
    metadata: {
        required_run_context: CustomInteractionRunContext.Guild,
        required_access_level: CustomInteractionAccessLevel.CustomerService, // Allow customer service to use this command
    },
    handler: async (discord_client, interaction) => {
        if (!interaction.isChatInputCommand()) return;
        if (!interaction.inCachedGuild()) return;
        if (!interaction.channel) return;

        await interaction.deferReply({ flags: ['Ephemeral'] });

        const priorityLevel = interaction.options.getString('level', true) as TicketPriority;

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
        const channelNameParts = support_channel.name.split('-');
        if (channelNameParts.length < 2) {
            await interaction.editReply({
                content: 'Invalid ticket channel format. This does not appear to be a support ticket.',
            });
            return;
        }

        try {
            // Get current priority for comparison
            const currentPriority = await priorityService.getPriority(support_channel.id);
            
            if (currentPriority?.priority === priorityLevel) {
                const priorityConfig = priorityService.getPriorityConfig(priorityLevel);
                await interaction.editReply({
                    content: `This ticket is already set to **${priorityConfig.label}**.`,
                });
                return;
            }

            // Set the new priority
            await priorityService.setPriority(support_channel.id, priorityLevel, interaction.member);
            
            const newConfig = priorityService.getPriorityConfig(priorityLevel);
            await interaction.editReply({
                content: `✅ Successfully set ticket priority to **${newConfig.label}**.`,
            });
            
            // Log successful priority change for debugging
            console.log('Priority changed for channel', support_channel.id, 'to', priorityLevel, 'by', interaction.member.displayName);
        } catch (error) {
            console.error('Error setting ticket priority:', error);
            
            let errorMessage = 'An error occurred while setting the ticket priority.';
            if (error instanceof Error) {
                errorMessage = `${error.message}`;
            }
            
            await interaction.editReply({
                content: `❌ ${errorMessage}`,
            });
        }
    },
});

/**
 * Checks if a user is the owner of a ticket channel
 */
// async function isUserTicketOwner(channel: Discord.TextChannel, member: Discord.GuildMember): Promise<boolean> {
//     const channelName = channel.name;
    
//     // Remove priority emoji if present
//     const priorityEmojis = ['🟢', '🟡', '🔴', '⏸️'];
//     let nameWithoutEmoji = channelName;
//     for (const emoji of priorityEmojis) {
//         if (channelName.startsWith(emoji + '-')) {
//             nameWithoutEmoji = channelName.substring(emoji.length + 1);
//             break;
//         }
//     }
    
//     // Extract user ID from channel name (format: categoryId-userId)
//     const parts = nameWithoutEmoji.split('-');
//     if (parts.length >= 2 && parts[0] !== '' && parts[parts.length - 1] !== '') {
//         const ticketOwnerId = parts[parts.length - 1]; // Last part should be user ID
//         return member.id === ticketOwnerId;
//     }
    
//     return false;
// }