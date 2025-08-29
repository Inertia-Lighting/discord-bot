// ------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
// ------------------------------------------------------------//

import { CustomEmbed } from '@root/common/message';
import prisma from '@root/lib/prisma_client';
import * as Discord from 'discord.js';

import { 
    PriorityConfig,
    TicketPriority, 
    TicketPriorityContext,
    TicketPriorityService
} from '../types';

/**
 * Priority configurations with SLA and visual indicators
 */
const PRIORITY_CONFIGS: Record<TicketPriority, PriorityConfig> = {
    [TicketPriority.Low]: {
        priority: TicketPriority.Low,
        emoji: '🟢',
        slaHours: 24, // 1 day
        color: CustomEmbed.Color.Green,
        label: 'Low Priority'
    },
    [TicketPriority.Medium]: {
        priority: TicketPriority.Medium,
        emoji: '🟡',
        slaHours: 8, // 8 hours
        color: CustomEmbed.Color.Yellow,
        label: 'Medium Priority'
    },
    [TicketPriority.High]: {
        priority: TicketPriority.High,
        emoji: '🔴',
        slaHours: 1, // 1 hour
        color: CustomEmbed.Color.Red,
        label: 'High Priority'
    },
    [TicketPriority.OnHold]: {
        priority: TicketPriority.OnHold,
        emoji: '⏸️',
        slaHours: 0, // No SLA
        color: CustomEmbed.Color.Gray,
        label: 'On Hold'
    }
};

/**
 * Implementation of the ticket priority service with database persistence
 */
export class TicketPriorityServiceImpl implements TicketPriorityService {
    
    /**
     * Sets the priority for a ticket channel
     */
    async setPriority(channelId: string, priority: TicketPriority, setBy: Discord.GuildMember): Promise<void> {
        const config = this.getPriorityConfig(priority);
        
        // Calculate SLA deadline - OnHold tickets have no SLA
        const slaDeadline = priority === TicketPriority.OnHold ? 
            new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) : // 1 year from now (effectively no SLA)
            new Date(Date.now() + config.slaHours * 60 * 60 * 1000);
        
        // Update or create ticket priority in database
        await prisma.ticketPriorities.upsert({
            where: { channelId },
            update: {
                priority,
                slaDeadline,
                escalationStarted: null, // Reset escalation when priority changes
                escalationCount: 0,
                updatedAt: new Date()
            },
            create: {
                channelId,
                priority,
                slaDeadline,
                escalationCount: 0
            }
        });
        
        // Update channel name with priority emoji
        const channel = await setBy.guild.channels.fetch(channelId);
        if (channel?.isTextBased() && channel.type === Discord.ChannelType.GuildText) {
            await this.updateChannelName(channel, priority);
        }
        
