// ------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved     //
// ------------------------------------------------------------//

import type MongoDB from 'mongodb';

import { AccountType, Prisma, Verification } from '@//lib/prisma.js'
;

// ------------------------------------------------------------//
//                        Helper Types                         //
// ------------------------------------------------------------//

export type DistributiveOmit<T, K extends keyof T> = T extends unknown ? Omit<T, K> : never;

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

export interface DbProductData {
    _id: MongoDB.ObjectId;
    roblox_product_id: string;
    viewable: boolean;
    purchasable: boolean;
    downloadable: boolean;
    code: string;
    name: string;
    description: string;
    price_in_usd: string;
    price_in_robux: number;
    price_in_lumens: number;
    roblox_assets: {
        product_preview_image?: string;
    };
    sorting_priority: number;
    tags: string[];
    supporter_perk: boolean;
}

// ------------------------------------------------------------//

export interface DbUserIdentity {
    discord_user_id: string;
    roblox_user_id: string;
}

export interface DbUserProducts {
    [product_code: string]: boolean;
}

export interface DbUserTicketBlacklist {
    blacklisted: boolean;
    reason: string;
}

export interface DbUserData {
    _id: MongoDB.ObjectId;
    identity: DbUserIdentity;
    lumens: number;
    products: DbUserProducts;
    ticket_blacklist?: DbUserTicketBlacklist
}

export interface DbUserDataArray {
    _id: MongoDB.ObjectId;
    identity: DbUserIdentity;
    lumens: number;
    products: string[];
    ticket_blacklist?: DbUserTicketBlacklist
}

// ------------------------------------------------------------//

export interface DbBlacklistedUserRecord {
    _id: MongoDB.ObjectId;
    identity: DbUserIdentity;
    reason: string;
    epoch: number;
    staff_member_id: string;
}

// ------------------------------------------------------------//

export type DbModerationActionType = 'WARN' | 'TIMEOUT' | 'MUTE' | 'KICK' | 'BAN';

export interface DbModerationActionRecord {
    id: string, // a UUIDv4 string
    type: DbModerationActionType;
    epoch: number;
    reason: string;
    staff_member_id: string;
}

export interface DbModerationAction {
    identity: DbModerationActionUserIdentity;
    record: DbModerationActionRecord;
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