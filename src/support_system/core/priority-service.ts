// ------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
// ------------------------------------------------------------//

import { CustomEmbed } from '@root/common/message';
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
 * In-memory storage for ticket priorities
 * In production, this would be stored in the database
 */
const ticketPriorities = new Map<string, TicketPriorityContext>();

/**
 * Implementation of the ticket priority service
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
        
        const existingContext = ticketPriorities.get(channelId);
        
        const context: TicketPriorityContext = {
            channelId,
            priority,
            slaDeadline,
            lastStaffResponse: existingContext?.lastStaffResponse,
            lastUserResponse: existingContext?.lastUserResponse,
            escalationStarted: undefined, // Reset escalation when priority changes
            escalationCount: 0,
            userPingStarted: undefined,
            userPingCount: 0
        };
        
        ticketPriorities.set(channelId, context);
        
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
        return ticketPriorities.get(channelId) || null;
    }
    
    /**
     * Checks if SLA deadline has passed for a ticket
     */
    async checkSLADeadline(channelId: string): Promise<boolean> {
        const context = ticketPriorities.get(channelId);
        if (!context) return false;
        
        return new Date() > context.slaDeadline;
    }
    
    /**
     * Records staff response to stop escalation
     */
    async recordStaffResponse(channelId: string, staffMember: Discord.GuildMember): Promise<void> {
        const context = ticketPriorities.get(channelId);
        if (!context) return;
        
        context.lastStaffResponse = new Date();
        context.escalationStarted = undefined;
        context.escalationCount = 0;
        
        // Start user ping timer when staff responds
        if (!context.userPingStarted) {
            context.userPingStarted = new Date();
            context.userPingCount = 0;
        }
        
        ticketPriorities.set(channelId, context);
        
        // Log the staff response for debugging
        console.log(`Staff response recorded for ticket ${channelId} by ${staffMember.displayName}`);
    }
    
    /**
     * Records user response to stop user pinging
     */
    async recordUserResponse(channelId: string, user: Discord.GuildMember): Promise<void> {
        const context = ticketPriorities.get(channelId);
        if (!context) return;
        
        context.lastUserResponse = new Date();
        // Reset user pinging when user responds
        context.userPingStarted = undefined;
        context.userPingCount = 0;
        
        ticketPriorities.set(channelId, context);
        
        // Log the user response for debugging
        console.log(`User response recorded for ticket ${channelId} by ${user.displayName}`);
    }
    
    /**
     * Starts escalation for a ticket
     */
    async startEscalation(channelId: string): Promise<void> {
        const context = ticketPriorities.get(channelId);
        if (!context) return;
        
        if (!context.escalationStarted) {
            context.escalationStarted = new Date();
        }
        
        context.escalationCount++;
        ticketPriorities.set(channelId, context);
    }
    
    /**
     * Gets all tickets that need escalation
     */
    async getTicketsNeedingEscalation(): Promise<TicketPriorityContext[]> {
        const now = new Date();
        const needingEscalation: TicketPriorityContext[] = [];
        
        for (const context of ticketPriorities.values()) {
            // Skip OnHold tickets - they don't have SLA requirements
            if (context.priority === TicketPriority.OnHold) {
                continue;
            }
            
            // Check if SLA deadline has passed
            if (now > context.slaDeadline) {
                // If no staff response yet, or last escalation was more than 2 hours ago
                if (!context.lastStaffResponse || now > context.slaDeadline) {
                    const timeSinceLastEscalation = context.escalationStarted ? 
                        now.getTime() - context.escalationStarted.getTime() : 
                        Infinity;
                    
                    // Escalate every 2 hours (2 * 60 * 60 * 1000 = 7200000ms)
                    if (timeSinceLastEscalation > 7200000 || !context.escalationStarted) {
                        needingEscalation.push(context);
                    }
                }
            }
        }
        
        return needingEscalation;
    }
    
    /**
     * Gets all tickets that need user pinging
     */
    async getTicketsNeedingUserPing(): Promise<TicketPriorityContext[]> {
        const now = new Date();
        const needingUserPing: TicketPriorityContext[] = [];
        
        for (const context of ticketPriorities.values()) {
            if (this.shouldPingUser(context, now)) {
                needingUserPing.push(context);
            }
        }
        
        return needingUserPing;
    }

    /**
     * Determines if a user should be pinged for a ticket
     */
    private shouldPingUser(context: TicketPriorityContext, now: Date): boolean {
        // Check if there was a staff response and user needs to be pinged
        if (!context.lastStaffResponse || !context.userPingStarted) {
            return false;
        }

        const timeSinceStaffResponse = now.getTime() - context.lastStaffResponse.getTime();
        
        // 24 hours = 24 * 60 * 60 * 1000 = 86400000ms
        // 4 hours = 4 * 60 * 60 * 1000 = 14400000ms
        
        // If it's been 24 hours since staff response
        if (timeSinceStaffResponse < 86400000) {
            return false;
        }

        // Check if user has responded since staff response
        const userRespondedAfterStaff = context.lastUserResponse && 
            context.lastUserResponse.getTime() > context.lastStaffResponse.getTime();
        
        if (userRespondedAfterStaff) {
            return false;
        }

        const timeSinceUserPingStarted = now.getTime() - context.userPingStarted.getTime();
        
        // Ping every 4 hours or if this is the first ping
        return timeSinceUserPingStarted >= 14400000 || context.userPingCount === 0;
    }
    
    /**
     * Updates channel name with priority emoji
     */
    async updateChannelName(channel: Discord.TextChannel, priority: TicketPriority): Promise<void> {
        const config = this.getPriorityConfig(priority);
        const currentName = channel.name;
        
        // Remove existing priority emoji if present
        let baseName = currentName;
        for (const priorityConfig of Object.values(PRIORITY_CONFIGS)) {
            if (currentName.startsWith(priorityConfig.emoji + '-')) {
                baseName = currentName.substring(priorityConfig.emoji.length + 1); // Remove emoji and dash
                break;
            }
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
        
        const context: TicketPriorityContext = {
            channelId,
            priority: TicketPriority.Low,
            slaDeadline,
            escalationCount: 0,
            userPingCount: 0
        };
        
        ticketPriorities.set(channelId, context);
        return context;
    }
    
    /**
     * Removes priority context when ticket is closed
     */
    async removePriority(channelId: string): Promise<void> {
        ticketPriorities.delete(channelId);
    }
    
    /**
     * Gets all priority configurations
     */
    getAllPriorityConfigs(): Record<TicketPriority, PriorityConfig> {
        return PRIORITY_CONFIGS;
    }
}