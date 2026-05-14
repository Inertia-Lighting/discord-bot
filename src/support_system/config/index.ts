// ------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
// ------------------------------------------------------------//

import config from '@/utilities/bot_config.js';

import { SatisfactionLevel } from '../types/index.js'
;

/**
 * Configuration for support ticket channels
 */
export interface SupportSystemConfig {
    channels: {
        ticketsCategoryId: string;
        transcriptsChannelId: string;
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
    return {
        channels: {
            ticketsCategoryId: config.support_tickets_category_id!,
            transcriptsChannelId: config.support_tickets_transcripts_channel_id!,
            supportChannelId: config.support_information_channel_id,
        },
        roles: {
            staffRoleId: config.staff_role_id.id!,
            customerServiceRoleId: config.customer_service_role_id.id!,
            supportStaff: {
                databaseRoleId: config.support_staff_database_role_id!,
                otherRoleId: config.support_staff_other_role_id!,
                productIssuesRoleId: config.support_staff_product_issues_role_id!,
                productPurchasesRoleId: config.support_staff_product_purchases_role_id!,
                partnershipRequestsRoleId: config.partners_role_id!,
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