        // No message sent to channel - handled by ephemeral response in command
    }
    
    /**
     * Gets the priority context for a ticket channel
     */
    async getPriority(channelId: string): Promise<TicketPriorityContext | null> {
        const ticket = await prisma.ticketPriorities.findUnique({
            where: { channelId }
        });
        
        if (!ticket) return null;
        
        return {
            channelId: ticket.channelId,
            priority: ticket.priority as TicketPriority,
            slaDeadline: ticket.slaDeadline,
            lastStaffResponse: ticket.lastStaffResponse || undefined,
            lastUserResponse: undefined, // Not stored in database yet
            escalationStarted: ticket.escalationStarted || undefined,
            escalationCount: ticket.escalationCount,
            userPingStarted: undefined, // Not stored in database yet
            userPingCount: 0 // Not stored in database yet
        };
    }
    
    /**
     * Checks if SLA deadline has passed for a ticket
     */
    async checkSLADeadline(channelId: string): Promise<boolean> {
        const ticket = await prisma.ticketPriorities.findUnique({
            where: { channelId }
        });
        
        if (!ticket) return false;
        
        return new Date() > ticket.slaDeadline;
    }
    
    /**
     * Records staff response to stop escalation
     */
    async recordStaffResponse(channelId: string, staffMember: Discord.GuildMember): Promise<void> {
        const now = new Date();
        
        // Update in database
        await prisma.ticketPriorities.update({
            where: { channelId },
            data: {
                lastStaffResponse: now,
                escalationStarted: null,
                escalationCount: 0,
                updatedAt: now
            }
        });
        
        // Log the staff response for debugging
        console.log(`Staff response recorded for ticket ${channelId} by ${staffMember.displayName}`);
    }
    
    /**
     * Records user response to stop user pinging
     */
    async recordUserResponse(channelId: string, user: Discord.GuildMember): Promise<void> {
        // For now, we'll just log this as user ping functionality is not fully implemented in database
        console.log(`User response recorded for ticket ${channelId} by ${user.displayName}`);
    }
    
    /**
     * Starts escalation for a ticket
     */
    async startEscalation(channelId: string): Promise<void> {
        const now = new Date();
        
        // Get current ticket state
        const ticket = await prisma.ticketPriorities.findUnique({
            where: { channelId }
        });
        
        if (!ticket) return;
        
        // Update escalation state
        await prisma.ticketPriorities.update({
            where: { channelId },
            data: {
                escalationStarted: ticket.escalationStarted || now,
                escalationCount: ticket.escalationCount + 1,
                updatedAt: now
            }
        });
    }
    
    /**
     * Gets all tickets that need escalation
     */
    async getTicketsNeedingEscalation(): Promise<TicketPriorityContext[]> {
        const now = new Date();
        
        // Get all tickets that have exceeded their SLA and need escalation
        const tickets = await prisma.ticketPriorities.findMany({
            where: {
                AND: [
                    { priority: { not: TicketPriority.OnHold } }, // Skip OnHold tickets
                    { slaDeadline: { lt: now } }, // SLA deadline has passed
                    {
                        OR: [
                            { lastStaffResponse: null }, // No staff response yet
                            { escalationStarted: null }, // No escalation started yet
                            { 
                                escalationStarted: { 
                                    lt: new Date(now.getTime() - 2 * 60 * 60 * 1000) // Last escalation was more than 2 hours ago
                                } 
                            }
                        ]
                    }
                ]
            }
        });
        
        // Convert to TicketPriorityContext format
        return tickets.map(ticket => ({
            channelId: ticket.channelId,
            priority: ticket.priority as TicketPriority,
            slaDeadline: ticket.slaDeadline,
            lastStaffResponse: ticket.lastStaffResponse || undefined,
            lastUserResponse: undefined,
            escalationStarted: ticket.escalationStarted || undefined,
            escalationCount: ticket.escalationCount,
            userPingStarted: undefined,
            userPingCount: 0
        }));
    }
    
    /**
     * Gets all tickets that need user pinging (placeholder for now)
     */
    async getTicketsNeedingUserPing(): Promise<TicketPriorityContext[]> {
        // User pinging functionality is not fully implemented in database yet
        // This is a placeholder to maintain interface compatibility
        return [];
    }

    /**
     * Updates channel name with priority emoji
     */
    async updateChannelName(channel: Discord.TextChannel, priority: TicketPriority): Promise<void> {
        const config = this.getPriorityConfig(priority);
        const currentName = channel.name;
        
        // Remove existing priority emoji if present
        let baseName = currentName;
        const priorityEmojis = ['🟢', '🟡', '🔴', '⏸️'];
        
        // Check if channel name starts with any priority emoji
        for (const emoji of priorityEmojis) {
            if (currentName.startsWith(emoji + '-')) {
                baseName = currentName.substring(emoji.length + 1); // Remove emoji and dash
                break;
            }
        }
        
        // Validate that the base name is in the correct format (category-userid)
        const baseNameParts = baseName.split('-');
        if (baseNameParts.length < 2 || baseNameParts[0] === '' || baseNameParts[baseNameParts.length - 1] === '') {
            console.warn(`Invalid channel name format: ${currentName}. Cannot update priority emoji.`);
            return;
        }
        
        // Add new priority emoji
        const newName = `${config.emoji}-${baseName}`;
        
        // Always update the channel name to ensure consistency
        if (newName !== currentName) {
            try {
                await channel.setName(newName);
                console.log(`Updated channel name from "${currentName}" to "${newName}"`);
            } catch (error) {
                console.error(`Failed to update channel name for ${channel.id}:`, error);
                throw error; // Re-throw to let caller handle
            }
        }
    }
    
    /**
     * Gets priority configuration
     */
    getPriorityConfig(priority: TicketPriority): PriorityConfig {
        return PRIORITY_CONFIGS[priority];
    }
    
    /**
     * Creates a ticket priority context with default low priority
     */
    async createDefaultPriority(channelId: string): Promise<TicketPriorityContext> {
        const config = this.getPriorityConfig(TicketPriority.Low);
        const slaDeadline = new Date(Date.now() + config.slaHours * 60 * 60 * 1000);
        
        // Create in database
        const ticket = await prisma.ticketPriorities.create({
            data: {
                channelId,
                priority: TicketPriority.Low,
                slaDeadline,
                escalationCount: 0
            }
        });
        
        return {
            channelId: ticket.channelId,
            priority: ticket.priority as TicketPriority,
            slaDeadline: ticket.slaDeadline,
            escalationCount: ticket.escalationCount,
            userPingCount: 0
        };
    }
    
    /**
     * Removes priority context when ticket is closed
     */
    async removePriority(channelId: string): Promise<void> {
        await prisma.ticketPriorities.delete({
            where: { channelId }
        });
        
        console.log(`Removed priority data for ticket ${channelId}`);
    }
    
    /**
     * Gets all priority configurations
     */
    getAllPriorityConfigs(): Record<TicketPriority, PriorityConfig> {
        return PRIORITY_CONFIGS;
    }
    
    /**
     * Restores priority states from database on bot startup
     */
    async restorePriorityStates(): Promise<void> {
    console.log('restorePriorityStates is not implemented.')
    return;
  }
}
