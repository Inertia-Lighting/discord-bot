// ------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
// ------------------------------------------------------------//

import prisma from '@root/lib/prisma_client';

import { SupportCategoryId, TicketPriority } from '../types';

/**
 * Database service for managing support tickets
 */
export class SupportTicketDatabaseService {
    /**
     * Creates a new support ticket in the database
     */
    async createTicket(
        channelId: string,
        ownerId: string,
        categoryId: SupportCategoryId
    ): Promise<void> {
        await prisma.supportTickets.create({
            data: {
                channelId,
                ownerId,
                categoryId,
                // Priority is initially null - will be set later
                priority: null,
                slaDeadline: null,
                lastUserResponse: new Date(), // User created the ticket
            },
        });
    }

    /**
     * Updates ticket type in the database
     */
    async updateTicketType(
        channelId: string,
        newCategoryId: SupportCategoryId
    ): Promise<void> {
        await prisma.supportTickets.update({
            where: { channelId },
            data: { 
                categoryId: newCategoryId,
            },
        });
    }

    /**
     * Sets ticket priority and starts SLA countdown
     */
    async setPriority(
        channelId: string,
        priority: TicketPriority,
        slaHours: number
    ): Promise<void> {
        const slaDeadline = priority === 'onhold' ? 
            null : // OnHold tickets have no SLA
            new Date(Date.now() + slaHours * 60 * 60 * 1000);

        await prisma.supportTickets.update({
            where: { channelId },
            data: {
                priority,
                slaDeadline,
                prioritySetAt: new Date(),
                // Reset escalation when priority changes
                escalationStarted: null,
                escalationCount: 0,
                updatedAt: new Date(),
            },
        });
    }

    /**
     * Records a staff response
     */
    async recordStaffResponse(channelId: string): Promise<void> {
        await prisma.supportTickets.update({
            where: { channelId },
            data: {
                lastStaffResponse: new Date(),
                // Reset escalation when staff responds
                escalationStarted: null,
                escalationCount: 0,
                updatedAt: new Date(),
            },
        });
    }

    /**
     * Records a user response
     */
    async recordUserResponse(channelId: string): Promise<void> {
        await prisma.supportTickets.update({
            where: { channelId },
            data: {
                lastUserResponse: new Date(),
                // Reset user ping when user responds
                userPingStarted: null,
                userPingCount: 0,
                updatedAt: new Date(),
            },
        });
    }

    /**
     * Starts escalation for a ticket
     */
    async startEscalation(channelId: string): Promise<void> {
        await prisma.supportTickets.update({
            where: { channelId },
            data: {
                escalationStarted: new Date(),
                escalationCount: {
                    increment: 1,
                },
                updatedAt: new Date(),
            },
        });
    }

    /**
     * Starts user ping for a ticket
     */
    async startUserPing(channelId: string): Promise<void> {
        await prisma.supportTickets.update({
            where: { channelId },
            data: {
                userPingStarted: new Date(),
                userPingCount: {
                    increment: 1,
                },
                updatedAt: new Date(),
            },
        });
    }

    /**
     * Gets a ticket by channel ID
     */
    async getTicket(channelId: string): Promise<SupportTicket | null> {
        return await prisma.supportTickets.findUnique({
            where: { channelId },
        });
    }

    /**
     * Gets all tickets that need escalation
     */
    async getTicketsNeedingEscalation(): Promise<any[]> {
        const now = new Date();
        const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        // Get tickets where:
        // 1. Priority is set and SLA deadline has passed
        // 2. No staff response after SLA deadline
        // 3. Either no escalation started or last escalation was more than 24 hours ago
        return await prisma.supportTickets.findMany({
            where: {
                priority: { not: null },
                slaDeadline: { lte: now },
                AND: [
                    {
                        OR: [
                            { escalationStarted: null },
                            { escalationStarted: { lte: twentyFourHoursAgo } },
                        ],
                    },
                ],
            },
        });
    }

