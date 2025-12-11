// ------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
// ------------------------------------------------------------//

import * as Discord from 'discord.js';
import * as DiscordTranscripts from 'discord-html-transcripts';

import { CustomEmbed } from '@/common/message';
import { delay, getMarkdownFriendlyTimestamp } from '@/utilities';

import { SupportSystemConfig } from '../config';
import { 
    SupportCategoryId, 
    SupportTicketContext, 
    SupportTicketService,
    TicketPriority 
} from '../types';
import { TicketPriorityServiceImpl } from './priority-service';

/**
 * Implementation of the support ticket service
 */
export class SupportTicketServiceImpl implements SupportTicketService {
    private priorityService: TicketPriorityServiceImpl;
    
    constructor(
        private config: SupportSystemConfig
    ) {
        this.priorityService = new TicketPriorityServiceImpl();
    }

    /**
     * Creates a new support ticket channel
     */
    async createTicketChannel(context: SupportTicketContext): Promise<Discord.TextChannel> {
        const { guild, owner, categoryId } = context;
        
        // Check if ticket already exists
        const existingTicket = await this.findExistingTicket(guild, owner.id, categoryId);
        if (existingTicket) {
            return existingTicket;
        }

        const supportTicketsCategory = await guild.channels.fetch(this.config.channels.ticketsCategoryId);
        if (!supportTicketsCategory) {
            throw new Error('Can\'t find the support ticket category!');
        }
        if (supportTicketsCategory.type !== Discord.ChannelType.GuildCategory) {
            throw new Error('Support ticket category is not a category!');
        }

        const channelName = `${categoryId}-${owner.id}`.toLowerCase();
        const channelTopic = `${owner} | ${categoryId} | Opened on <t:${Math.floor(Date.now() / 1000)}:F> | Staff may close this ticket using the close_ticket command.`;

        const supportTicketChannel = await guild.channels.create({
            name: channelName,
            type: Discord.ChannelType.GuildText,
            topic: channelTopic,
            parent: supportTicketsCategory,
            permissionOverwrites: [
                ...Array.from(supportTicketsCategory.permissionOverwrites.cache.values()),
                {
                    id: this.config.roles.customerServiceRoleId,
                    allow: [Discord.PermissionFlagsBits.ViewChannel, Discord.PermissionFlagsBits.SendMessages],
                },
                {
                    id: this.config.roles.staffRoleId,
                    allow: [Discord.PermissionFlagsBits.ViewChannel],
                    deny: [Discord.PermissionFlagsBits.SendMessages],
                },
                {
                    id: owner.id,
                    allow: [Discord.PermissionFlagsBits.ViewChannel, Discord.PermissionFlagsBits.SendMessages],
                },
            ],
        });

        // Set default priority (Low) and update channel name with emoji
        await this.priorityService.createDefaultPriority(supportTicketChannel.id);
        await this.priorityService.updateChannelName(supportTicketChannel, TicketPriority.Low);

        // Send initial information
        await this.sendInitialInformation(supportTicketChannel, context);

        // Check if there are too many tickets and send delay warning
        await this.checkAndSendDelayWarning(supportTicketChannel, supportTicketsCategory);

        return supportTicketChannel;
    }

    /**
     * Closes a support ticket channel
     */
    async closeTicketChannel(
        channel: Discord.GuildTextBasedChannel,
        closedBy: Discord.GuildMember,
        reason: string,
        options: {
            saveTranscript?: boolean;
            sendFeedback?: boolean;
        } = {}
    ): Promise<void> {
        const { saveTranscript = true, sendFeedback = true } = options;

        if (saveTranscript) {
            await this.saveTranscript(channel, closedBy, reason, sendFeedback);
        }

        // Clean up priority data
        await this.priorityService.removePriority(channel.id);

        await delay(this.config.timeouts.cleanupTimeoutMs);

        try {
            await channel.delete();
        } catch {
            // Ignore errors during deletion
        }
    }

    /**
     * Finds an existing ticket channel for a user and category
     */
    async findExistingTicket(
        guild: Discord.Guild,
        userId: string,
        categoryId: SupportCategoryId
    ): Promise<Discord.TextChannel | null> {
        const supportTicketsCategory = await guild.channels.fetch(this.config.channels.ticketsCategoryId);
        if (!supportTicketsCategory) return null;

        const channelName = `${categoryId}-${userId}`.toLowerCase();
        const existingChannel = guild.channels.cache.find(
            (channel) => {
                if (channel.parentId !== supportTicketsCategory.id) return false;
                
                // Check if channel name matches with or without priority emoji
                const channelNameLower = channel.name.toLowerCase();
                
                // Direct match
                if (channelNameLower === channelName) return true;
                
                // Check if it matches with priority emoji prefix
                const priorityEmojis = ['🟢', '🟡', '🔴', '⏸️'];
                for (const emoji of priorityEmojis) {
                    if (channelNameLower === `${emoji}-${channelName}`) return true;
                }
                
                return false;
            }
        );

        return existingChannel as Discord.TextChannel || null;
    }

