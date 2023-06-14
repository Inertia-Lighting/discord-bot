//------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
//------------------------------------------------------------//

import { v4 as uuid_v4 } from 'uuid';

import { go_mongo_db } from '@root/common/mongo/mongo';

//------------------------------------------------------------//

type UserNote = {
    identity: {
        discord_user_id: string,
    },
    record: {
        id: string,
        epoch: number,
        note: string,
        staff_member_id: string,
    },
};

//------------------------------------------------------------//

/**
 * Create note for user
 */
async function createNoteForUser(
    { discord_user_id }: {
        discord_user_id: string,
    },
    { epoch, note, staff_member_id }: {
        epoch: number,
        note: string,
        staff_member_id: string,
    }
): Promise<boolean> {
    if (typeof discord_user_id !== 'string') throw new TypeError('\`discord_user_id\` must be a string!');
    if (typeof epoch !== 'number') throw new TypeError('\`epoch\` must be a number!');
    if (typeof note !== 'string') throw new TypeError('\`note\` must be a string!');
    if (typeof staff_member_id !== 'string') throw new TypeError('\`staff_member_id\` must be a string!');

    const record_id = uuid_v4();

    try {
        await go_mongo_db.add(process.env.MONGO_DATABASE_NAME as string, process.env.MONGO_USER_NOTES_COLLECTION_NAME as string, [
            {
                'identity': {
                    'discord_user_id': discord_user_id,
                },
                'record': {
                    'id': record_id,
                    'epoch': epoch,
                    'note': note,
                    'staff_member_id': staff_member_id,
                },
            } as UserNote,
        ]);
    } catch (error) {
        console.trace('createNoteForUser():', error);
        return false;
    }

    return true;
}

//------------------------------------------------------------//

/**
 * Updates a note
 */
async function updateNoteForUser(
    { id, epoch, note, staff_member_id }: {
        id: string,
        epoch: number,
        note: string,
        staff_member_id: string,
    }
): Promise<boolean> {
    if (typeof id !== 'string') throw new TypeError('\`id\` must be a string!');
    if (typeof epoch !== 'number') throw new TypeError('\`epoch\` must be a number!');
    if (typeof note !== 'string') throw new TypeError('\`note\` must be a string!');
    if (typeof staff_member_id !== 'string') throw new TypeError('\`staff_member_id\` must be a string!');

    try {
        await go_mongo_db.update(process.env.MONGO_DATABASE_NAME as string, process.env.MONGO_USER_NOTES_COLLECTION_NAME as string, {
            'record.id': id,
        }, {
            $set: {
                'record': {
                    'epoch': epoch,
                    'note': note,
                    'staff_member_id': staff_member_id,
                },
            },
        });
    } catch (error) {
        console.trace('updateNoteForUser():', error);
        return false;
    }

    return true;
}

//------------------------------------------------------------//

/**
 * Removes a note
 */
async function removeNoteFromUser(
    { id }: {
        id: string,
    }
): Promise<boolean> {
    if (typeof id !== 'string') throw new TypeError('\`id\` must be a string!');

    try {
        await go_mongo_db.remove(process.env.MONGO_DATABASE_NAME as string, process.env.MONGO_USER_NOTES_COLLECTION_NAME as string, {
            'record.id': id,
        });
    } catch (error) {
        console.trace('removeNoteFromUser():', error);
        return false;
    }

    return true;
}

/**
 * Removes all notes from a user
 */
async function purgeNotesFromUser(
    { discord_user_id }: {
        discord_user_id: string,
    }
): Promise<boolean> {
    if (typeof discord_user_id !== 'string') throw new TypeError('\`discord_user_id\` must be a string!');

    try {
        await go_mongo_db.remove(process.env.MONGO_DATABASE_NAME as string, process.env.MONGO_USER_NOTES_COLLECTION_NAME as string, {
            'identity.discord_user_id': discord_user_id,
        });
    } catch (error) {
        console.trace('purgeNotesFromUser():', error);
        return false;
    }

    return true;
}

/**
 * Finds all notes for a user
 */
async function lookupNotesForUser(
    { discord_user_id }: {
        discord_user_id: string,
    }
): Promise<UserNote[]> {
    if (typeof discord_user_id !== 'string') throw new TypeError('\`discord_user_id\` must be a string!');

    const user_notes = await go_mongo_db.find(process.env.MONGO_DATABASE_NAME as string, process.env.MONGO_USER_NOTES_COLLECTION_NAME as string, {
        'identity.discord_user_id': discord_user_id,
    }) as unknown as UserNote[];

    return user_notes;
}

/**
 * Finds a singular note for a user
 */
async function lookupNoteForUser(
    { id }: {
        id: string,
    }
): Promise<UserNote | undefined> {
    if (typeof id !== 'string') throw new TypeError('\`id\` must be a string!');

    const [ user_note ] = await go_mongo_db.find(process.env.MONGO_DATABASE_NAME as string, process.env.MONGO_USER_NOTES_COLLECTION_NAME as string, {
        'record.id': id,
    }) as unknown as UserNote[];

    return user_note;
}

export {
    UserNote,
    createNoteForUser,
    updateNoteForUser,
    removeNoteFromUser,
    purgeNotesFromUser,
    lookupNotesForUser,
    lookupNoteForUser,
};
