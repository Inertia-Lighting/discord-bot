// ------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
// ------------------------------------------------------------//

import * as Discord from 'discord.js';

/**
 * Represents a support category identifier
 */
export enum SupportCategoryId {
    Issues = 'ISSUES',
    Recovery = 'RECOVERY',
    Transfers = 'TRANSFERS',
    Transactions = 'TRANSACTIONS',
    PartnershipRequests = 'PARTNERS',
    Other = 'OTHER',
    DevelopmentApplication = 'DEVAPP'
}

/**
 * Represents the context for creating a support ticket
 */
export interface SupportTicketContext {
    guild: Discord.Guild;
    owner: Discord.GuildMember;
    channel?: Discord.TextChannel;
    createdAt: Date;
    categoryId: SupportCategoryId;
}

/**
 * Represents a support category configuration
 */
export interface SupportCategoryConfig {
    id: SupportCategoryId;
    name: string;
    description: string;
    staffRoleIds: string[];
    modalConfig: Discord.ModalComponentData;
    isEnabled: boolean;
}

/**
 * Interface for handling support category-specific logic
 */
export interface SupportCategoryHandler {
    readonly categoryId: SupportCategoryId;
    
    /**
     * Handles the modal submission for this support category
     */
    handleModalSubmission(
        interaction: Discord.ModalSubmitInteraction<'cached'>,
        context: SupportTicketContext
    ): Promise<void>;
    
    /**
     * Validates the modal input for this support category
     */
    validateInput(interaction: Discord.ModalSubmitInteraction<'cached'>): Promise<boolean>;
    
    /**
     * Gets the initial message content for the support ticket
     */
    getInitialMessage(context: SupportTicketContext): Promise<Discord.MessageCreateOptions>;
}

/**
 * Configuration for support ticket channels
 */
export interface SupportTicketChannelConfig {
    categoryId: string;
    transcriptsChannelId: string;
    staffRoleId: string;
    customerServiceRoleId: string;
    cleanupTimeoutMs: number;
    feedbackTimeoutMs: number;
}

/**
 * Interface for the support ticket service
 */
export interface SupportTicketService {
    /**
     * Creates a new support ticket channel
     */
    createTicketChannel(context: SupportTicketContext): Promise<Discord.TextChannel>;
    
    /**
     * Closes a support ticket channel
     */
    closeTicketChannel(
        channel: Discord.GuildTextBasedChannel,
        closedBy: Discord.GuildMember,
        reason: string,
        options?: {
            saveTranscript?: boolean;
            sendFeedback?: boolean;
        }
    ): Promise<void>;
    
    /**
     * Finds an existing ticket channel for a user and category
     */
    findExistingTicket(
        guild: Discord.Guild,
        userId: string,
        categoryId: SupportCategoryId
    ): Promise<Discord.TextChannel | null>;
}

/**
 * Interface for support category registry
 */
export interface SupportCategoryRegistry {
    /**
     * Registers a support category handler
     */
    registerCategory(config: SupportCategoryConfig, handler: SupportCategoryHandler): void;
    
    /**
     * Gets a support category handler by ID
     */
    getHandler(categoryId: SupportCategoryId): SupportCategoryHandler | null;
    
    /**
     * Gets a support category configuration by ID
     */
    getConfig(categoryId: SupportCategoryId): SupportCategoryConfig | null;
    
    /**
     * Gets all registered support categories
     */
    getAllCategories(): Array<{ config: SupportCategoryConfig; handler: SupportCategoryHandler }>;
    
    /**
     * Gets all enabled support categories
     */
    getEnabledCategories(): Array<{ config: SupportCategoryConfig; handler: SupportCategoryHandler }>;
}

/**
 * User satisfaction levels for feedback
 */
export interface SatisfactionLevel {
    key: string;
    label: string;
    description: string;
    color: number;
}

/**
 * Interface for validation service
 */
export interface ValidationService {
    /**
     * Validates environment variables required for support system
     */
    validateEnvironment(): void;
    
    /**
     * Validates user input for support categories
     */
    validateUserInput(categoryId: SupportCategoryId, input: Record<string, string>): Promise<boolean>;
}