    /**
     * Gets all tickets that need user ping
     */
    async getTicketsNeedingUserPing(): Promise<any[]> {
        const now = new Date();
        const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        // Get tickets where:
        // 1. Staff has responded after user's last response
        // 2. No user response for more than 24 hours
        // 3. Either no user ping started or last user ping was more than 24 hours ago
        return await prisma.supportTickets.findMany({
            where: {
                lastStaffResponse: { not: null },
                lastUserResponse: { not: null, lte: twentyFourHoursAgo },
                OR: [
                    { userPingStarted: null },
                    { userPingStarted: { lte: twentyFourHoursAgo } },
                ],
            },
        }).then((tickets: any[]) => {
            // Filter for tickets where staff responded after user's last response
            return tickets.filter((ticket: any) => {
                if (!ticket.lastStaffResponse || !ticket.lastUserResponse) return false;
                return new Date(ticket.lastStaffResponse) >= new Date(ticket.lastUserResponse);
            });
        });
    }

    /**
     * Gets all tickets that need auto-close
     */
    async getTicketsNeedingAutoClose(): Promise<any[]> {
        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        // Get tickets where:
        // 1. User's last response was more than 7 days ago
        // 2. Staff has responded after user's last response
        // 3. Auto-close is not already scheduled
        return await prisma.supportTickets.findMany({
            where: {
                lastUserResponse: { lte: sevenDaysAgo },
                lastStaffResponse: { not: null },
                isAutoCloseScheduled: false,
            },
        }).then((tickets: any[]) => {
            // Filter for tickets where staff responded after user's last response
            return tickets.filter((ticket: any) => {
                if (!ticket.lastStaffResponse || !ticket.lastUserResponse) return false;
                return new Date(ticket.lastStaffResponse) >= new Date(ticket.lastUserResponse);
            });
        });
    }

    /**
     * Marks a ticket for auto-close
     */
    async markForAutoClose(channelId: string): Promise<void> {
        await prisma.supportTickets.update({
            where: { channelId },
            data: {
                isAutoCloseScheduled: true,
                updatedAt: new Date(),
            },
        });
    }

    /**
     * Deletes a ticket from the database
     */
    async deleteTicket(channelId: string): Promise<void> {
        await prisma.supportTickets.delete({
            where: { channelId },
        });
    }

    /**
     * Gets all tickets in the database
     */
    async getAllTickets(): Promise<any[]> {
        return await prisma.supportTickets.findMany();
    }

    /**
     * Gets tickets that need half-SLA notifications
     */
    async getTicketsNeedingHalfSLANotification(): Promise<any[]> {
        const now = new Date();
        const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        // Get tickets where:
        // 1. Priority is set and we're past half the SLA time
        // 2. User has responded after staff's last response
        // 3. Either no escalation started or last escalation was more than 24 hours ago
        return await prisma.supportTickets.findMany({
            where: {
                priority: { not: null },
                slaDeadline: { not: null },
                lastUserResponse: { not: null },
                lastStaffResponse: { not: null },
                OR: [
                    { escalationStarted: null },
                    { escalationStarted: { lte: twentyFourHoursAgo } },
                ],
            },
        }).then((tickets: any[]) => {
            // Filter for tickets that are past half their SLA time and user responded after staff
            return tickets.filter((ticket: any) => {
                if (!ticket.prioritySetAt || !ticket.slaDeadline || !ticket.lastUserResponse || !ticket.lastStaffResponse) return false;
                
                // Check if user responded after staff's last response
                const userRespondedAfterStaff = new Date(ticket.lastUserResponse) >= new Date(ticket.lastStaffResponse);
                if (!userRespondedAfterStaff) return false;
                
                // Check if we're past half the SLA time
                const prioritySetTime = new Date(ticket.prioritySetAt);
                const slaDeadlineTime = new Date(ticket.slaDeadline);
                const halfSLATime = new Date(prioritySetTime.getTime() + (slaDeadlineTime.getTime() - prioritySetTime.getTime()) / 2);
                
                return now >= halfSLATime;
            });
        });
    }
}

// Export singleton instance
export const supportTicketDatabaseService = new SupportTicketDatabaseService();