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
    return uuid_v4();
}

//---------------------------------------------------------------------------------------------------------------//

module.exports = (router, client) => {
    router.post('/v1/auth/keys/generate', async (req, res) => {
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

        /* check if required information is present */
        if (!reproducible_game_api_salt || typeof reproducible_game_api_salt !== 'string') {
            return res.status(400).send(JSON.stringify({
                'message': 'missing (string) \`game_api_salt\` in request body',
            }, null, 2));
        }
        if (!game_owner_id || typeof game_owner_id !== 'string') {
            return res.status(400).send(JSON.stringify({
                'message': 'missing (string) \`game_owner_id\` in request body',
            }, null, 2));
        }
        if (!game_owner_api_token || typeof game_owner_api_token !== 'string') {
            return res.status(400).send(JSON.stringify({
                'message': 'missing (string) \`game_owner_api_token\` in request body',
            }, null, 2));
        }

        /* verify a reproducible salt from the game */
        const reproducible_server_api_salt = await generateReproducibleSalt(game_owner_id, process.env.USER_API_TOKEN_SALT_SECRET);
        if (reproducible_game_api_salt !== reproducible_server_api_salt) {
            return res.status(403).send(JSON.stringify({
                'message': '\`game_api_salt\` was not recognized!',
            }, null, 2));
        }

        /* fetch user-blacklist-info */
        const [ db_blacklisted_user_data ] = await go_mongo_db.find(process.env.MONGO_DATABASE_NAME, process.env.MONGO_BLACKLISTED_USERS_COLLECTION_NAME, {
            'identity.roblox_user_id': game_owner_id,
        });

        /* prevent blacklisted game owners from generating an access_key */
        if (db_blacklisted_user_data) {
            return res.status(403).send(JSON.stringify({
                'message': '\`game_owner_id\` is blacklisted!',
            }, null, 2));
        }

        /* fetch user-auth-info */
        const [ db_user_auth_data ] = await go_mongo_db.find(process.env.MONGO_DATABASE_NAME, process.env.MONGO_API_AUTH_USERS_COLLECTION_NAME, {
            'identity.roblox_user_id': game_owner_id,
        });

        /* prevent non-auth-users from continuing */
        if (!db_user_auth_data) {
            console.error(`roblox player: ${game_owner_id}; not found in auth database`);
            return res.status(403).send(JSON.stringify({
                'message': 'roblox player not found in auth database',
            }, null, 2));
        }

        /* verify the game owner's api_token */
        const game_owner_api_token_is_valid = bcrypt.compareSync(game_owner_api_token, db_user_auth_data.encrypted_api_token);
        if (!game_owner_api_token_is_valid) {
            return res.status(403).send(JSON.stringify({
                'message': '\`game_owner_api_token\` was not recognized!',
            }, null, 2));
        }

        /* generate an api access key for the game owner */
        const new_api_access_key = await generateUserAPIKey();

        /* determine whether or not the access_key has expired yet */
        const current_epoch = moment().valueOf();
        const current_key_expiration_epoch = db_user_auth_data.api_access?.expiration_epoch ?? current_epoch;
        const current_key_has_expired = current_epoch >= current_key_expiration_epoch;

        /* (fetch / generate) the (current / new) key and it's expiration epoch */
        const updated_access_key = current_key_has_expired ? new_api_access_key : db_user_auth_data.api_access?.key;
        const updated_access_key_expiration_epoch = current_key_has_expired ? moment().add(6, 'hours').valueOf() : current_key_expiration_epoch;

        /* update the user-auth-info in the database */
        await go_mongo_db.update(process.env.MONGO_DATABASE_NAME, process.env.MONGO_API_AUTH_USERS_COLLECTION_NAME, {
            'identity.roblox_user_id': game_owner_id,
        }, {
            $set: {
                ['api_access.version']: 1,
                ['api_access.enabled']: db_user_auth_data.api_access?.enabled ?? true,
                ['api_access.expiration_epoch']: updated_access_key_expiration_epoch,
                ['api_access.key']: updated_access_key,
            },
        });

        /* respond with an access_key for the game owner to the game server */
        return res.status(200).send(JSON.stringify({
            'access_key': updated_access_key,
            'access_key_expiration_epoch': updated_access_key_expiration_epoch,
        }, null, 2));
    });
};
