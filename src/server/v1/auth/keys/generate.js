'use strict';

//---------------------------------------------------------------------------------------------------------------//

const moment = require('moment-timezone');
const bcrypt = require('bcryptjs');
const { v4: uuid_v4 } = require('uuid');

//---------------------------------------------------------------------------------------------------------------//

const { go_mongo_db } = require('../../../../mongo/mongo.js');

//---------------------------------------------------------------------------------------------------------------//

async function generateReproducibleSalt(roblox_user_id, reproducible_salt_secret) {
    const repeated_roblox_user_id = roblox_user_id.repeat(10);

    let salt = '';
    for (let i = 0; i < reproducible_salt_secret.length; i++) {
        salt += repeated_roblox_user_id[reproducible_salt_secret[i]];
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

        if (req.headers?.['content-type'] !== 'application/json') {
            console.error('WRONG CONTENT TYPE SENT TO SERVER!');
            return;
        }

        res.set('Content-Type', 'application/json');

        const {
            player_id: roblox_user_id,
            player_api_token: roblox_user_api_token,
            game_api_salt: reproducible_game_api_salt,
        } = req.body;

        if (!roblox_user_id) {
            res.status(400).send(JSON.stringify({
                'message': 'missing \`player_id\` in request body',
            }, null, 2));
            return;
        }

        if (!roblox_user_api_token) {
            res.status(400).send(JSON.stringify({
                'message': 'missing \`player_api_token\` in request body',
            }, null, 2));
            return;
        }

        if (!reproducible_game_api_salt) {
            res.status(400).send(JSON.stringify({
                'message': 'missing \`game_api_salt\` in request body',
            }, null, 2));
            return;
        }

        /* find the user auth in the database */
        const [ db_user_auth_data ] = await go_mongo_db.find(process.env.MONGO_DATABASE_NAME, process.env.MONGO_API_AUTH_USERS_COLLECTION_NAME, {
            'roblox_user_id': roblox_user_id,
        });

        if (!db_user_auth_data) {
            console.error(`roblox player: ${roblox_user_id}; not found in auth database`);
            res.status(404).send(JSON.stringify({
                'message': 'roblox player not found in auth database',
            }, null, 2));
            return;
        }

        const roblox_user_api_token_exists = bcrypt.compareSync(roblox_user_api_token, db_user_auth_data.encrypted_api_token);
        if (!roblox_user_api_token_exists) {
            res.status(403).send(JSON.stringify({
                'message': '\`player_api_token\` was not recognized!',
            }, null, 2));
            return;
        }

        const reproducible_server_api_salt = await generateReproducibleSalt(roblox_user_id, process.env.USER_API_TOKEN_SALT_SECRET);
        if (reproducible_game_api_salt !== reproducible_server_api_salt) {
            res.status(403).send(JSON.stringify({
                'message': '\`game_api_salt\` was not recognized!',
            }, null, 2));
            return;
        }

        /* generate the api access key */
        const { non_encrypted_key, encrypted_key } = generateUserAPIKey();

        /* update the user auth in the database */
        await go_mongo_db.update(process.env.MONGO_DATABASE_NAME, process.env.MONGO_API_AUTH_USERS_COLLECTION_NAME, {
            'roblox_user_id': roblox_user_id,
        }, {
            $set: {
                ['api_access.version']: 1,
                ['api_access.enabled']: db_user_auth_data.api_access?.enabled ?? true,
                ['api_access.encrypted_key']: encrypted_key,
            },
        });

        /* respond with success to the game server */
        res.status(200).send(JSON.stringify({
            access_key: non_encrypted_key,
        }, null, 2));
    });
};
