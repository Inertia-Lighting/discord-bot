/* Copyright © Inertia Lighting | All Rights Reserved */

//---------------------------------------------------------------------------------------------------------------//

'use strict';

//---------------------------------------------------------------------------------------------------------------//

const bcrypt = require('bcryptjs');

//---------------------------------------------------------------------------------------------------------------//

module.exports = (router, client) => {
    router.post('/v1/user/verification/verify', async (req, res) => {
        res.set('Content-Type', 'application/json');

        if (req.headers?.['content-type'] !== 'application/json') {
            return res.status(415).send(JSON.stringify({
                'message': '\`content-type\` must be \`application/json\`!',
            }, null, 2));
        }

        const {
            api_endpoint_token: api_endpoint_token,
            roblox_user_id: roblox_user_id,
        } = req.body;

        /* check if required information is present */
        if (!roblox_user_id || typeof api_endpoint_token !== 'string') {
            return res.status(400).send(JSON.stringify({
                'message': 'missing (string) \`roblox_user_id\` in request body',
            }, null, 2));
        }
        if (!api_endpoint_token || typeof api_endpoint_token !== 'string') {
            return res.status(400).send(JSON.stringify({
                'message': 'missing (string) \`api_endpoint_token\` in request body',
            }, null, 2));
        }

        /* check if the request was properly authenticated */
        const api_endpoint_token_is_valid = bcrypt.compareSync(api_endpoint_token, process.env.API_HASHED_TOKEN_FOR_USER_VERIFY);
        if (!api_endpoint_token_is_valid) {
            return res.status(403).send(JSON.stringify({
                'message': '\`api_endpoint_token\` was not recognized!',
            }, null, 2));
        }

        const potential_old_verification_context = client.$.verification_contexts.find(verification_context => verification_context.roblox_user_id === roblox_user_id);

        const potential_old_verification_code = potential_old_verification_context?.verification_code;
        const verification_code = potential_old_verification_code ?? (new Buffer.from(`${Date.now()}`.slice(7))).toString('base64');

        client.$.verification_contexts.set(verification_code, {
            verification_code: verification_code,
            roblox_user_id: roblox_user_id,
        });

        return res.status(200).send(JSON.stringify({
            'verification_code': verification_code,
        }));
    });
};
