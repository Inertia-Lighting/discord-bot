'use strict';

//---------------------------------------------------------------------------------------------------------------//

const moment = require('moment-timezone');
const axios = require('axios');

//---------------------------------------------------------------------------------------------------------------//

const { go_mongo_db } = require('../../mongo/mongo.js');

//---------------------------------------------------------------------------------------------------------------//

module.exports = (router, client) => {
    router.post('/user/verify', async (req, res) => {
        console.info(`Endpoint: ${req.url}; was called at ${moment()}!`);

        if (req.headers?.['content-type'] !== 'application/json') {
            console.error('WRONG CONTENT TYPE SENT TO SERVER!');
            return;
        }

        res.set('Content-Type', 'application/json');

        console.log('req.body', req.body);

        const { player_id: roblox_user_id } = req.body;

        if (!roblox_user_id) {
            res.status(400).send(JSON.stringify({
                'message': 'missing \`player_id\` in request body',
            }, null, 2));
            return;
        }

        const { data: roblox_user } = await axios.get(`https://api.roblox.com/users/${encodeURIComponent(roblox_user_id)}`);

        console.log({ roblox_user });

        if (!roblox_user) {
            res.status(404).send(JSON.stringify({
                'message': 'a roblox user could not be found for \`roblox_user_id\`',
            }, null, 2));
            return;
        }

        const [ db_user_data ] = await go_mongo_db.find(process.env.MONGO_DATABASE_NAME, process.env.MONGO_USERS_COLLECTION_NAME, {
            'roblox_user_id': roblox_user_id,
        });

        if (db_user_data) {
            res.status(200).send(JSON.stringify({
                'user_can_verify': false,
                'message': 'that \`roblox_user_id\` is already in the database',
            }));
            return;
        }

        if (db_user_data.blacklisted) {
            console.error(`roblox player: ${roblox_user_id}; blacklisted`);
            res.status(404).send(JSON.stringify({
                'message': 'roblox player is blacklisted',
            }, null, 2));
            return;
        }

        const potential_old_verification_context = client.$.verification_contexts.find(item => item.roblox_user_id === roblox_user_id);

        const verification_code = potential_old_verification_context?.verification_code ?? (new Buffer.from(`${Date.now()}`.slice(7))).toString('base64');

        console.log({
            potential_old_verification_context,
            roblox_user_id,
            verification_code,
        });

        client.$.verification_contexts.set(verification_code, {
            verification_code: verification_code,
            roblox_user_id: roblox_user_id,
        });

        res.status(200).send(JSON.stringify({
            'user_can_verify': true,
            'verification_code': verification_code,
        }));
    });
};
