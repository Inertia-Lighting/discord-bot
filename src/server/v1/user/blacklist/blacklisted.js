'use strict';

//---------------------------------------------------------------------------------------------------------------//

const bcrypt = require('bcryptjs');

const { go_mongo_db } = require('../../../../mongo/mongo.js');

//---------------------------------------------------------------------------------------------------------------//

module.exports = (router, client) => {
    router.post('/v1/user/blacklist/blacklisted', async (req, res) => {
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
        if (!(roblox_user_id || discord_user_id) || typeof (roblox_user_id ?? discord_user_id) !== 'string') {
            return res.status(400).send(JSON.stringify({
                'message': 'missing (string) \`discord_user_id\` or (string) \`roblox_user_id\` in request body',
            }, null, 2));
        }

        /* check if the request was properly authenticated */
        if (api_endpoint_token && typeof api_endpoint_token === 'string') {
            const api_endpoint_token_is_valid = bcrypt.compareSync(api_endpoint_token, process.env.API_HASHED_TOKEN_FOR_USER_BLACKLISTED);
            if (!api_endpoint_token_is_valid) {
                return res.status(403).send(JSON.stringify({
                    'message': '\`api_endpoint_token\` was not recognized!',
                }, null, 2));
            }
        } else {
            return res.status(400).send(JSON.stringify({
                'message': 'missing (string) \`api_endpoint_token\` in request body',
            }, null, 2));
        }

        const [ db_blacklisted_user_data ] = await go_mongo_db.find(process.env.MONGO_DATABASE_NAME, process.env.MONGO_BLACKLISTED_USERS_COLLECTION_NAME, {
            ...(discord_user_id ? {
                'identity.discord_user_id': discord_user_id,
            } : {
                'identity.roblox_user_id': roblox_user_id,
            }),
        }, {
            projection: {
                '_id': false,
            },
        });

        if (db_blacklisted_user_data) {
            return res.status(200).send(JSON.stringify(db_blacklisted_user_data, null, 2));
        } else {
            return res.status(404).send(JSON.stringify({
                'message': 'the specified user was not found in the blacklist database',
            }, null, 2));
        }
    });
};
