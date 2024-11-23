//------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
//------------------------------------------------------------//

import { v4 as uuid_v4 } from 'uuid';

import { DbModerationAction } from '@root/types';

import { go_mongo_db } from '@root/common/mongo/mongo';

//------------------------------------------------------------//

const db_database_name = `${process.env.MONGO_DATABASE_NAME ?? ''}`;
if (db_database_name.length < 1) throw new Error('Environment variable: MONGO_DATABASE_NAME; is not set correctly.');

const db_moderation_action_records_collection_name = `${process.env.MONGO_MODERATION_ACTION_RECORDS_COLLECTION_NAME ?? ''}`;
if (db_moderation_action_records_collection_name.length < 1) throw new Error('Environment variable: MONGO_MODERATION_ACTION_RECORDS_COLLECTION_NAME; is not set correctly.');

//------------------------------------------------------------//

/**
 * Adds a moderation action to the database
 */
export async function addModerationActionToDatabase(
    identity: DbModerationAction['identity'],
    record: Omit<DbModerationAction['record'], 'id'>,
): Promise<boolean> {
    const moderation_action_data: DbModerationAction = {
        'identity': {
            'discord_user_id': identity.discord_user_id,
        },
        'record': {
            'id': uuid_v4(),
            'type': record.type,
            'epoch': record.epoch,
            'reason': record.reason,
            'staff_member_id': record.staff_member_id,
        },
    };

    try {
        await go_mongo_db.add(db_database_name, db_moderation_action_records_collection_name, [ moderation_action_data ]);
    } catch (error) {
        console.trace('addModerationActionToDatabase():', error);

        return false;
    }

    return true;
}
