// ------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved     //
// ------------------------------------------------------------//

import { AccountType, Prisma, Verification } from '@/lib/prisma.js';

// ------------------------------------------------------------//
//                        Helper Types                         //
// ------------------------------------------------------------//

type DistributiveOmit<T, K extends keyof T> = T extends unknown ? Omit<T, K> : never;

// ------------------------------------------------------------//
//                      Prisma Database Schemas                //
// ------------------------------------------------------------//

type PrismaUserData = Prisma.UserGetPayload<{
    select: {
        discordId: true;
        transactions: true;
    };
}>;

type PrismaProductData = Prisma.ProductsGetPayload<{
    select: {
        code: true;
        name: true;
        viewable: true;
    };
}>;

interface QSTopic {
    id: string;
    title: string;
    searchable_queries: string[];
    support_contents: string;
}

interface UserVerificationContextFetch {
    verification_code: Verification['code'];
    account_id: string;
    account_type: AccountType;
}

interface FailedRequest {
    success: false;
    message: string;
    errors: object; // Contains detailed error info
}

type v3VerificationFetch = UserVerificationContextFetch | FailedRequest;

declare global {
    /* -------------------------------------------------------------------------- */
    /*                                Interactions                                */
    /* -------------------------------------------------------------------------- */

    type InteractionIdentifier = string;

    type InteractionType = Discord.InteractionType;

    type InteractionData = DistributiveOmit<Discord.ApplicationCommandData, 'name'> | undefined;

    interface InteractionMetadata {
        [key: string]: unknown;
        required_run_context: InteractionRunContext;
        required_access_level: InteractionAccessLevel;
        dev_only?: boolean;
    }

    type InteractionHandler = (client: Discord.Client<true>, interaction: Discord.Interaction) => Promise<void>;

    const enum InteractionRunContext {
        Global = 1,
        Guild = 2,
        DirectMessage = 3,
    }

    interface StaffRole {
        id: string | number;
        access_level: PermissionLevel;
    }

    const enum PermissionLevel {
        Public = 1,
        Staff,
        CustomerService,
        Dev,
        SeniorDev,
        Moderators,
        Admins,
        TeamLeaders,
        CompanyManagement,
        BotAdmin,
    }
}
