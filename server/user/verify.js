'use strict';

//---------------------------------------------------------------------------------------------------------------//

const axios = require('axios');

//---------------------------------------------------------------------------------------------------------------//

const mongo = require('../../mongo.js');
const userSchema = require('../../schemas/userSchema.js');

//---------------------------------------------------------------------------------------------------------------//

async function userVerify(router, client) {
    router.post('/user/verify', async (req, res) => {
        console.info(`Endpoint: ${req.url}; has been called!`);
        if (req.headers?.['content-type'] !== 'application/json') {
            console.error('WRONG CONTENT TYPE SENT TO SERVER!');
            return;
        }

        res.set('Content-Type', 'application/json');

        console.log('req.body', req.body);

        const { player_id: roblox_user_id } = req.body;

        if (!roblox_user_id) {
            res.status(400).send(JSON.stringify({
                'message': 'parameter \`roblox_user_id\` was not sent',
            }, null, 2));
            return;
        }

        const { data: roblox_user } = await axios.get(`https://api.roblox.com/users/${encodeURIComponent(roblox_user_id)}`);

        console.log({ roblox_user });

        if (!roblox_user) {
            res.status(404).send(JSON.stringify({
                'message': 'a roblox user could not be found for \`roblox_user_id\`',
            }, null, 2));
            return;
        }

        await mongo(); // initialize connection to database

        const db_user_data = await userSchema.findOne({
            'ROBLOX_ID': roblox_user_id,
        });

        if (db_user_data) {
            res.status(200).send(JSON.stringify({
                'user_can_verify': false,
                'message': 'that \`roblox_user_id\` is already in the database',
            }));
            return;
        }

        const potential_old_verification_context = client.$.verification_contexts.find(item => item.roblox_user_id === roblox_user_id);

        const verification_code = potential_old_verification_context?.verification_code ?? (new Buffer.from(`${Date.now()}`.slice(7))).toString('base64');

        console.log({
            potential_old_verification_context,
            roblox_user_id,
            verification_code,
        });

        client.$.verification_contexts.set(verification_code, {
            verification_code: verification_code,
            roblox_user_id: roblox_user_id,
        });

        res.status(200).send(JSON.stringify({
            'user_can_verify': true,
            'verification_code': verification_code,
        }));
    });
}

//---------------------------------------------------------------------------------------------------------------//

module.exports = {
    userVerify,
};
