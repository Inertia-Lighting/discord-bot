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
        /* empty the new database */
        await go_mongo_db.remove(process.env.MONGO_DATABASE_NAME, process.env.MONGO_USERS_COLLECTION_NAME, {});

        /* copy all documents from the old database */
        const all_users = await go_mongo_db.find('test', 'users', {});
        for (const user of all_users) {
            console.log({ user });

            const new_user = { ...user };

            if (new_user['_id'] && !new_user['discord_user_id']) {
                new_user['discord_user_id'] = new_user['_id'];
            }
            if (new_user['ROBLOX_ID'] && !new_user['roblox_user_id']) {
                new_user['roblox_user_id'] = new_user['ROBLOX_ID'];
            }

            if (!new_user['identity']) {
                new_user['identity'] = {};
            }
            if (new_user['discord_user_id'] && !new_user['identity']['discord_user_id']) {
                new_user['identity']['discord_user_id'] = new_user['discord_user_id'];
            }
            if (new_user['roblox_user_id'] && !new_user['identity']['roblox_user_id']) {
                new_user['identity']['roblox_user_id'] = new_user['roblox_user_id'];
            }

            delete new_user['__v'];
            delete new_user['_id'];
            delete new_user['ROBLOX_ID'];
            delete new_user['discord_user_id'];
            delete new_user['roblox_user_id'];

            /* add the modified document to the new database */
            await go_mongo_db.add(process.env.MONGO_DATABASE_NAME, process.env.MONGO_USERS_COLLECTION_NAME, [
                object_sort(new_user),
            ]);

            // await go_mongo_db.remove(process.env.MONGO_DATABASE_NAME, process.env.MONGO_USERS_COLLECTION_NAME, {
            //     '_id': user['_id'],
            // });

            // await go_mongo_db.remove(process.env.MONGO_DATABASE_NAME, process.env.MONGO_USERS_COLLECTION_NAME, {
            //     'discord_user_id': user['discord_user_id'],
            // });

            console.log({ new_user });

            console.log('----------------------------------------------------------------------------------------------------------------');
        }
    },
};
