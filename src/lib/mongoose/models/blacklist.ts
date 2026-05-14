import mongoose from 'mongoose';

import { MongoDB } from '@/common/mongo/mongo.js';
import type { DbBlacklistedUserRecord } from '@/types/index.js';

/* -------------------------------------------------------------------------- */

const db_blacklisted_users_collection_name = `${process.env.MONGO_BLACKLISTED_USERS_COLLECTION_NAME ?? ''}`;
if (db_blacklisted_users_collection_name.length < 1) throw new Error('Environment variable: MONGO_USERS_COLLECTION_NAME; is not set correctly.');

/* -------------------------------------------------------------------------- */

const BlacklistSchema = new mongoose.Schema<DbBlacklistedUserRecord>({
    identity: {
        discord_user_id: { type: String, required: true },
        roblox_user_id: { type: String, required: true },
    },
    reason: { type: String, required: true },
    epoch: { type: Number, required: true },
    staff_member_id: { type: String, required: true },
}, { timestamps: true });

export const BlacklistModel = MongoDB.model<DbBlacklistedUserRecord>('Blacklist', BlacklistSchema, db_blacklisted_users_collection_name);