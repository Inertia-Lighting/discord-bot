'use strict';

//---------------------------------------------------------------------------------------------------------------//

async function userProductsFetch(router, client, userSchema, mongo) {
    router.post('/user/products/fetch/:product_name?', async (req, res) => {
        if (req.headers?.['content-type'] !== 'application/json') {
            console.error('WRONG CONTENT TYPE SENT TO SERVER!');
            return;
        }

        const { player_id: roblox_user_id } = req.body;
        console.log('req.body', req.body);
        await mongo(); // initialize connection to database

        const user_data = await userSchema.findOne({
            'ROBLOX_ID': roblox_user_id,
        });

        if (!user_data) {
            res.status(404).send(JSON.stringify({
                'message': 'a roblox user could not be found for \`roblox_user_id\`',
            }, null, 2));
            return;
        }

        if (!user_data.products) {
            console.error(`roblox_user_id: ${roblox_user_id}; does not have \`user_data.products\` defined!`);
            user_data.products = {}; // fix the possibility of this not being an object
        }

        const specified_product_name = req.params['product_name'];
        if (specified_product_name) {
            res.status(200).send(JSON.stringify(user_data.products[specified_product_name], null, 2));
        } else {
            res.status(200).send(JSON.stringify(user_data.products, null, 2));
        }
    });
}

//---------------------------------------------------------------------------------------------------------------//

module.exports = {
    userProductsFetch,
};
