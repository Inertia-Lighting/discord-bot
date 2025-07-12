// ------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
// ------------------------------------------------------------//

import { SatisfactionLevel } from '../types';

/**
 * Configuration for support ticket channels
 */
export interface SupportSystemConfig {
    channels: {
        ticketsCategoryId: string;
        transcriptsChannelId: string;
        slaNotificationsChannelId: string;
        supportChannelId?: string;
    };
    roles: {
        staffRoleId: string;
        customerServiceRoleId: string;
        supportStaff: {
            databaseRoleId: string;
            otherRoleId: string;
            productIssuesRoleId: string;
            productPurchasesRoleId: string;
            partnershipRequestsRoleId: string;
        };
    };
    timeouts: {
        cleanupTimeoutMs: number;
        feedbackTimeoutMs: number;
    };
    satisfaction: {
        levels: Record<string, SatisfactionLevel>;
    };
}

/**
 * Loads configuration from environment variables
 */
export function loadSupportSystemConfig(): SupportSystemConfig {
    const requiredEnvVars = [
        'BOT_SUPPORT_TICKETS_CATEGORY_ID',
        'BOT_SUPPORT_TICKETS_TRANSCRIPTS_CHANNEL_ID',
        'BOT_SUPPORT_TICKETS_SLA_NOTIFICATIONS_CHANNEL_ID',
        'BOT_STAFF_ROLE_ID',
        'BOT_CUSTOMER_SERVICE_ROLE_ID',
        'BOT_SUPPORT_STAFF_DATABASE_ROLE_ID',
        'BOT_SUPPORT_STAFF_OTHER_ROLE_ID',
        'BOT_SUPPORT_STAFF_PRODUCT_ISSUES_ROLE_ID',
        'BOT_SUPPORT_STAFF_PRODUCT_PURCHASES_ROLE_ID',
        'BOT_SUPPORT_STAFF_PARTNERSHIP_REQUESTS_ROLE_ID',
    ];

    // Validate environment variables
    for (const envVar of requiredEnvVars) {
        if (!process.env[envVar]) {
            throw new Error(`Environment variable ${envVar} is not set correctly.`);
        }
    }

    return {
        channels: {
            ticketsCategoryId: process.env.BOT_SUPPORT_TICKETS_CATEGORY_ID!,
            transcriptsChannelId: process.env.BOT_SUPPORT_TICKETS_TRANSCRIPTS_CHANNEL_ID!,
            slaNotificationsChannelId: process.env.BOT_SUPPORT_TICKETS_SLA_NOTIFICATIONS_CHANNEL_ID!,
            supportChannelId: process.env.BOT_SUPPORT_CHANNEL_ID,
        },
        roles: {
            staffRoleId: process.env.BOT_STAFF_ROLE_ID!,
            customerServiceRoleId: process.env.BOT_CUSTOMER_SERVICE_ROLE_ID!,
            supportStaff: {
                databaseRoleId: process.env.BOT_SUPPORT_STAFF_DATABASE_ROLE_ID!,
                otherRoleId: process.env.BOT_SUPPORT_STAFF_OTHER_ROLE_ID!,
                productIssuesRoleId: process.env.BOT_SUPPORT_STAFF_PRODUCT_ISSUES_ROLE_ID!,
                productPurchasesRoleId: process.env.BOT_SUPPORT_STAFF_PRODUCT_PURCHASES_ROLE_ID!,
                partnershipRequestsRoleId: process.env.BOT_SUPPORT_STAFF_PARTNERSHIP_REQUESTS_ROLE_ID!,
            },
        },
        timeouts: {
            cleanupTimeoutMs: 10_000, // 10 seconds
            feedbackTimeoutMs: 30 * 60_000, // 30 minutes
        },
        satisfaction: {
            levels: {
                highest_satisfaction: {
                    key: 'highest_satisfaction',
                    label: 'Excellent',
                    description: 'Support went above and beyond expectations!',
                    color: 0x00FF00,
                },
                high_satisfaction: {
                    key: 'high_satisfaction',
                    label: 'Good',
                    description: 'Support was able to help me without issues!',
                    color: 0x77ff00,
                },
                medium_satisfaction: {
                    key: 'medium_satisfaction',
                    label: 'Decent',
                    description: 'Support was able to help me with little issues!',
                    color: 0xFFFF00,
                },
                low_satisfaction: {
                    key: 'low_satisfaction',
                    label: 'Bad',
                    description: 'Support wasn\'t able to help me properly!',
                    color: 0xff7700,
                },
                lowest_satisfaction: {
                    key: 'lowest_satisfaction',
                    label: 'Horrible',
                    description: 'Support staff need better training!',
                    color: 0xFF0000,
                },
            },
        },
    };
}