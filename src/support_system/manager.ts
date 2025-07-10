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
import { SupportCategoryRegistryImpl } from './core/registry';
import { SupportTicketServiceImpl } from './core/ticket-service';
import { 
    SupportCategoryId, 
    SupportCategoryRegistry, 
    SupportTicketContext, 
    SupportTicketService} from './types';

/**
 * Main support system manager
 */
export class SupportSystemManager {
    private registry: SupportCategoryRegistry;
    private ticketService: SupportTicketService;
    private config: ReturnType<typeof loadSupportSystemConfig>;

    constructor() {
        this.config = loadSupportSystemConfig();
        this.registry = new SupportCategoryRegistryImpl();
        this.ticketService = new SupportTicketServiceImpl(this.config);
        
        this.initializeCategories();
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
}

// Export singleton instance
export const supportSystemManager = new SupportSystemManager();