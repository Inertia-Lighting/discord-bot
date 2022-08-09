/* Copyright © Inertia Lighting | All Rights Reserved */
//---------------------------------------------------------------------------------------------------------------//
'use strict';
//---------------------------------------------------------------------------------------------------------------//
const { v4: uuid_v4 } = require('uuid');
const { go_mongo_db } = require('../../mongo/mongo.js');
//---------------------------------------------------------------------------------------------------------------//
/**
 * @typedef {{
 *  'identity': {
 *      'discord_user_id': String,
 *  },
 *  'record': {
 *      'id': String,
 *      'epoch': Number,
 *      'note': String,
 *      'staff_member_id': String,
 *  },
 * }} UserNote
 */
//---------------------------------------------------------------------------------------------------------------//
/**
 * Create note for user
 * @param {Object} identity
 * @param {String} identity.discord_user_id
 * @param {Object} record
 * @param {Number} record.epoch
 * @param {String} record.note
 * @param {String} record.staff_member_id
 * @returns {Promise<Boolean>} success or failure
 */
async function createNoteForUser({ discord_user_id }, { epoch, note, staff_member_id }) {
    if (typeof discord_user_id !== 'string')
        throw new TypeError('\`discord_user_id\` must be a string!');
    if (typeof epoch !== 'number')
        throw new TypeError('\`epoch\` must be a number!');
    if (typeof note !== 'string')
        throw new TypeError('\`note\` must be a string!');
    if (typeof staff_member_id !== 'string')
        throw new TypeError('\`staff_member_id\` must be a string!');
    const record_id = uuid_v4();
    try {
        await go_mongo_db.add(process.env.MONGO_DATABASE_NAME, process.env.MONGO_USER_NOTES_COLLECTION_NAME, [
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
            },
        ]);
    }
    catch (error) {
        console.trace('createNoteForUser():', error);
        return false;
    }
    return true;
}
//---------------------------------------------------------------------------------------------------------------//
/**
 * Updates a note
 * @param {Object} record
 * @param {String} record.id
 * @param {Number} record.epoch
 * @param {String} record.note
 * @param {String} record.staff_member_id
 * @returns {Promise<Boolean>} success or failure
 */
async function updateNoteForUser({ id, epoch, note, staff_member_id }) {
    if (typeof id !== 'string')
        throw new TypeError('\`id\` must be a string!');
    if (typeof epoch !== 'number')
        throw new TypeError('\`epoch\` must be a number!');
    if (typeof note !== 'string')
        throw new TypeError('\`note\` must be a string!');
    if (typeof staff_member_id !== 'string')
        throw new TypeError('\`staff_member_id\` must be a string!');
    try {
        await go_mongo_db.update(process.env.MONGO_DATABASE_NAME, process.env.MONGO_USER_NOTES_COLLECTION_NAME, {
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
    }
    catch (error) {
        console.trace('updateNoteForUser():', error);
        return false;
    }
    return true;
}
//---------------------------------------------------------------------------------------------------------------//
/**
 * Removes a note
 * @param {Object} record
 * @param {String} record.id
 * @returns {Promise<Boolean>} success or failure
 */
async function removeNoteFromUser({ id }) {
    if (typeof id !== 'string')
        throw new TypeError('\`id\` must be a string!');
    try {
        await go_mongo_db.remove(process.env.MONGO_DATABASE_NAME, process.env.MONGO_USER_NOTES_COLLECTION_NAME, {
            'record.id': id,
        });
    }
    catch (error) {
        console.trace('removeNoteFromUser():', error);
        return false;
    }
    return true;
}
/**
 * Removes all notes from a user
 * @param {Object} identity
 * @param {String} identity.discord_user_id
 * @returns {Promise<Boolean>} success or failure
 */
async function purgeNotesFromUser({ discord_user_id }) {
    if (typeof discord_user_id !== 'string')
        throw new TypeError('\`discord_user_id\` must be a string!');
    try {
        await go_mongo_db.remove(process.env.MONGO_DATABASE_NAME, process.env.MONGO_USER_NOTES_COLLECTION_NAME, {
            'identity.discord_user_id': discord_user_id,
        });
    }
    catch (error) {
        console.trace('purgeNotesFromUser():', error);
        return false;
    }
    return true;
}
/**
 * Finds all notes for a user
 * @param {Object} identity
 * @param {String} identity.discord_user_id
 * @returns {Promise<UserNote[]>}
 */
async function lookupNotesForUser({ discord_user_id }) {
    if (typeof discord_user_id !== 'string')
        throw new TypeError('\`discord_user_id\` must be a string!');
    const user_notes = await go_mongo_db.find(process.env.MONGO_DATABASE_NAME, process.env.MONGO_USER_NOTES_COLLECTION_NAME, {
        'identity.discord_user_id': discord_user_id,
    });
    return user_notes;
}
/**
 * Finds a singular note for a user
 * @param {Object} record
 * @param {String?} record.id
 * @returns {Promise<UserNote>}
 */
async function lookupNoteForUser({ id }) {
    if (typeof id !== 'string')
        throw new TypeError('\`id\` must be a string!');
    const [user_note] = await go_mongo_db.find(process.env.MONGO_DATABASE_NAME, process.env.MONGO_USER_NOTES_COLLECTION_NAME, {
        'record.id': id,
    });
    return user_note;
}
module.exports = {
    createNoteForUser,
    updateNoteForUser,
    removeNoteFromUser,
    purgeNotesFromUser,
    lookupNotesForUser,
    lookupNoteForUser,
};
//# sourceMappingURL=user_notes_handler.js.map