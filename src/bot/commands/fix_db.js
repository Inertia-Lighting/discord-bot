'use strict';

//---------------------------------------------------------------------------------------------------------------//

const { go_mongo_db } = require('../../mongo/mongo.js');
const { object_sort } = require('../../utilities.js');

//---------------------------------------------------------------------------------------------------------------//

module.exports = {
    name: 'fix_db',
    description: 'n/a',
    aliases: ['fix_db'],
    permission_level: 'admin',
    async execute(message, args) {
        const all_users = await go_mongo_db.find(process.env.MONGO_DATABASE_NAME, process.env.MONGO_USERS_COLLECTION_NAME, {});
        for (const user of all_users) {
            console.log({ user });

            const new_user = { ...user };

            if (new_user['_id'] && !new_user['discord_user_id']) new_user['discord_user_id'] = new_user['_id'];
            if (new_user['ROBLOX_ID'] && !new_user['roblox_user_id']) new_user['roblox_user_id'] = new_user['ROBLOX_ID'];

            delete new_user['__v'];
            delete new_user['_id'];
            delete new_user['ROBLOX_ID'];

            await go_mongo_db.add(process.env.MONGO_DATABASE_NAME, process.env.MONGO_USERS_COLLECTION_NAME, [
                object_sort(new_user),
            ]);

            await go_mongo_db.remove(process.env.MONGO_DATABASE_NAME, process.env.MONGO_USERS_COLLECTION_NAME, {
                '_id': user['_id'],
            });

            console.log({ new_user });

            console.log('----------------------------------------------------------------------------------------------------------------');
        }
    },
};
