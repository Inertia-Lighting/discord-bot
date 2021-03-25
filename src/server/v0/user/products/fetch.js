'use strict';

//---------------------------------------------------------------------------------------------------------------//

const bcrypt = require('bcryptjs');

const { go_mongo_db } = require('../../../../mongo/mongo.js');

//---------------------------------------------------------------------------------------------------------------//

module.exports = (router, client) => {
    router.post('/v0/user/products/fetch/:specific_product_code?', async (req, res) => {
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
            const api_endpoint_token_is_valid = bcrypt.compareSync(api_endpoint_token, process.env.API_HASHED_TOKEN_FOR_USER_PRODUCTS_FETCH);
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

        const [ db_user_data ] = await go_mongo_db.find(process.env.MONGO_OLD_DATABASE_NAME, process.env.MONGO_OLD_USERS_COLLECTION_NAME, {
            ...(discord_user_id ? {
                '_id': discord_user_id,
            } : {
                'ROBLOX_ID': roblox_user_id,
            }),
        });

        if (!db_user_data) {
            return res.status(404).send(JSON.stringify({
                'message': 'a roblox user could not be found for \`discord_user_id\` or \`roblox_user_id\`',
            }, null, 2));
        }

        if (!db_user_data.products) {
            console.error(`discord_user_id: ${discord_user_id}; roblox_user_id: ${roblox_user_id}; does not have \`db_user_data.products\` defined!`);
            db_user_data.products = {}; // fix the possibility of this not being an object
        }

        const specified_product_code = req.params['specific_product_code'];
        return res.status(200).send(JSON.stringify({
            ...(specified_product_code ? {
                [specified_product_code]: db_user_data.products[specified_product_code],
            } : {
                ...db_user_data.products,
            }),
        }, null, 2));
    });
};
