import mongoose from 'mongoose';

import { MongoDB } from '@/common/mongo/mongo.js';
import type { DbUserData } from '@/types/index.js';

/* -------------------------------------------------------------------------- */

const db_users_collection_name = `${process.env.MONGO_USERS_COLLECTION_NAME ?? ''}`;
if (db_users_collection_name.length < 1) throw new Error('Environment variable: MONGO_USERS_COLLECTION_NAME; is not set correctly.');

/* -------------------------------------------------------------------------- */
const UserSchema = new mongoose.Schema<DbUserData>({
    identity: {
        discord_user_id: { type: String, required: true },
        roblox_user_id: { type: String, required: true },
    },
    lumens: { type: Number, required: true, default: 0 },
    products: { type: mongoose.Schema.Types.Mixed, required: true, default: {} },
    ticket_blacklist: {
        blacklisted: Boolean,
        reason: String,
    },
}, { timestamps: true });

export const UserModel = MongoDB.model<DbUserData>('User', UserSchema, db_users_collection_name);
