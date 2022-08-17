//------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
//------------------------------------------------------------//

//---------------------------------------------------------------------------------------------------------------//

import { v4 as uuid_v4 } from 'uuid';

import { go_mongo_db } from '../../mongo/mongo';

//---------------------------------------------------------------------------------------------------------------//

type ModerationActionType = 'WARN' | 'TIMEOUT' | 'MUTE' | 'KICK' | 'BAN';

type ModerationActionData = {
    identity: {
        discord_user_id: string,
    },
    record: {
        id: string,
        type: ModerationActionType,
        epoch: number,
        reason: string,
        staff_member_id: string,
    },
};

//---------------------------------------------------------------------------------------------------------------//

/**
 * Adds a moderation log to the database
 */
async function logModerationActionToDatabase(
    { discord_user_id }: {
        discord_user_id: string,
    },
    { type, epoch, reason, staff_member_id }: {
        type: ModerationActionType,
        epoch: number,
        reason: string,
        staff_member_id: string,
    }
): Promise<boolean> {
    if (typeof discord_user_id !== 'string') throw new TypeError('\`discord_user_id\` must be a string!');
    if (typeof type !== 'string') throw new TypeError('\`type\` must be a string!');
    if (typeof epoch !== 'number') throw new TypeError('\`epoch\` must be a number!');
    if (typeof reason !== 'string') throw new TypeError('\`reason\` must be a string!');
    if (typeof staff_member_id !== 'string') throw new TypeError('\`staff_member_id\` must be a string!');

    const record_id = uuid_v4();

    try {
        await go_mongo_db.add(process.env.MONGO_DATABASE_NAME as string, process.env.MONGO_MODERATION_ACTION_RECORDS_COLLECTION_NAME as string, [
            {
                'identity': {
                    'discord_user_id': discord_user_id,
                },
                'record': {
                    'id': record_id,
                    'type': type,
                    'epoch': epoch,
                    'reason': reason,
                    'staff_member_id': staff_member_id,
                },
            } as ModerationActionData,
        ]);
    } catch (error) {
        console.trace('logModerationActionToDatabase():', error);
        return false;
    }

    return true;
}

export {
    logModerationActionToDatabase,
};
