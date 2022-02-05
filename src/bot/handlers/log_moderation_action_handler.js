/* Copyright © Inertia Lighting | All Rights Reserved */

//---------------------------------------------------------------------------------------------------------------//

'use strict';

//---------------------------------------------------------------------------------------------------------------//

const { v4: uuid_v4 } = require('uuid');

const { go_mongo_db } = require('../../mongo/mongo.js');

//---------------------------------------------------------------------------------------------------------------//

/**
 * @typedef {'WARN'|'TIMEOUT'|'MUTE'|'KICK'|'BAN'} ModerationActionType
 */

//---------------------------------------------------------------------------------------------------------------//

/**
 * Adds a moderation log to the database
 * @param {Object} identity
 * @param {String} identity.discord_user_id
 * @param {Object} record
 * @param {ModerationActionType} record.type
 * @param {Number} record.epoch
 * @param {String} record.reason
 * @param {String} record.staff_member_id
 * @returns {Promise<Boolean>} success or failure
 */
async function logModerationActionToDatabase({ discord_user_id }, { type, epoch, reason, staff_member_id }) {
    if (typeof discord_user_id !== 'string') throw new TypeError('\`discord_user_id\` must be a string!');
    if (typeof type !== 'string') throw new TypeError('\`type\` must be a string!');
    if (typeof epoch !== 'number') throw new TypeError('\`epoch\` must be a number!');
    if (typeof reason !== 'string') throw new TypeError('\`reason\` must be a string!');
    if (typeof staff_member_id !== 'string') throw new TypeError('\`staff_member_id\` must be a string!');

    const record_id = uuid_v4();

    try {
        await go_mongo_db.add(process.env.MONGO_DATABASE_NAME, process.env.MONGO_MODERATION_ACTION_RECORDS_COLLECTION_NAME, [
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
            },
        ]);
    } catch (error) {
        console.trace('logModerationActionToDatabase():', error);
        return false;
    }

    return true;
}

module.exports = {
    logModerationActionToDatabase,
};
