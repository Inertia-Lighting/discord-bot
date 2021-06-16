/* Copyright © Inertia Lighting | All Rights Reserved */

//---------------------------------------------------------------------------------------------------------------//

'use strict';

//---------------------------------------------------------------------------------------------------------------//

const bcrypt = require('bcryptjs');

const { go_mongo_db } = require('../../../../mongo/mongo.js');

//---------------------------------------------------------------------------------------------------------------//

module.exports = (router, client) => {
    router.post('/v1/products/fetch/:specific_product_code?', async (req, res) => {
        res.set('Content-Type', 'application/json');

        if (req.headers?.['content-type'] !== 'application/json') {
            return res.status(415).send(JSON.stringify({
                'message': '\`content-type\` must be \`application/json\`!',
            }, null, 2));
        }

        const {
            api_endpoint_token: api_endpoint_token,
        } = req.body;

        /* check if the request was properly authenticated */
        if (api_endpoint_token && typeof api_endpoint_token === 'string') {
            const api_endpoint_token_is_valid = bcrypt.compareSync(api_endpoint_token, process.env.API_HASHED_TOKEN_FOR_PRODUCTS_FETCH);
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

        const specified_product_code = req.params['specific_product_code'];
        const db_roblox_products = await go_mongo_db.find(process.env.MONGO_DATABASE_NAME, process.env.MONGO_PRODUCTS_COLLECTION_NAME, {
            ...(specified_product_code ? {
                code: specified_product_code,
            } : {}),
        }, {
            projection: {
                '_id': false,
            },
        });

        const roblox_products = {};
        for (const db_roblox_product of db_roblox_products) {
            roblox_products[db_roblox_product.code] = db_roblox_product;
        }

        return res.status(200).send(JSON.stringify(roblox_products, null, 2));
    });
};
