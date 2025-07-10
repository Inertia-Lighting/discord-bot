// ------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
// ------------------------------------------------------------//

import * as Discord from 'discord.js';

// Category handlers
import { ProductIssuesConfig, ProductIssuesHandler } from './categories/issues';
import { OtherQuestionsConfig, OtherQuestionsHandler } from './categories/other';
import { PartnershipRequestsConfig, PartnershipRequestsHandler } from './categories/partnerships';
import { AccountRecoveryConfig, AccountRecoveryHandler } from './categories/recovery';
import { ProductTransactionsConfig, ProductTransactionsHandler } from './categories/transactions';
import { ProductTransfersConfig, ProductTransfersHandler } from './categories/transfers';
import { loadSupportSystemConfig } from './config';
import { getEscalationService } from './core/escalation-service';
import { TicketPriorityServiceImpl } from './core/priority-service';
import { SupportCategoryRegistryImpl } from './core/registry';
import { SupportTicketServiceImpl } from './core/ticket-service';
import { 
    SupportCategoryConfig,
    SupportCategoryId, 
    SupportCategoryRegistry, 
    SupportTicketContext, 
    SupportTicketService,
    TicketPriorityService} from './types';

/**
 * Main support system manager
 */
export class SupportSystemManager {
    private registry: SupportCategoryRegistry;
    private ticketService: SupportTicketService;
    private priorityService: TicketPriorityService;
    private config: ReturnType<typeof loadSupportSystemConfig>;

    constructor() {
        this.config = loadSupportSystemConfig();
        this.registry = new SupportCategoryRegistryImpl();
        this.ticketService = new SupportTicketServiceImpl(this.config);
        this.priorityService = new TicketPriorityServiceImpl();
        
        this.initializeCategories();
    }

    /**
     * Initializes escalation monitoring service
     */
    initializeEscalationService(client: Discord.Client): void {
        const escalationService = getEscalationService(client);
        escalationService.start();
    }

    /**
     * Initialize all support categories
     */
    private initializeCategories(): void {
        // Product Issues
        const productIssuesConfig = {
            ...ProductIssuesConfig,
            staffRoleIds: [this.config.roles.supportStaff.productIssuesRoleId],
        };
        this.registry.registerCategory(productIssuesConfig, new ProductIssuesHandler());

        // Account Recovery
        const accountRecoveryConfig = {
            ...AccountRecoveryConfig,
            staffRoleIds: [this.config.roles.supportStaff.databaseRoleId],
        };
        this.registry.registerCategory(accountRecoveryConfig, new AccountRecoveryHandler());

        // Product Transfers
        const productTransfersConfig = {
            ...ProductTransfersConfig,
            staffRoleIds: [this.config.roles.supportStaff.databaseRoleId],
        };
        this.registry.registerCategory(productTransfersConfig, new ProductTransfersHandler());

        // Product Transactions
        const productTransactionsConfig = {
            ...ProductTransactionsConfig,
            staffRoleIds: [this.config.roles.supportStaff.productPurchasesRoleId],
        };
        this.registry.registerCategory(productTransactionsConfig, new ProductTransactionsHandler());

        // Partnership Requests
        const partnershipRequestsConfig = {
            ...PartnershipRequestsConfig,
            staffRoleIds: [this.config.roles.supportStaff.partnershipRequestsRoleId],
        };
        this.registry.registerCategory(partnershipRequestsConfig, new PartnershipRequestsHandler());

        // Other Questions
        const otherQuestionsConfig = {
            ...OtherQuestionsConfig,
            staffRoleIds: [
                this.config.roles.supportStaff.otherRoleId,
                this.config.roles.customerServiceRoleId,
            ],
        };
        this.registry.registerCategory(otherQuestionsConfig, new OtherQuestionsHandler());
    }

    /**
     * Gets all enabled support categories for UI display
     */
    getEnabledCategories(): Array<{
        id: SupportCategoryId;
        name: string;
        description: string;
    }> {
        return this.registry.getEnabledCategories().map(({ config }) => ({
            id: config.id,
            name: config.name,
            description: config.description,
        }));
    }

    /**
     * Gets modal configuration for a specific category
     */
    getModalConfig(categoryId: SupportCategoryId): Discord.ModalComponentData | null {
        const config = this.registry.getConfig(categoryId);
        return config?.modalConfig || null;
    }

    /**
     * Handles modal submission for a support category
     */
    async handleModalSubmission(
        interaction: Discord.ModalSubmitInteraction<'cached'>,
        categoryId: SupportCategoryId
    ): Promise<void> {
        const handler = this.registry.getHandler(categoryId);
        if (!handler) {
            throw new Error(`No handler found for category: ${categoryId}`);
        }

        // Create support ticket context
        const context: SupportTicketContext = {
            guild: interaction.guild,
            owner: interaction.member,
            createdAt: new Date(),
            categoryId,
        };

        // Create or get existing ticket channel
        context.channel = await this.ticketService.createTicketChannel(context);

        // Handle the modal submission
        await handler.handleModalSubmission(interaction, context);
    }

