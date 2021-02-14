'use strict';

//---------------------------------------------------------------------------------------------------------------//

const moment = require('moment-timezone');

//---------------------------------------------------------------------------------------------------------------//

module.exports = (router, client) => {
    router.post('/v1/user/verification/verify', async (req, res) => {
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
            player_id: roblox_user_id,
        } = req.body;

        if (!api_endpoint_token) {
            return res.status(400).send(JSON.stringify({
                'message': 'missing \`api_endpoint_token\` in request body',
            }, null, 2));
        }

        if (!roblox_user_id) {
            return res.status(400).send(JSON.stringify({
                'message': 'missing \`player_id\` in request body',
            }, null, 2));
        }

        if (api_endpoint_token !== process.env.API_TOKEN_FOR_USER_VERIFY) {
            return res.status(403).send(JSON.stringify({
                'message': '\`api_endpoint_token\` was not recognized!',
            }, null, 2));
        }

        const potential_old_verification_context = client.$.verification_contexts.find(item => item.roblox_user_id === roblox_user_id);

        const verification_code = potential_old_verification_context?.verification_code ?? (new Buffer.from(`${Date.now()}`.slice(7))).toString('base64');

        // console.log({
        //     potential_old_verification_context,
        //     roblox_user_id,
        //     verification_code,
        // });

        client.$.verification_contexts.set(verification_code, {
            verification_code: verification_code,
            roblox_user_id: roblox_user_id,
        });

        return res.status(200).send(JSON.stringify({
            'user_can_verify': true,
            'verification_code': verification_code,
        }));
    });
};
