'use strict';

//---------------------------------------------------------------------------------------------------------------//

const moment = require('moment-timezone');
const { go_mongo_db } = require('../../mongo/mongo.js');

//---------------------------------------------------------------------------------------------------------------//

module.exports = (router, client) => {
    router.post('/v1/user/blacklisted', async (req, res) => {
        console.info(`Endpoint: ${req.url}; was called at ${moment()}!`);

        if (req.headers?.['content-type'] !== 'application/json') {
            console.error('WRONG CONTENT TYPE SENT TO SERVER!');
            return;
        }

        res.set('Content-Type', 'application/json');

        console.log('req.body', req.body);

        const {
            player_id: roblox_user_id,
            discord_id: discord_user_id,
        } = req.body;

        if (!(roblox_user_id || discord_user_id)) {
            res.status(400).send(JSON.stringify({
                'message': 'missing \`player_id\` or \`discord_id\` in request body',
            }, null, 2));
            return;
        }

        const [ db_blacklisted_user_data ] = await go_mongo_db.find(process.env.MONGO_DATABASE_NAME, process.env.MONGO_BLACKLISTED_USERS_COLLECTION_NAME, {
            ...(discord_user_id ? {
                'discord_user_id': discord_user_id,
            } : {
                'roblox_user_id': roblox_user_id,
            }),
        });

        if (db_blacklisted_user_data) {
            res.status(200).send(JSON.stringify({
                'epoch': db_blacklisted_user_data.epoch,
                'reason': db_blacklisted_user_data.reason,
                'staff_member_id': db_blacklisted_user_data.staff_member_id,
            }, null, 2));
        } else {
            res.status(404).send(JSON.stringify({
                'message': 'the specified user was not found in the blacklist',
            }, null, 2));
        }
    });
};