    /**
     * Closes a support ticket
     */
    async closeTicket(
        channel: Discord.GuildTextBasedChannel,
        closedBy: Discord.GuildMember,
        reason: string,
        options?: {
            saveTranscript?: boolean;
            sendFeedback?: boolean;
        }
    ): Promise<void> {
        await this.ticketService.closeTicketChannel(channel, closedBy, reason, options);
    }

    /**
     * Finds an existing ticket for a user and category
     */
    async findExistingTicket(
        guild: Discord.Guild,
        userId: string,
        categoryId: SupportCategoryId
    ): Promise<Discord.TextChannel | null> {
        return this.ticketService.findExistingTicket(guild, userId, categoryId);
    }

    /**
     * Changes the type of an existing support ticket
     */
    async changeTicketType(
        channel: Discord.TextChannel,
        newCategoryId: SupportCategoryId,
        changedBy: Discord.GuildMember
    ): Promise<void> {
        // Validate that the new category exists and is enabled
        const newConfig = this.registry.getConfig(newCategoryId);
        if (!newConfig || !newConfig.isEnabled) {
            throw new Error(`Invalid or disabled category: ${newCategoryId}`);
        }

        // Extract current ticket information from channel name
        let channelNameParts = channel.name.split('-');
        
        // Handle priority emoji prefix
        const priorityEmojis = ['🟢', '🟡', '🔴', '⏸️'];
        for (const emoji of priorityEmojis) {
            if (channel.name.startsWith(emoji + '-')) {
                // Remove emoji prefix and re-split
                const nameWithoutEmoji = channel.name.substring(emoji.length + 1);
                channelNameParts = nameWithoutEmoji.split('-');
                break;
            }
        }
        
        if (channelNameParts.length < 2) {
            throw new Error('Invalid ticket channel name format');
        }

        const currentCategoryId = channelNameParts[0].toUpperCase();
        const userId = channelNameParts[1];

        // Check if it's already the same type
        if (currentCategoryId === newCategoryId) {
            throw new Error('Ticket is already of the specified type');
        }

        // Update channel name (preserving priority emoji)
        const currentPriority = await this.priorityService.getPriority(channel.id);
        const newChannelName = `${newCategoryId}-${userId}`.toLowerCase();
        
        // If there's a priority, update the channel name with the priority emoji
        if (currentPriority) {
            await this.priorityService.updateChannelName(channel, currentPriority.priority);
        } else {
            await channel.setName(newChannelName);
        }

        // Update channel topic
        const ticketOwner = await channel.client.users.fetch(userId);
        const newChannelTopic = `${ticketOwner} | ${newCategoryId} | Opened on <t:${Math.floor(channel.createdTimestamp! / 1000)}:F> | Staff may close this ticket using the close_ticket command.`;
        await channel.setTopic(newChannelTopic);

        // Update permissions based on new category
        await this.updateChannelPermissions(channel, newConfig);

        // Send notification message
        await channel.send({
            embeds: [
                {
                    color: 0x00ff00,
                    title: 'Ticket Type Changed',
                    description: `This ticket has been changed from **${currentCategoryId}** to **${newCategoryId}** by ${changedBy}.`,
                    timestamp: new Date().toISOString(),
                },
            ],
        });
    }

    /**
     * Gets the priority service instance
     */
    getPriorityService(): TicketPriorityService {
        return this.priorityService;
    }

    /**
     * Records a staff response for escalation tracking
     */
    async recordStaffResponse(channelId: string, staffMember: Discord.GuildMember): Promise<void> {
        await this.priorityService.recordStaffResponse(channelId, staffMember);
    }

    /**
     * Updates channel permissions based on category configuration
     */
    private async updateChannelPermissions(
        channel: Discord.TextChannel,
        categoryConfig: SupportCategoryConfig
    ): Promise<void> {
        // Get the current permission overwrites
        const currentOverwrites = Array.from(channel.permissionOverwrites.cache.values());
        
        // Update staff role permissions for the new category
        const staffRoleOverwrites = categoryConfig.staffRoleIds.map(roleId => ({
            id: roleId,
            allow: [Discord.PermissionFlagsBits.ViewChannel, Discord.PermissionFlagsBits.SendMessages],
        }));

        // Keep existing overwrites for non-staff roles and add new staff role permissions
        const newOverwrites = [
            ...currentOverwrites.filter(overwrite => 
                !categoryConfig.staffRoleIds.includes(overwrite.id) &&
                overwrite.id !== this.config.roles.customerServiceRoleId &&
                overwrite.id !== this.config.roles.staffRoleId
            ),
            ...staffRoleOverwrites,
            {
                id: this.config.roles.customerServiceRoleId,
                allow: [Discord.PermissionFlagsBits.ViewChannel, Discord.PermissionFlagsBits.SendMessages],
            },
            {
                id: this.config.roles.staffRoleId,
                allow: [Discord.PermissionFlagsBits.ViewChannel],
                deny: [Discord.PermissionFlagsBits.SendMessages],
            },
        ];

        await channel.permissionOverwrites.set(newOverwrites);
    }
}

// Export singleton instance
export const supportSystemManager = new SupportSystemManager();