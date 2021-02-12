'use strict';

//---------------------------------------------------------------------------------------------------------------//

const moment = require('moment-timezone');

//---------------------------------------------------------------------------------------------------------------//

const { go_mongo_db } = require('../../../mongo/mongo.js');

//---------------------------------------------------------------------------------------------------------------//

module.exports = (router, client) => {
    router.post('/v1/user/verify', async (req, res) => {
        console.info(`Endpoint: ${req.url}; was called at ${moment()}!`);

        if (req.headers?.['content-type'] !== 'application/json') {
            console.error('WRONG CONTENT TYPE SENT TO SERVER!');
            return;
        }

        res.set('Content-Type', 'application/json');

        console.log('req.body', req.body);

        const {
            player_id: roblox_user_id,
            api_token: endpoint_api_token,
        } = req.body;

        if (endpoint_api_token !== process.env.API_TOKEN_FOR_VERIFYING) {
            res.status(403).send(JSON.stringify({
                'message': '\`api_token\` was not recognized!',
            }, null, 2));
            return;
        }

        if (!roblox_user_id) {
            res.status(400).send(JSON.stringify({
                'message': 'missing \`player_id\` in request body',
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
