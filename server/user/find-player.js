async function userFind(router, client, userSchema, mongo) {
    router.post('/user/find-player', async (req, res) => {
        if (req.headers?.['content-type'] !== 'application/json') {
            console.error('WRONG CONTENT TYPE SENT TO SERVER!');
            return;
        }

        await mongo(); // initialize connection to database

        const db_user_data = await userSchema.findOne({
            'ROBLOX_ID': req.body.player_id
        });

        if (db_user_data) {
            res.status(200).send('User in database');
        } else {
            console.log('User not found in database!');
            res.status(404).send('error: user not found');
        }
    });
}

module.exports = {
    userFind,
}
