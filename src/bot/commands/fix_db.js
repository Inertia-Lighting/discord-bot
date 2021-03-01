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

            if (!new_user['identity']) new_user['identity'] = {};
            if (new_user['discord_user_id'] && !new_user['identity']['discord_user_id']) new_user['identity']['discord_user_id'] = new_user['discord_user_id'];
            if (new_user['roblox_user_id'] && !new_user['identity']['roblox_user_id']) new_user['identity']['roblox_user_id'] = new_user['roblox_user_id'];

            delete new_user['__v'];
            delete new_user['_id'];
            delete new_user['ROBLOX_ID'];
            delete new_user['discord_user_id'];
            delete new_user['roblox_user_id'];

            if (!new_user['products']) new_user['products'] = {};
            if (new_user['products']['Laser_Fixture']) new_user['products']['LASER_FIXTURE'] = new_user['products']['Laser_Fixture'];
            if (new_user['products']['Follow_Spotlight']) new_user['products']['FOLLOW_SPOTLIGHT'] = new_user['products']['Follow_Spotlight'];
            if (new_user['products']['C_Lights']) new_user['products']['C_LIGHTS'] = new_user['products']['C_Lights'];
            if (new_user['products']['LED_Bars']) new_user['products']['LED_BARS'] = new_user['products']['LED_Bars'];
            if (new_user['products']['MagicPanels']) new_user['products']['MAGIC_PANELS'] = new_user['products']['MagicPanels'];
            if (new_user['products']['House_Lights']) new_user['products']['HOUSE_LIGHTS'] = new_user['products']['House_Lights'];
            if (new_user['products']['Pars']) new_user['products']['PARS'] = new_user['products']['Pars'];
            if (new_user['products']['Blinders']) new_user['products']['BLINDERS'] = new_user['products']['Blinders'];
            if (new_user['products']['Wash']) new_user['products']['WASHES'] = new_user['products']['Wash'];

            delete new_user['products']['Laser_Fixture'];
            delete new_user['products']['Follow_Spotlight'];
            delete new_user['products']['C_Lights'];
            delete new_user['products']['LED_Bars'];
            delete new_user['products']['MagicPanels'];
            delete new_user['products']['House_Lights'];
            delete new_user['products']['Pars'];
            delete new_user['products']['Blinders'];
            delete new_user['products']['Wash'];

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
