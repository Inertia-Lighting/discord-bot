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
        const slaDeadline = new Date(Date.now() + config.slaHours * 60 * 60 * 1000);
        
        const existingContext = ticketPriorities.get(channelId);
        
        const context: TicketPriorityContext = {
            channelId,
            priority,
            slaDeadline,
            lastStaffResponse: existingContext?.lastStaffResponse,
            escalationStarted: undefined, // Reset escalation when priority changes
            escalationCount: 0
        };
        
        ticketPriorities.set(channelId, context);
        
        // Update channel name with priority emoji
        const channel = await setBy.guild.channels.fetch(channelId);
        if (channel?.isTextBased() && channel.type === Discord.ChannelType.GuildText) {
            await this.updateChannelName(channel, priority);
        }
        
        // Send priority update message
        if (channel?.isTextBased()) {
            await channel.send({
                embeds: [
                    CustomEmbed.from({
                        color: config.color,
                        title: `Priority Updated - ${config.label}`,
                        description: [
                            `Ticket priority has been set to **${config.label}** by ${setBy}.`,
                            '',
                            `**SLA Deadline:** <t:${Math.floor(slaDeadline.getTime() / 1000)}:R>`,
                            `**Expected Response Time:** ${config.slaHours} ${config.slaHours === 1 ? 'hour' : 'hours'}`
                        ].join('\n'),
                        timestamp: new Date().toISOString()
                    })
                ],
            });
        }
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
        
        ticketPriorities.set(channelId, context);
        
        // Log the staff response for debugging
        console.log(`Staff response recorded for ticket ${channelId} by ${staffMember.displayName}`);
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
     * Updates channel name with priority emoji
     */
    async updateChannelName(channel: Discord.TextChannel, priority: TicketPriority): Promise<void> {
        const config = this.getPriorityConfig(priority);
        const currentName = channel.name;
        
        // Remove existing priority emoji if present
        let baseName = currentName;
        for (const priorityConfig of Object.values(PRIORITY_CONFIGS)) {
            if (currentName.startsWith(priorityConfig.emoji + '-')) {
                baseName = currentName.substring(2); // Remove emoji and dash
                break;
            }
        }
        
        // Add new priority emoji
        const newName = `${config.emoji}-${baseName}`;
        
        if (newName !== currentName) {
            await channel.setName(newName);
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
            escalationCount: 0
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