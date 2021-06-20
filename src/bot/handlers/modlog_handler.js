/* Copyright © Inertia Lighting | All Rights Reserved */

//---------------------------------------------------------------------------------------------------------------//

'use strict';

//---------------------------------------------------------------------------------------------------------------//

const { go_mongo_db } = require('../../mongo/mongo.js');

//---------------------------------------------------------------------------------------------------------------//

/**
 * Adds moderation log to database
 * @param {Object} identity
 * @param {String} identity.discord_user_id - The user id
 * @param {Object} record
 * @param {String} record.type - The moderation action type
 * @param {Number} record.epoch - The epoch of when the moderation action happened
 * @param {String} record.staff_member_id - The staff user id
 * @param {String} record.reason - The reason of the moderation action
 * @returns {Promise<Boolean>} success or failure
 */

async function logModerationActionToDatabase({ discord_user_id }, { type, epoch, staff_member_id, reason }) {
    go_mongo_db.add(process.env.MONGO_DATABASE_NAME, process.env.MONGO_MODLOG_USER_RECORDS_COLLECTION_NAME, [
        {
            discord_user_id,
            type,
            epoch,
            staff_member_id,
            reason,
        },
    ]);
}

module.exports = {
    logModerationActionToDatabase,
};
