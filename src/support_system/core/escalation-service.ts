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
            
            // Also check for tickets needing user pings
            const ticketsNeedingUserPing = await this.priorityService.getTicketsNeedingUserPing();
            
            for (const ticketContext of ticketsNeedingUserPing) {
                await this.handleUserPing(ticketContext.channelId);
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
            
            // Log the staff response for debugging (no user-facing message)
            console.log(`Staff response recorded for ticket ${channelId} by ${staffMember.displayName}`);
        } catch (error) {
            console.error(`Error recording staff response for ticket ${channelId}:`, error);
        }
    }

    /**
     * Records a user response to stop user pinging for a ticket
     */
    async recordUserResponse(channelId: string, user: Discord.GuildMember): Promise<void> {
        try {
            await this.priorityService.recordUserResponse(channelId, user);
            
            // Log the user response for debugging (no user-facing message)
            console.log(`User response recorded for ticket ${channelId} by ${user.displayName}`);
        } catch (error) {
            console.error(`Error recording user response for ticket ${channelId}:`, error);
        }
    }

    /**
     * Handles user pinging for a specific ticket
     */
    private async handleUserPing(channelId: string): Promise<void> {
        try {
            const channel = await this.client.channels.fetch(channelId);
            if (!channel || !channel.isTextBased() || channel.type !== Discord.ChannelType.GuildText) {
                return;
            }

            const priorityContext = await this.priorityService.getPriority(channelId);
            if (!priorityContext) {
                return;
            }

            // Get the ticket owner from the channel name
            const ticketOwnerId = this.extractTicketOwnerId(channel.name);
            if (!ticketOwnerId) {
                return;
            }

            // Update ping count
            priorityContext.userPingCount++;
            priorityContext.userPingStarted = new Date();
            
            // Create user ping embed
            const userPingEmbed = CustomEmbed.from({
                color: CustomEmbed.Color.Yellow,
                title: '⏰ Ticket Response Required',
                description: [
                    `<@${ticketOwnerId}> - We're waiting for your response to this ticket.`,
                    '',
                    'Please respond to continue with your support request.',
                    'If you no longer need assistance, you can close this ticket.',
                    '',
                    `**Response reminder:** ${priorityContext.userPingCount}`
                ].join('\n'),
                timestamp: new Date().toISOString(),
            });

            // Send user ping notification
            await channel.send({
                content: `<@${ticketOwnerId}>`,
                embeds: [userPingEmbed],
            });

            console.log(`User ping sent for ticket: ${channelId} (Count: ${priorityContext.userPingCount})`);
        } catch (error) {
            console.error(`Error handling user ping for ticket ${channelId}:`, error);
        }
    }

    /**
     * Extracts the ticket owner ID from the channel name
     */
    private extractTicketOwnerId(channelName: string): string | null {
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
            return parts[parts.length - 1]; // Last part should be user ID
        }
        
        return null;
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