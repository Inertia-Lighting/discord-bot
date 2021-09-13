/* Copyright © Inertia Lighting | All Rights Reserved */

//---------------------------------------------------------------------------------------------------------------//

'use strict';

//---------------------------------------------------------------------------------------------------------------//

const bcrypt = require('bcryptjs');

//---------------------------------------------------------------------------------------------------------------//

const { go_mongo_db } = require('../../../../mongo/mongo.js');

//---------------------------------------------------------------------------------------------------------------//

module.exports = (router, client) => {
    router.post('/v1/auth/tokens/test', async (req, res) => {
        res.set('Content-Type', 'application/json');

        if (req.headers?.['content-type'] !== 'application/json') {
            return res.status(415).send(JSON.stringify({
                'message': '\`content-type\` must be \`application/json\`!',
            }, null, 2));
        }

        // console.log('req.body', req.body);

        const {
            game_owner_api_token: game_owner_api_token,
            game_owner_id: game_owner_id,
        } = req.body;

        /* check if required information is present */
        if (!game_owner_api_token || typeof game_owner_api_token !== 'string') {
            return res.status(400).send(JSON.stringify({
                'message': 'missing (string) \`game_owner_api_token\` in request body',
            }, null, 2));
        }
        if (!game_owner_id || typeof game_owner_id !== 'string') {
            return res.status(400).send(JSON.stringify({
                'message': 'missing (string) \`game_owner_id\` in request body',
            }, null, 2));
        }

        /* fetch user-blacklist-info */
        const [ db_blacklisted_user_data ] = await go_mongo_db.find(process.env.MONGO_DATABASE_NAME, process.env.MONGO_BLACKLISTED_USERS_COLLECTION_NAME, {
            'identity.roblox_user_id': game_owner_id,
        });

        /* check if the user is blacklisted */
        if (db_blacklisted_user_data) {
            return res.status(403).send(JSON.stringify({
                'message': '\`game_owner_id\` is blacklisted!',
            }, null, 2));
        }

        /* fetch user-auth-info */
        const [ db_user_auth_data ] = await go_mongo_db.find(process.env.MONGO_DATABASE_NAME, process.env.MONGO_API_AUTH_USERS_COLLECTION_NAME, {
            'identity.roblox_user_id': game_owner_id,
        });

        /* check if the user exists in the auth database */
        if (!db_user_auth_data) {
            console.error(`game_owner_id: ${game_owner_id}; not found in auth database`);
            return res.status(200).send(JSON.stringify({
                'status_code': 'UNKNOWN_GAME_OWNER',
                'message': `game_owner_id: ${game_owner_id}; not found in auth database`,
            }, null, 2));
        }

        /* check if the encrypted api token exists */
        const game_owner_encrypted_api_token = db_user_auth_data.encrypted_api_token;
        if (!game_owner_encrypted_api_token) {
            return res.status(200).send(JSON.stringify({
                'status_code': 'MISSING_TOKEN',
                'message': '\`game_owner_encrypted_api_token\` not found in auth database!',
            }, null, 2));
        }

        /* verify the game owner's api_token */
        const game_owner_api_token_is_valid = bcrypt.compareSync(game_owner_api_token, game_owner_encrypted_api_token);
        if (!game_owner_api_token_is_valid) {
            return res.status(200).send(JSON.stringify({
                'status_code': 'INVALID_TOKEN',
                'message': '\`game_owner_api_token\` not recognized!',
            }, null, 2));
        }

        /* respond with a success message */
        return res.status(200).send(JSON.stringify({
            'status_code': 'VALID_TOKEN',
            'message': 'the supplied information was valid and correct',
        }, null, 2));
    });
};
