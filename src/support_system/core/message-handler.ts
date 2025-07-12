// ------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
// ------------------------------------------------------------//

import { loadSupportSystemConfig } from '@root/support_system/config';
import { supportTicketDatabaseService } from '@root/support_system/core/ticket-database-service';
import * as Discord from 'discord.js';

const config = loadSupportSystemConfig();

/**
 * Handles message creation in ticket channels
 */
export async function handleTicketMessage(message: Discord.Message): Promise<void> {
    // Only process messages in ticket channels
    if (!message.guild || message.channel.parentId !== config.channels.ticketsCategoryId) {
        return;
    }

    // Skip bot messages
    if (message.author.bot) {
        return;
    }

    // Get the ticket from database
    const ticket = await supportTicketDatabaseService.getTicket(message.channel.id);
    if (!ticket) {
        return;
    }

    const member = message.member;
    if (!member) {
        return;
    }

    // Check if this is a staff member
    const isStaff = member.roles.cache.has(config.roles.staffRoleId) ||
                    member.roles.cache.has(config.roles.customerServiceRoleId) ||
                    member.roles.cache.has(config.roles.supportStaff.databaseRoleId) ||
                    member.roles.cache.has(config.roles.supportStaff.otherRoleId) ||
                    member.roles.cache.has(config.roles.supportStaff.productIssuesRoleId) ||
                    member.roles.cache.has(config.roles.supportStaff.productPurchasesRoleId) ||
                    member.roles.cache.has(config.roles.supportStaff.partnershipRequestsRoleId);

    // If staff member and no priority set, delete the message
    if (isStaff && !ticket.priority) {
        try {
            await message.delete();
            
            // Send ephemeral message to staff member
            const warningMessage = await message.channel.send({
                content: `${member}, please set a priority for this ticket before sending messages. Use the \`/priority\` command.`,
            });

            // Delete the warning message after 10 seconds
            setTimeout(() => {
                warningMessage.delete().catch(() => {});
            }, 10000);
        } catch (error) {
            console.error('Failed to delete staff message in unprioritized ticket:', error);
        }
        return;
    }

    // If staff member and priority is set, record staff response
    if (isStaff && ticket.priority) {
        await supportTicketDatabaseService.recordStaffResponse(message.channel.id);
    }

    // If ticket owner, record user response
    if (member.id === ticket.ownerId) {
        await supportTicketDatabaseService.recordUserResponse(message.channel.id);
    }
}