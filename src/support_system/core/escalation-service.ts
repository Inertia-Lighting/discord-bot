// ------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
// ------------------------------------------------------------//

import { CustomEmbed } from '@root/common/message';
import * as Discord from 'discord.js';

import { loadSupportSystemConfig } from '../config';
import { TicketPriorityServiceImpl } from './priority-service';

/**
 * Service for monitoring ticket SLA and handling escalations
 */
export class TicketEscalationService {
    private priorityService: TicketPriorityServiceImpl;
    private config: ReturnType<typeof loadSupportSystemConfig>;
    private client: Discord.Client;
    private intervalId: NodeJS.Timeout | null = null;

    constructor(client: Discord.Client) {
        this.client = client;
        this.config = loadSupportSystemConfig();
        this.priorityService = new TicketPriorityServiceImpl();
    }

    /**
     * Starts the escalation monitoring service
     */
    start(): void {
        if (this.intervalId) {
            this.stop();
        }

        // Check every 30 minutes for tickets needing escalation
        this.intervalId = setInterval(async () => {
            await this.checkForEscalations();
        }, 30 * 60 * 1000); // 30 minutes

        console.log('Ticket escalation monitoring service started');
    }

    /**
     * Stops the escalation monitoring service
     */
    stop(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
            console.log('Ticket escalation monitoring service stopped');
        }
    }

    /**
     * Checks for tickets that need escalation and handles them
     */
    private async checkForEscalations(): Promise<void> {
        try {
            const ticketsNeedingEscalation = await this.priorityService.getTicketsNeedingEscalation();
            
            for (const ticketContext of ticketsNeedingEscalation) {
                await this.handleTicketEscalation(ticketContext.channelId);
            }
        } catch (error) {
            console.error('Error checking for escalations:', error);
        }
    }

    /**
     * Handles escalation for a specific ticket
     */
    private async handleTicketEscalation(channelId: string): Promise<void> {
        try {
            const channel = await this.client.channels.fetch(channelId);
            if (!channel || !channel.isTextBased() || channel.type !== Discord.ChannelType.GuildText) {
                return;
            }

            const priorityContext = await this.priorityService.getPriority(channelId);
            if (!priorityContext) {
                return;
            }

            const priorityConfig = this.priorityService.getPriorityConfig(priorityContext.priority);
            
            // Start escalation tracking
            await this.priorityService.startEscalation(channelId);
            
            // Create escalation embed
            const escalationEmbed = CustomEmbed.from({
                color: CustomEmbed.Color.Red,
                title: `🚨 SLA Escalation - ${priorityConfig.label}`,
                description: [
                    'This ticket has exceeded its SLA deadline and needs immediate attention.',
                    '',
                    `**Priority:** ${priorityConfig.label}`,
                    `**SLA:** ${priorityConfig.slaHours} ${priorityConfig.slaHours === 1 ? 'hour' : 'hours'}`,
                    `**Deadline:** <t:${Math.floor(priorityContext.slaDeadline.getTime() / 1000)}:R>`,
                    `**Escalation Count:** ${priorityContext.escalationCount}`,
                    '',
                    'Please respond to this ticket as soon as possible to meet our service level agreement.',
                ].join('\n'),
                timestamp: new Date().toISOString(),
            });

            // Send escalation notification
            await channel.send({
                content: `<@&${this.config.roles.customerServiceRoleId}> - SLA Escalation Required`,
                embeds: [escalationEmbed],
            });

            console.log(`Escalated ticket: ${channelId} (Count: ${priorityContext.escalationCount})`);
        } catch (error) {
            console.error(`Error handling escalation for ticket ${channelId}:`, error);
        }
    }

    /**
     * Records a staff response to stop escalation for a ticket
     */
    async recordStaffResponse(channelId: string, staffMember: Discord.GuildMember): Promise<void> {
        try {
            await this.priorityService.recordStaffResponse(channelId, staffMember);
            
            // Send confirmation message
            const channel = await this.client.channels.fetch(channelId);
            if (channel?.isTextBased() && 'send' in channel) {
                await channel.send({
                    embeds: [
                        CustomEmbed.from({
                            color: CustomEmbed.Color.Green,
                            title: '✅ Staff Response Recorded',
                            description: `SLA escalation has been stopped. Thank you for responding, ${staffMember}!`,
                            timestamp: new Date().toISOString(),
                        }),
                    ],
                });
            }
        } catch (error) {
            console.error(`Error recording staff response for ticket ${channelId}:`, error);
        }
    }

    /**
     * Checks if a user is staff based on their permissions
     */
    isStaffMember(member: Discord.GuildMember): boolean {
        return member.roles.cache.has(this.config.roles.customerServiceRoleId) ||
               member.roles.cache.has(this.config.roles.staffRoleId) ||
               member.permissions.has(Discord.PermissionFlagsBits.ManageChannels);
    }
}

// Export singleton instance
let escalationService: TicketEscalationService | null = null;

export function getEscalationService(client: Discord.Client): TicketEscalationService {
    if (!escalationService) {
        escalationService = new TicketEscalationService(client);
    }
    return escalationService;
}