    /**
     * Sends initial information to the support ticket channel
     */
    private async sendInitialInformation(
        channel: Discord.TextChannel,
        context: SupportTicketContext
    ): Promise<void> {
        // Get priority context for SLA information
        const priorityContext = await this.priorityService.getPriority(channel.id);
        const priorityConfig = this.priorityService.getPriorityConfig(TicketPriority.Low);
        
        // Create initial embed with priority and SLA information
        const initialEmbed = CustomEmbed.from({
            color: priorityConfig.color,
            title: `${priorityConfig.emoji} Support Ticket - ${priorityConfig.label}`,
            description: [
                `Welcome to your support ticket, ${context.owner}!`,
                '',
                '**Priority Information:**',
                `• Current Priority: ${priorityConfig.label}`,
                `• Expected Response Time: ${priorityConfig.slaHours} ${priorityConfig.slaHours === 1 ? 'hour' : 'hours'}`,
                `• SLA Deadline: ${priorityContext ? `<t:${Math.floor(priorityContext.slaDeadline.getTime() / 1000)}:R>` : 'Not set'}`,
                '',
                '**Important Guidelines:**',
                '• Our support staff are volunteers who generously donate their time',
                '• Please do not @mention, harass, or otherwise annoy our support staff',
                '• Provide as much information as possible to help us assist you',
            ].join('\n'),
            fields: [
                {
                    name: 'Available Priority Levels',
                    value: [
                        '🟢 **Low Priority** - General questions (24 hours)',
                        '🟡 **Medium Priority** - Issues affecting functionality (8 hours)',
                        '🔴 **High Priority** - Critical issues needing immediate attention (1 hour)',
                        '⏸️ **On Hold** - Ticket is paused (No SLA)',
                    ].join('\n'),
                    inline: false,
                },
            ],
            timestamp: new Date().toISOString(),
        });

        // Send initial message with user mention for notification
        const initialMessage = await channel.send({
            content: `${context.owner} Your support ticket has been created! Please provide details about your issue below.`,
            embeds: [initialEmbed],
        });
        
        await initialMessage.pin();

        // Post ticket link in main support channel
        await this.postTicketLinkToSupportChannel(channel, context);
    }

    /**
     * Posts a ticket link to the main support channel
     */
    private async postTicketLinkToSupportChannel(
        channel: Discord.TextChannel,
        context: SupportTicketContext
    ): Promise<void> {
        try {
            // Check if support channel is configured
            if (!this.config.channels.supportChannelId) {
                console.log('Support channel not configured, skipping ticket link posting');
                return;
            }

            const supportChannel = await channel.client.channels.fetch(this.config.channels.supportChannelId);
            if (!supportChannel || !supportChannel.isTextBased() || !supportChannel.isSendable()) {
                console.warn('Support channel not found or not sendable');
                return;
            }

            const ticketLinkEmbed = CustomEmbed.from({
                color: CustomEmbed.Color.Blue,
                title: '🎫 New Support Ticket Created',
                description: [
                    `**User:** ${context.owner}`,
                    `**Category:** ${context.categoryId}`,
                    `**Channel:** ${Discord.channelMention(channel.id)}`,
                    `**Created:** <t:${Math.floor(context.createdAt.getTime() / 1000)}:R>`,
                ].join('\n'),
                timestamp: new Date().toISOString(),
            });

            await supportChannel.send({
                embeds: [ticketLinkEmbed],
            });
        } catch (error) {
            console.error('Failed to post ticket link to support channel:', error);
        }
    }

    /**
     * Checks the number of tickets and sends delay warning if needed
     */
    private async checkAndSendDelayWarning(
        channel: Discord.TextChannel,
        category: Discord.CategoryChannel
    ): Promise<void> {
        const ticketCount = category.children.cache.size;
        
        if (ticketCount > 7) {
            await channel.send({
                embeds: [
                    CustomEmbed.from({
                        color: CustomEmbed.Color.Red,
                        title: 'Support Delays',
                        description: 'Please be patient as there are some delays due to the amount of tickets. \nYou may have to wait a while for a response.',
                    }),
                ],
            });
        }
    }

