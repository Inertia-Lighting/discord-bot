// ------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
// ------------------------------------------------------------//

import * as Discord from 'discord.js';

import { loadSupportSystemConfig } from '../config';
import { SupportCategoryId } from '../types';
import { performPeriodicCleanup } from './startup-cleanup';
import { supportTicketDatabaseService } from './ticket-database-service';

/**
 * Service for monitoring ticket SLA and handling escalations
 */
export class TicketEscalationService {
    private config: ReturnType<typeof loadSupportSystemConfig>;
    private client: Discord.Client;
    private intervalId: NodeJS.Timeout | null = null;

    constructor(client: Discord.Client) {
        this.client = client;
        this.config = loadSupportSystemConfig();
    }

    /**
     * Starts the escalation monitoring service
     */
    start(): void {
        if (this.intervalId) {
            this.stop();
        }

        // Check every 30 minutes for SLA violations and cleanup
        this.intervalId = setInterval(async () => {
            await this.performAllChecks();
        }, 30 * 60 * 1000); // 30 minutes

        console.log('Ticket escalation and SLA monitoring service started');
    }

    /**
     * Stops the escalation monitoring service
     */
    stop(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
            console.log('Ticket escalation and SLA monitoring service stopped');
        }
    }

    /**
     * Performs all SLA checks and escalations
     */
    private async performAllChecks(): Promise<void> {
        try {
            await Promise.all([
                this.checkForEscalations(),
                this.checkForHalfSLANotifications(),
                this.checkForUserPings(),
                performPeriodicCleanup(this.client),
            ]);
        } catch (error) {
            console.error('Error during SLA checks:', error);
        }
    }

    /**
     * Checks for tickets needing escalation
     */
    private async checkForEscalations(): Promise<void> {
        try {
            const tickets = await supportTicketDatabaseService.getTicketsNeedingEscalation();
            
            for (const ticket of tickets) {
                await this.escalateTicket(ticket);
            }
        } catch (error) {
            console.error('Error checking for escalations:', error);
        }
    }

    /**
     * Checks for tickets needing half-SLA notifications
     */
    private async checkForHalfSLANotifications(): Promise<void> {
        try {
            const tickets = await supportTicketDatabaseService.getTicketsNeedingHalfSLANotification();
            
            for (const ticket of tickets) {
                await this.sendHalfSLANotification(ticket);
            }
        } catch (error) {
            console.error('Error checking for half-SLA notifications:', error);
        }
    }

    /**
     * Checks for tickets needing user pings
     */
    private async checkForUserPings(): Promise<void> {
        try {
            const tickets = await supportTicketDatabaseService.getTicketsNeedingUserPing();
            
            for (const ticket of tickets) {
                await this.pingUser(ticket);
            }
        } catch (error) {
            console.error('Error checking for user pings:', error);
        }
    }

    /**
     * Escalates a ticket by pinging relevant staff in the ticket channel
     */
    private async escalateTicket(ticket: any): Promise<void> {
        try {
            const channel = await this.client.channels.fetch(ticket.channelId);
            
            if (!channel || !channel.isTextBased() || !channel.isSendable()) {
                return;
            }

            // Get the appropriate staff role based on ticket category
            const staffRoleId = this.getStaffRoleForCategory(ticket.categoryId);
            
            await channel.send({
                content: `<@&${staffRoleId}>`,
                embeds: [
                    {
                        color: 0xff0000,
                        title: '⚠️ SLA Escalation',
                        description: 'This ticket has exceeded its SLA deadline and needs immediate attention.',
                        fields: [
                            {
                                name: 'Priority',
                                value: ticket.priority || 'Not set',
                                inline: true,
                            },
                            {
                                name: 'Category',
                                value: ticket.categoryId,
                                inline: true,
                            },
                            {
                                name: 'SLA Deadline',
                                value: ticket.slaDeadline ? `<t:${Math.floor(new Date(ticket.slaDeadline).getTime() / 1000)}:R>` : 'Not set',
                                inline: true,
                            },
                        ],
                        timestamp: new Date().toISOString(),
                    },
                ],
            });

            // Mark escalation as started
            await supportTicketDatabaseService.startEscalation(ticket.channelId);
            
        } catch (error) {
            console.error(`Failed to escalate ticket ${ticket.channelId}:`, error);
        }
    }

    /**
     * Sends half-SLA notification to SLA notifications channel
     */
    private async sendHalfSLANotification(ticket: any): Promise<void> {
        try {
            const slaChannel = await this.client.channels.fetch(this.config.channels.slaNotificationsChannelId);
            
            if (!slaChannel || !slaChannel.isTextBased() || !slaChannel.isSendable()) {
                return;
            }

            const ticketChannel = await this.client.channels.fetch(ticket.channelId);
            const staffRoleId = this.getStaffRoleForCategory(ticket.categoryId);
            
            await slaChannel.send({
                content: `<@&${staffRoleId}>`,
                embeds: [
                    {
                        color: 0xff9900,
                        title: '⏰ Half-SLA Notification',
                        description: 'A ticket has passed half of its SLA time and the user has responded after staff.',
                        fields: [
                            {
                                name: 'Ticket',
                                value: ticketChannel ? `<#${ticket.channelId}>` : `Channel ID: ${ticket.channelId}`,
                                inline: true,
                            },
                            {
                                name: 'Priority',
                                value: ticket.priority || 'Not set',
                                inline: true,
                            },
                            {
                                name: 'Category',
                                value: ticket.categoryId,
                                inline: true,
                            },
                            {
                                name: 'SLA Deadline',
                                value: ticket.slaDeadline ? `<t:${Math.floor(new Date(ticket.slaDeadline).getTime() / 1000)}:R>` : 'Not set',
                                inline: true,
                            },
                        ],
                        timestamp: new Date().toISOString(),
                    },
                ],
            });

            // Mark escalation as started for half-SLA
            await supportTicketDatabaseService.startEscalation(ticket.channelId);
            
        } catch (error) {
            console.error(`Failed to send half-SLA notification for ticket ${ticket.channelId}:`, error);
        }
    }

    /**
     * Pings user in ticket channel for inactivity
     */
    private async pingUser(ticket: any): Promise<void> {
        try {
            const channel = await this.client.channels.fetch(ticket.channelId);
            
            if (!channel || !channel.isTextBased() || !channel.isSendable()) {
                return;
            }

            await channel.send({
                content: `<@${ticket.ownerId}>`,
                embeds: [
                    {
                        color: 0x0099ff,
                        title: '📞 Response Reminder',
                        description: 'We\'re still waiting for your response to continue with your support request.',
                        fields: [
                            {
                                name: 'Last Response',
                                value: ticket.lastUserResponse ? `<t:${Math.floor(new Date(ticket.lastUserResponse).getTime() / 1000)}:R>` : 'Never',
                                inline: true,
                            },
                        ],
                        timestamp: new Date().toISOString(),
                    },
                ],
            });

            // Mark user ping as started
            await supportTicketDatabaseService.startUserPing(ticket.channelId);
            
        } catch (error) {
            console.error(`Failed to ping user for ticket ${ticket.channelId}:`, error);
        }
    }

    /**
     * Gets the appropriate staff role for a ticket category
     */
    private getStaffRoleForCategory(categoryId: string): string {
        switch (categoryId) {
            case SupportCategoryId.Issues:
                return this.config.roles.supportStaff.productIssuesRoleId;
            case SupportCategoryId.Recovery:
            case SupportCategoryId.Transfers:
                return this.config.roles.supportStaff.databaseRoleId;
            case SupportCategoryId.Transactions:
                return this.config.roles.supportStaff.productPurchasesRoleId;
            case SupportCategoryId.PartnershipRequests:
                return this.config.roles.supportStaff.partnershipRequestsRoleId;
            case SupportCategoryId.Other:
            default:
                return this.config.roles.supportStaff.otherRoleId;
        }
    }
}

// Singleton instance
let escalationServiceInstance: TicketEscalationService | null = null;

/**
 * Gets the escalation service instance
 */
export function getEscalationService(client: Discord.Client): TicketEscalationService {
    if (!escalationServiceInstance) {
        escalationServiceInstance = new TicketEscalationService(client);
    }
    return escalationServiceInstance;
}