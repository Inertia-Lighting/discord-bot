'use strict';

//---------------------------------------------------------------------------------------------------------------//

const moment = require('moment-timezone');
const bcrypt = require('bcryptjs');
const { go_mongo_db } = require('../../../../mongo/mongo.js');

//---------------------------------------------------------------------------------------------------------------//

module.exports = (router, client) => {
    router.post('/v1/user/products/fetch/:product_name?', async (req, res) => {
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
            api_access_key: game_owner_api_access_key,
            player_id: roblox_user_id,
            discord_id: discord_user_id,
        } = req.body;

        /* check if required information is present */
        if (!(roblox_user_id || discord_user_id)) {
            return res.status(400).send(JSON.stringify({
                'message': 'missing \`player_id\` or \`discord_id\` in request body',
            }, null, 2));
        }

        /* check if the request was properly authenticated */
        if (api_endpoint_token) {
            if (api_endpoint_token !== process.env.API_TOKEN_FOR_USER_PRODUCTS_FETCH) {
                return res.status(403).send(JSON.stringify({
                    'message': '\`api_endpoint_token\` was not recognized!',
                }, null, 2));
            }
        } else if (game_owner_api_access_key) {
            const [ db_user_auth_data ] = await go_mongo_db.find(process.env.MONGO_DATABASE_NAME, process.env.MONGO_API_AUTH_USERS_COLLECTION_NAME, {
                ...(discord_user_id ? {
                    'discord_user_id': discord_user_id,
                } : {
                    'roblox_user_id': roblox_user_id,
                }),
            });

            if (!db_user_auth_data) {
                return res.status(403).send(JSON.stringify({
                    'message': '\`db_user_auth_data\` could not be found for \`player_id\` or \`discord_id\`!',
                }, null, 2));
            }

            if (!db_user_auth_data.api_access) {
                return res.status(403).send(JSON.stringify({
                    'message': '\`db_user_auth_data.api_access\` could not be found for \`player_id\` or \`discord_id\`!',
                }, null, 2));
            }

            if (!db_user_auth_data.api_access.enabled) {
                return res.status(403).send(JSON.stringify({
                    'message': '\`db_user_auth_data.api_access.enabled\` is not \`true\` for \`player_id\` or \`discord_id\`!',
                }, null, 2));
            }

            const game_owner_api_access_key_is_valid = bcrypt.compareSync(`${game_owner_api_access_key}`, `${db_user_auth_data.api_access.encrypted_key}`);
            if (!game_owner_api_access_key_is_valid) {
                return res.status(403).send(JSON.stringify({
                    'message': '\`api_access_key\` was not recognized!',
                }, null, 2));
            }
        } else {
            return res.status(400).send(JSON.stringify({
                'message': 'missing \`api_endpoint_token\` or \`api_access_key\` in request body',
            }, null, 2));
        }

        const [ db_user_data ] = await go_mongo_db.find(process.env.MONGO_DATABASE_NAME, process.env.MONGO_USERS_COLLECTION_NAME, {
            ...(discord_user_id ? {
                'discord_user_id': discord_user_id,
            } : {
                'roblox_user_id': roblox_user_id,
            }),
        });

        if (!db_user_data) {
            return res.status(404).send(JSON.stringify({
                'message': 'a roblox user could not be found for \`player_id\` or \`discord_id\`',
            }, null, 2));
        }

        if (!db_user_data.products) {
            console.error(`roblox_user_id: ${roblox_user_id}; discord_user_id: ${discord_user_id}; does not have \`db_user_data.products\` defined!`);
            db_user_data.products = {}; // fix the possibility of this not being an object
        }

        const specified_product_name = req.params['product_name'];
        if (specified_product_name) {
            return res.status(200).send(JSON.stringify(db_user_data.products[specified_product_name], null, 2));
        } else {
            return res.status(200).send(JSON.stringify(db_user_data.products, null, 2));
        }
    });
};
