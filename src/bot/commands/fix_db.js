'use strict';

//---------------------------------------------------------------------------------------------------------------//

const { go_mongo_db } = require('../../mongo/mongo.js');

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
        }
    },
};