    /**
     * Saves the transcript and handles feedback
     */
    private async saveTranscript(
        channel: Discord.GuildTextBasedChannel,
        closedBy: Discord.GuildMember,
        reason: string,
        sendFeedback: boolean
    ): Promise<void> {
        // Extract ticket information from channel name
        const filtered_ticket_name = channel.name.slice(3);
        const ticketCategoryId = filtered_ticket_name.split('-')[0];
        const ticketOwnerId = filtered_ticket_name.split('-')[1];
        
        if (!ticketCategoryId || !ticketOwnerId) {
            throw new Error('Unable to extract ticket information from channel name!');
        }

        const ticketOwner = await channel.client.users.fetch(ticketOwnerId);
        const creationTimestamp = channel.createdTimestamp ? 
            `<t:${getMarkdownFriendlyTimestamp(channel.createdTimestamp)}:F>` : 
            'unknown';

        // Generate transcript
        const transcript = await DiscordTranscripts.createTranscript(channel, {
            limit: -1,
            filename: `transcript_${channel.name}.html`,
            saveImages: true,
            poweredBy: false,
        });

        // Get channel participants
        const messages = await channel.messages.fetch();
        const participantIds = new Set(messages.map(msg => msg.author.id));

        // Create transcript embed
        const transcriptEmbed = CustomEmbed.from({
            fields: [
                {
                    name: 'Ticket Id',
                    value: `${'```'}\n${channel.name}\n${'```'}`,
                    inline: false,
                },
                {
                    name: 'Category',
                    value: `${'```'}\n${ticketCategoryId}\n${'```'}`,
                    inline: false,
                },
                {
                    name: 'Creation Timestamp',
                    value: creationTimestamp,
                    inline: false,
                },
                {
                    name: 'Closure Timestamp',
                    value: `<t:${Math.floor(Date.now() / 1000)}:F>`,
                    inline: false,
                },
                {
                    name: 'Opened By',
                    value: Discord.userMention(ticketOwner.id),
                    inline: true,
                },
                {
                    name: 'Closed By',
                    value: Discord.userMention(closedBy.id),
                    inline: true,
                },
                {
                    name: 'Reason for Closure',
                    value: `${'```'}\n${reason}\n${'```'}`,
                    inline: false,
                },
                {
                    name: 'Participants',
                    value: Array.from(participantIds).map(id => Discord.userMention(id)).join(' - '),
                    inline: false,
                },
            ],
        });

        // Send transcript to transcripts channel
        const transcriptsChannel = await channel.client.channels.fetch(this.config.channels.transcriptsChannelId);
        if (!transcriptsChannel || !transcriptsChannel.isTextBased() || !transcriptsChannel.isSendable()) {
            throw new Error('Unable to access transcripts channel!');
        }

        const transcriptMessage = await transcriptsChannel.send({
            embeds: [transcriptEmbed],
            files: [transcript],
        });

        // Send feedback survey if requested
        if (sendFeedback) {
            await this.sendFeedbackSurvey(ticketOwner, closedBy, reason, transcript, {
                message: transcriptMessage,
                embed: transcriptEmbed,
            });
        }
    }

    /**
     * Sends feedback survey to the ticket owner
     */
    private async sendFeedbackSurvey(
        ticketOwner: Discord.User,
        closedBy: Discord.GuildMember,
        reason: string,
        transcript: Discord.AttachmentBuilder,
        transcriptMessageData: {
            message: Discord.Message;
            embed: Discord.EmbedBuilder;
        }
    ): Promise<void> {
        try {
            const dmChannel = await ticketOwner.createDM();

            // Send closure notification with transcript
            await dmChannel.send({
                embeds: [
                    CustomEmbed.from({
                        description: [
                            `Your support ticket was closed by ${Discord.userMention(closedBy.user.id)} for:`,
                            '```',
                            Discord.escapeCodeBlock(reason),
                            '```',
                        ].join('\n'),
                    }),
                ],
                files: [transcript],
            });

            // Send feedback survey
            const feedbackMessage = await dmChannel.send({
                embeds: [
                    CustomEmbed.from({
                        description: 'How was your most recent support ticket experience?',
                    }),
                ],
                components: [
                    {
                        type: Discord.ComponentType.ActionRow,
                        components: [
                            {
                                type: Discord.ComponentType.StringSelect,
                                customId: 'support_user_feedback_survey_color',
                                placeholder: 'Please select a rating to give our support staff!',
                                minValues: 1,
                                maxValues: 1,
                                options: Object.entries(this.config.satisfaction.levels).map(([key, value]) => ({
                                    label: value.label,
                                    description: value.description,
                                    value: key,
                                })),
                            },
                        ],
                    },
                ],
            });

            // Handle feedback response
            const collector = feedbackMessage.createMessageComponentCollector({
                filter: (interaction) => interaction.user.id === ticketOwner.id,
                time: this.config.timeouts.feedbackTimeoutMs,
                max: 1,
            });

            collector.on('collect', async (interaction) => {
                if (!interaction.isStringSelectMenu()) return;

                await interaction.deferUpdate();

                const satisfactionKey = interaction.values[0];
                const satisfactionLevel = this.config.satisfaction.levels[satisfactionKey];

                if (satisfactionLevel) {
                    const customerReviewEmbed = CustomEmbed.from({
                        color: satisfactionLevel.color,
                        title: `User feedback: ${satisfactionLevel.label}`,
                        description: satisfactionLevel.description,
                    });

                    await transcriptMessageData.message.edit({
                        embeds: [transcriptMessageData.embed, customerReviewEmbed],
                    }).catch(console.warn);
                }

                await feedbackMessage.edit({
                    embeds: [
                        CustomEmbed.from({
                            title: 'Thank you!',
                            description: 'Your feedback has been recorded.',
                        }),
                    ],
                    components: [],
                }).catch(console.warn);
            });

            collector.on('end', async () => {
                await feedbackMessage.edit({
                    components: [],
                }).catch(console.warn);
            });
        } catch {
            // Ignore errors (user might have DMs disabled)
        }
    }
}
