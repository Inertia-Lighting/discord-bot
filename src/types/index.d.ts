// ------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved     //
// ------------------------------------------------------------//

import type MongoDB from 'mongodb';

import { AccountType, Prisma, Verification } from '@/lib/prisma.js'

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
    }
}>

type PrismaProductData = Prisma.ProductsGetPayload<{
    select: {
        code: true;
        name: true;
        viewable: true;
    }
}>

// ------------------------------------------------------------//
//                      Database Schemas                       //
// ------------------------------------------------------------//

interface DbUserIdentity {
    discord_user_id: string;
    roblox_user_id: string;
}

interface DbUserProducts {
    [product_code: string]: boolean;
}

interface DbUserTicketBlacklist {
    blacklisted: boolean;
    reason: string;
}

interface DbUserData {
    _id: MongoDB.ObjectId;
    identity: DbUserIdentity;
    lumens: number;
    products: DbUserProducts;
    ticket_blacklist?: DbUserTicketBlacklist
}

// ------------------------------------------------------------//

interface DbBlacklistedUserRecord {
    _id: MongoDB.ObjectId;
    identity: DbUserIdentity;
    reason: string;
    epoch: number;
    staff_member_id: string;
}

// ------------------------------------------------------------//

type DbModerationActionType = 'WARN' | 'TIMEOUT' | 'MUTE' | 'KICK' | 'BAN';

interface DbModerationActionRecord {
    id: string, // a UUIDv4 string
    type: DbModerationActionType;
    epoch: number;
    reason: string;
    staff_member_id: string;
}

interface DbModerationAction {
    identity: DbModerationActionUserIdentity;
    record: DbModerationActionRecord;
}

interface QSTopic {
  id: string;
  title: string;
  searchable_queries: string[],
  support_contents: string;
}

interface UserVerificationContextFetch {
    verification_code: Verification['code'];
    account_id: string;
    account_type: AccountType;
}

interface FailedRequest {
    success: false,
    message: string,
    errors: object, // Contains detailed error info
}

type v3VerificationFetch = UserVerificationContextFetch | FailedRequest