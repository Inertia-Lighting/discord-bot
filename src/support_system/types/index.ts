// ------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
// ------------------------------------------------------------//

import * as Discord from 'discord.js';

/**
 * Ticket priority levels
 */
export enum TicketPriority {
    Low = 'low',
    Medium = 'medium',
    High = 'high',
    OnHold = 'onhold'
}

/**
 * Priority configuration with SLA and emoji
 */
export interface PriorityConfig {
    priority: TicketPriority;
    emoji: string;
    slaHours: number;
    color: number;
    label: string;
}

/**
 * Ticket priority context information
 */
export interface TicketPriorityContext {
    channelId: string;
    priority: TicketPriority;
    slaDeadline: Date;
    lastStaffResponse?: Date;
    lastUserResponse?: Date;
    escalationStarted?: Date;
    escalationCount: number;
    userPingStarted?: Date;
    userPingCount: number;
}

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
    ticketService: SupportTicketService;
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

/**
 * Interface for ticket priority service
 */
export interface TicketPriorityService {
    /**
     * Sets the priority for a ticket channel
     */
    setPriority(channelId: string, priority: TicketPriority, setBy: Discord.GuildMember): Promise<void>;
    
    /**
     * Gets the priority context for a ticket channel
     */
    getPriority(channelId: string): Promise<TicketPriorityContext | null>;
    
    /**
     * Checks if SLA deadline has passed for a ticket
     */
    checkSLADeadline(channelId: string): Promise<boolean>;
    
    /**
     * Records staff response to stop escalation
     */
    recordStaffResponse(channelId: string, staffMember: Discord.GuildMember): Promise<void>;
    
    /**
     * Records user response to stop user pinging
     */
    recordUserResponse(channelId: string, user: Discord.GuildMember): Promise<void>;
    
    /**
     * Starts escalation for a ticket
     */
    startEscalation(channelId: string): Promise<void>;
    
    /**
     * Gets all tickets that need escalation
     */
    getTicketsNeedingEscalation(): Promise<TicketPriorityContext[]>;
    
    /**
     * Gets all tickets that need user pinging
     */
    getTicketsNeedingUserPing(): Promise<TicketPriorityContext[]>;
    
    /**
     * Updates channel name with priority emoji
     */
    updateChannelName(channel: Discord.TextChannel, priority: TicketPriority): Promise<void>;
    
    /**
     * Gets priority configuration
     */
    getPriorityConfig(priority: TicketPriority): PriorityConfig;
    
    /**
     * Restores priority states from database on bot startup
     */
    restorePriorityStates(): Promise<void>;
}