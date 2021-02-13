'use strict';

//---------------------------------------------------------------------------------------------------------------//

const moment = require('moment-timezone');
const bcrypt = require('bcryptjs');
const { v4: uuid_v4 } = require('uuid');

//---------------------------------------------------------------------------------------------------------------//

const { go_mongo_db } = require('../../../../mongo/mongo.js');

//---------------------------------------------------------------------------------------------------------------//

async function generateReproducibleSalt(game_owner_id, reproducible_salt_secret) {
    const repeated_game_owner_id = game_owner_id.repeat(10);

    let salt = '';
    for (let i = 0; i < reproducible_salt_secret.length; i++) {
        salt += repeated_game_owner_id[reproducible_salt_secret[i]];
    }

    return salt;
}

async function generateUserAPIKey() {
    const non_encrypted_key = uuid_v4();
    const encrypted_key = bcrypt.hashSync(non_encrypted_key, bcrypt.genSaltSync(parseInt(process.env.USER_API_ACCESS_KEY_BCRYPT_SALT_LENGTH)));
    return {
        non_encrypted_key,
        encrypted_key,
    };
}

//---------------------------------------------------------------------------------------------------------------//

module.exports = (router, client) => {
    router.post('/v1/auth/keys/generate', async (req, res) => {
        console.info(`Endpoint: ${req.url}; was called at ${moment()}!`);

        res.set('Content-Type', 'application/json');

        if (req.headers?.['content-type'] !== 'application/json') {
            return res.status(415).send(JSON.stringify({
                'message': '\`content-type\` must be \`application/json\`!',
            }, null, 2));
        }

        // console.log('req.body', req.body);

        const {
            game_api_salt: reproducible_game_api_salt,
            game_owner_id: game_owner_id,
            game_owner_api_token: game_owner_api_token,
        } = req.body;

        if (!reproducible_game_api_salt) {
            return res.status(400).send(JSON.stringify({
                'message': 'missing \`game_api_salt\` in request body',
            }, null, 2));
        }

        if (!game_owner_id) {
            return res.status(400).send(JSON.stringify({
                'message': 'missing \`game_owner_id\` in request body',
            }, null, 2));
        }

        if (!game_owner_api_token) {
            return res.status(400).send(JSON.stringify({
                'message': 'missing \`game_owner_api_token\` in request body',
            }, null, 2));
        }

        const reproducible_server_api_salt = await generateReproducibleSalt(game_owner_id, process.env.USER_API_TOKEN_SALT_SECRET);
        if (reproducible_game_api_salt !== reproducible_server_api_salt) {
            return res.status(403).send(JSON.stringify({
                'message': '\`game_api_salt\` was not recognized!',
            }, null, 2));
        }

        const [ db_user_auth_data ] = await go_mongo_db.find(process.env.MONGO_DATABASE_NAME, process.env.MONGO_API_AUTH_USERS_COLLECTION_NAME, {
            'roblox_user_id': game_owner_id,
        });

        if (!db_user_auth_data) {
            console.error(`roblox player: ${game_owner_id}; not found in auth database`);
            return res.status(404).send(JSON.stringify({
                'message': 'roblox player not found in auth database',
            }, null, 2));
        }

        const game_owner_api_token_is_valid = bcrypt.compareSync(game_owner_api_token, db_user_auth_data.encrypted_api_token);
        if (!game_owner_api_token_is_valid) {
            return res.status(403).send(JSON.stringify({
                'message': '\`game_owner_api_token\` was not recognized!',
            }, null, 2));
        }

        /* generate the api access key */
        const { non_encrypted_key, encrypted_key } = await generateUserAPIKey();

        /* update the user auth in the database */
        await go_mongo_db.update(process.env.MONGO_DATABASE_NAME, process.env.MONGO_API_AUTH_USERS_COLLECTION_NAME, {
            'roblox_user_id': game_owner_id,
        }, {
            $set: {
                ['api_access.version']: 1,
                ['api_access.enabled']: db_user_auth_data.api_access?.enabled ?? true,
                ['api_access.encrypted_key']: encrypted_key,
            },
        });

        /* respond with success to the game server */
        return res.status(200).send(JSON.stringify({
            access_key: non_encrypted_key,
        }, null, 2));
    });
};
