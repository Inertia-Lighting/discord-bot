/* Copyright © Inertia Lighting | All Rights Reserved */

//---------------------------------------------------------------------------------------------------------------//

'use strict';

//---------------------------------------------------------------------------------------------------------------//

const { go_mongo_db } = require('../../mongo/mongo.js');

//---------------------------------------------------------------------------------------------------------------//

/**
 * @typedef {'WARN'|'MUTE'|'KICK'|'BAN'} ModerationActionType
 */

//---------------------------------------------------------------------------------------------------------------//

/**
 * Adds moderation log to database
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
    try {
        await go_mongo_db.add(process.env.MONGO_DATABASE_NAME, process.env.MONGO_MODERATION_ACTION_RECORDS_COLLECTION_NAME, [
            {
                'identity.discord_user_id': discord_user_id,
                'record.type': type,
                'record.epoch': epoch,
                'record.reason': reason,
                'record.staff_member_id': staff_member_id,
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
