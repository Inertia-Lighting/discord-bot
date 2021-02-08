'use strict';

//---------------------------------------------------------------------------------------------------------------//

const moment = require('moment-timezone');
const { go_mongo_db } = require('../../mongo/mongo.js');

//---------------------------------------------------------------------------------------------------------------//

async function userProductsFetch(router, client) {
    router.post('/user/products/fetch/:product_name?', async (req, res) => {
        console.info(`Endpoint: ${req.url}; was called at ${moment()}!`);

        if (req.headers?.['content-type'] !== 'application/json') {
            console.error('WRONG CONTENT TYPE SENT TO SERVER!');
            return;
        }

        res.set('Content-Type', 'application/json');

        console.log('req.body', req.body);

        const { player_id: roblox_user_id } = req.body;

        if (!roblox_user_id) {
            res.status(400).send(JSON.stringify({
                'message': 'missing \`player_id\` in request body',
            }, null, 2));
            return;
        }

        const [ db_user_data ] = await go_mongo_db.find(process.env.MONGO_DATABASE_NAME, process.env.MONGO_USERS_COLLECTION_NAME, {
            'roblox_user_id': roblox_user_id,
        });

        if (!db_user_data) {
            res.status(404).send(JSON.stringify({
                'message': 'a roblox user could not be found for \`roblox_user_id\`',
            }, null, 2));
            return;
        }

        if (!db_user_data.products) {
            console.error(`roblox_user_id: ${roblox_user_id}; does not have \`db_user_data.products\` defined!`);
            db_user_data.products = {}; // fix the possibility of this not being an object
        }

        const specified_product_name = req.params['product_name'];
        if (specified_product_name) {
            res.status(200).send(JSON.stringify(db_user_data.products[specified_product_name], null, 2));
        } else {
            res.status(200).send(JSON.stringify(db_user_data.products, null, 2));
        }
    });
}

//---------------------------------------------------------------------------------------------------------------//

module.exports = {
    userProductsFetch,
};
