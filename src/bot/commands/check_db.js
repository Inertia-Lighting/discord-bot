/* Copyright © Inertia Lighting | All Rights Reserved */

//---------------------------------------------------------------------------------------------------------------//

'use strict';

//---------------------------------------------------------------------------------------------------------------//

const { go_mongo_db } = require('../../mongo/mongo.js');
const { Timer } = require('../../utilities.js');

//---------------------------------------------------------------------------------------------------------------//

module.exports = {
    name: 'check_db',
    description: 'n/a',
    aliases: ['check_db'],
    permission_level: 'admin',
    cooldown: 60_000,
    async execute(message, args) {
        /* fetch all documents from the users collection */
        const all_users = await go_mongo_db.find(process.env.MONGO_DATABASE_NAME, process.env.MONGO_USERS_COLLECTION_NAME, {});

        /* iterate over all users */
        for (const user of all_users) {
            const matching_users_by_identifiers = await go_mongo_db.find(process.env.MONGO_DATABASE_NAME, process.env.MONGO_USERS_COLLECTION_NAME, {
                $or: [
                    { 'identity.discord_user_id': user.identity.discord_user_id },
                    { 'identity.roblox_user_id': user.identity.roblox_user_id },
                ],
            });

            /* check if multiple users share the same identifier */
            if (matching_users_by_identifiers.length === 1) continue;

            await message.channel.send({
                content: [
                    'User:',
                    `${'```'}\n${JSON.stringify(user.identity, null, 2)}\n${'```'}`,
                    'has identifiers that are present in the users collection more than once!',
                ].join('\n'),
            });

            await Timer(1000);
        }

        message.reply({
            content: 'Done checking the database!',
        }).catch(console.warn);
    },
};
