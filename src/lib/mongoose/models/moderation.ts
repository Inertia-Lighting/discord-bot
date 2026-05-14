import mongoose from 'mongoose';

import { MongoDB } from '@/common/mongo/mongo.js';
import type { DbModerationAction } from '@/types/index.js';

/* -------------------------------------------------------------------------- */

const db_moderation_action_records_collection_name = `${process.env.MONGO_MODERATION_ACTION_RECORDS_COLLECTION_NAME ?? ''}`;
if (db_moderation_action_records_collection_name.length < 1) throw new Error('Environment variable: MONGO_USERS_COLLECTION_NAME; is not set correctly.');

/* -------------------------------------------------------------------------- */

const ModerationActionSchema = new mongoose.Schema<DbModerationAction>({
    identity: {
        discord_user_id: { type: String, required: true },
        roblox_user_id: { type: String, required: true },
    },
    record: {
        id: { type: String, required: true, unique: true }, // UUIDv4
        type: { type: String, enum: ['WARN', 'TIMEOUT', 'MUTE', 'KICK', 'BAN'], required: true },
        epoch: { type: Number, required: true },
        reason: { type: String, required: true },
        staff_member_id: { type: String, required: true },
    },
}, { timestamps: true });

export const ModerationActionRecordModel = MongoDB.model<DbModerationAction>('ModerationAction', ModerationActionSchema, db_moderation_action_records_collection_name);
