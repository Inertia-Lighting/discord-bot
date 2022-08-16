//------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
//------------------------------------------------------------//

import type MongoDB from 'mongodb';

//------------------------------------------------------------//
//                      Database Schemas                      //
//------------------------------------------------------------//

export interface DbProductData {
    _id: MongoDB.ObjectId;
    roblox_product_id: string;
    public: boolean;
    /** @deprecated */
    old_code: string;
    code: string;
    name: string;
    description: string;
    price_in_usd: string;
    price_in_robux: number;
    roblox_assets: {
        product_preview_image?: string;
    };
    sorting_priority: number;
    tags: string[];
    supporter_perk: boolean;
}

//------------------------------------------------------------//

export interface DbUserIdentity {
    discord_user_id: string;
    roblox_user_id: string;
}

export interface DbUserProducts {
    [product_code: string]: boolean;
}

export interface DbUserData {
    _id: MongoDB.ObjectId;
    identity: DbUserIdentity;
    karma: number;
    products: DbUserProducts;
}

//------------------------------------------------------------//

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface DbBlacklistedUserIdentity extends DbUserIdentity {}

export interface DbBlacklistedUserRecord {
    _id: MongoDB.ObjectId;
    identity: DbBlacklistedUserIdentity;
    reason: string;
    epoch: number;
    staff_member_id: string;
}

//------------------------------------------------------------//

export interface DbPendingVerificationData {
    _id: MongoDB.ObjectId;
    identity: Partial<DbUserIdentity>;
    code: string;
    creation_epoch: number;
}

//------------------------------------------------------------//

export interface DbRobloxPurchaseRecord {
    _id: MongoDB.ObjectId;
    roblox_user_id: string;
    roblox_purchase_id: string;
    product_codes: string[];
}

export interface DbPayPalPurchaseRecord {
    _id: MongoDB.ObjectId;
    paypal_order_id: string;
    discord_user_id: string;
    product_codes: string[];
}
