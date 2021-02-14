'use strict';

//---------------------------------------------------------------------------------------------------------------//

const moment = require('moment-timezone');
const { go_mongo_db } = require('../../../../mongo/mongo.js');

//---------------------------------------------------------------------------------------------------------------//

module.exports = (router, client) => {
    router.post('/v1/user/verification/verified', async (req, res) => {
        console.info(`Endpoint: ${req.url}; was called at ${moment()}!`);

        res.set('Content-Type', 'application/json');

        if (req.headers?.['content-type'] !== 'application/json') {
            return res.status(415).send(JSON.stringify({
                'message': '\`content-type\` must be \`application/json\`!',
            }, null, 2));
        }

        // console.log('req.body', req.body);

        const {
            api_endpoint_token: api_endpoint_token,
            discord_user_id: discord_user_id,
            roblox_user_id: roblox_user_id,
        } = req.body;

        /* check if required information is present */
        if (!(roblox_user_id || discord_user_id)) {
            return res.status(400).send(JSON.stringify({
                'message': 'missing \`discord_user_id\` or \`roblox_user_id\` in request body',
            }, null, 2));
        }
        if (!api_endpoint_token) {
            return res.status(400).send(JSON.stringify({
                'message': 'missing \`api_endpoint_token\` in request body',
            }, null, 2));
        }

        /* check if the request was properly authenticated */
        if (api_endpoint_token !== process.env.API_TOKEN_FOR_USER_VERIFIED) {
            return res.status(403).send(JSON.stringify({
                'message': '\`api_endpoint_token\` was not recognized!',
            }, null, 2));
        }

        const [ db_user_data ] = await go_mongo_db.find(process.env.MONGO_DATABASE_NAME, process.env.MONGO_USERS_COLLECTION_NAME, {
            ...(discord_user_id ? {
                'discord_user_id': discord_user_id,
            } : {
                'roblox_user_id': roblox_user_id,
            }),
        });

        return res.status(200).send(JSON.stringify({
            verified: (db_user_data ? true : false),
        }, null, 2));
    });
};
