'use strict';

//---------------------------------------------------------------------------------------------------------------//

const mongo = require('../../mongo.js');
const userSchema = require('../../schemas/userSchema.js');

//---------------------------------------------------------------------------------------------------------------//

async function userVerified(router, client) {
    router.post('/user/verified', async (req, res) => {
        console.info(`Endpoint: ${req.url}; has been called!`);
        if (req.headers?.['content-type'] !== 'application/json') {
            console.error('WRONG CONTENT TYPE SENT TO SERVER!');
            return;
        }

        res.set('Content-Type', 'application/json');

        console.log('req.body', req.body);

        const { player_id: roblox_user_id } = req.body;

        await mongo(); // initialize connection to database

        const db_user_data = await userSchema.findOne({
            'ROBLOX_ID': roblox_user_id,
        });

        if (db_user_data) {
            res.status(200).send('user has verified');
        } else {
            res.status(404).send('user not found');
        }
    });
}

//---------------------------------------------------------------------------------------------------------------//

module.exports = {
    userVerified,
};
