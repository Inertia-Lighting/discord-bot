// ------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
// ------------------------------------------------------------//

import { loadSupportSystemConfig } from '@root/support_system/config';
import { supportTicketDatabaseService } from '@root/support_system/core/ticket-database-service';
import * as Discord from 'discord.js';

const config = loadSupportSystemConfig();

/**
 * Cleans up orphaned tickets on bot startup
 */
export async function performStartupCleanup(client: Discord.Client): Promise<void> {
    console.log('Starting support ticket cleanup...');

    try {
        // Get all tickets from database
        const tickets = await supportTicketDatabaseService.getAllTickets();
        
        if (tickets.length === 0) {
            console.log('No tickets found in database.');
            return;
        }

        console.log(`Found ${tickets.length} tickets in database. Checking for orphaned tickets...`);
        
        let cleanedCount = 0;
        
        for (const ticket of tickets) {
            try {
                // Try to fetch the channel
                const channel = await client.channels.fetch(ticket.channelId);
                
                // Check if channel exists and is in the correct category
                if (!channel || 
                    !channel.isTextBased() || 
                    !('parentId' in channel) ||
                    channel.parentId !== config.channels.ticketsCategoryId) {
                    
                    console.log(`Cleaning up orphaned ticket: ${ticket.channelId}`);
                    
                    // Delete the ticket from database
                    await supportTicketDatabaseService.deleteTicket(ticket.channelId);
                    cleanedCount++;
                }
            } catch (error) {
                // Channel doesn't exist, clean it up
                console.log(`Cleaning up orphaned ticket (channel not found): ${ticket.channelId}`);
                
                try {
                    await supportTicketDatabaseService.deleteTicket(ticket.channelId);
                    cleanedCount++;
                } catch (deleteError) {
                    console.error(`Failed to delete orphaned ticket ${ticket.channelId}:`, deleteError);
                }
            }
        }

        console.log(`Startup cleanup completed. Cleaned ${cleanedCount} orphaned tickets.`);
        
    } catch (error) {
        console.error('Error during startup cleanup:', error);
    }
}

/**
 * Performs periodic cleanup of auto-close tickets
 */
export async function performPeriodicCleanup(client: Discord.Client): Promise<void> {
    try {
        // Get tickets that need auto-close
        const ticketsToClose = await supportTicketDatabaseService.getTicketsNeedingAutoClose();
        
        for (const ticket of ticketsToClose) {
            try {
                const channel = await client.channels.fetch(ticket.channelId);
                
                if (channel && channel.isTextBased() && 'parentId' in channel && channel.parentId === config.channels.ticketsCategoryId) {
                    // Mark as scheduled for auto-close
                    await supportTicketDatabaseService.markForAutoClose(ticket.channelId);
                    
                    // Send auto-close notification
                    if (channel.isSendable()) {
                        await channel.send({
                            embeds: [
                                {
                                    color: 0xff9900,
                                    title: 'Ticket Auto-Close',
                                    description: 'This ticket will be automatically closed due to inactivity (no response from ticket owner for 7 days after staff response).',
                                    timestamp: new Date().toISOString(),
                                },
                            ],
                        });
                    }
                    
                    // Close the ticket after a delay
                    setTimeout(async () => {
                        try {
                            if ('guild' in channel) {
                                // Auto-close directly without importing manager to avoid circular dependencies
                                await supportTicketDatabaseService.deleteTicket(ticket.channelId);
                                
                                // Delete the channel
                                await channel.delete('Auto-closed due to inactivity');
                                
                                console.log(`Auto-closed ticket ${ticket.channelId} due to inactivity`);
                            }
                        } catch (error) {
                            console.error(`Failed to auto-close ticket ${ticket.channelId}:`, error);
                        }
                    }, 30000); // 30 second delay
                }
            } catch (error) {
                console.error(`Error processing auto-close ticket ${ticket.channelId}:`, error);
            }
        }
    } catch (error) {
        console.error('Error during periodic cleanup:', error);
    }
}