/* Copyright © Inertia Lighting | All Rights Reserved */

//---------------------------------------------------------------------------------------------------------------//

'use strict';

//---------------------------------------------------------------------------------------------------------------//

// const moment = require('moment-timezone');
// const bcrypt = require('bcryptjs');

const { go_mongo_db } = require('../../../../mongo/mongo.js');

//---------------------------------------------------------------------------------------------------------------//

const bot_guild_id = process.env.BOT_GUILD_ID;

//---------------------------------------------------------------------------------------------------------------//

module.exports = (router, client) => {
    router.post('/v1/user/products/fetch/:specific_product_code?', async (req, res) => {
        res.set('Content-Type', 'application/json');

        if (req.headers?.['content-type'] !== 'application/json') {
            return res.status(415).send(JSON.stringify({
                'message': '\`content-type\` must be \`application/json\`!',
            }, null, 2));
        }

        // console.log('req.body', req.body);

        const {
            // api_endpoint_token: api_endpoint_token,
            // api_access_key: game_owner_api_access_key,
            discord_user_id: discord_user_id,
            roblox_user_id: roblox_user_id,
        } = req.body;

        /* check if required information is present */
        if (!(roblox_user_id || discord_user_id) || typeof (roblox_user_id ?? discord_user_id) !== 'string') {
            return res.status(400).send(JSON.stringify({
                'message': 'missing (string) \`discord_user_id\` or (string) \`roblox_user_id\` in request body',
            }, null, 2));
        }

        /* check if the request was properly authenticated */
        // if (api_endpoint_token) {
        //     if (typeof api_endpoint_token !== 'string') {
        //         return res.status(400).send(JSON.stringify({
        //             'message': '\`api_endpoint_token\` must be a string when specified!',
        //         }, null, 2));
        //     }

        //     const api_endpoint_token_is_valid = bcrypt.compareSync(api_endpoint_token, process.env.API_HASHED_TOKEN_FOR_USER_PRODUCTS_FETCH);
        //     if (!api_endpoint_token_is_valid) {
        //         return res.status(403).send(JSON.stringify({
        //             'message': '(string) \`api_endpoint_token\` was not valid or recognized!',
        //         }, null, 2));
        //     }
        // } else if (game_owner_api_access_key && typeof game_owner_api_access_key === 'string') {
        //     const [ db_user_auth_data ] = await go_mongo_db.find(process.env.MONGO_DATABASE_NAME, process.env.MONGO_API_AUTH_USERS_COLLECTION_NAME, {
        //         ...(discord_user_id ? {
        //             'identity.discord_user_id': discord_user_id,
        //         } : {
        //             'identity.roblox_user_id': roblox_user_id,
        //         }),
        //     });

        //     if (typeof db_user_auth_data !== 'object') {
        //         return res.status(403).send(JSON.stringify({
        //             'message': `\`db_user_auth_data\` was not found for discord_user_id: \'${discord_user_id}\'; roblox_user_id: \'${discord_user_id}\';`
        //         }, null, 2));
        //     }

        //     if (typeof db_user_auth_data.api_access !== 'object') {
        //         console.trace(`\`db_user_auth_data.api_access\` was not an object for discord_user_id: \'${discord_user_id}\'; roblox_user_id: \'${discord_user_id}\';`);
        //         return res.status(500).send(JSON.stringify({
        //             'message': `\`db_user_auth_data.api_access\` was not an object for discord_user_id: \'${discord_user_id}\'; roblox_user_id: \'${discord_user_id}\';`,
        //         }, null, 2));
        //     }

        //     if (typeof db_user_auth_data.api_access.key !== 'string') {
        //         console.trace(`\`db_user_auth_data.api_access.key\` was not a string for discord_user_id: \'${discord_user_id}\'; roblox_user_id: \'${discord_user_id}\';`);
        //         return res.status(500).send(JSON.stringify({
        //             'message': `\`db_user_auth_data.api_access.key\` was not a string for discord_user_id: \'${discord_user_id}\'; roblox_user_id: \'${roblox_user_id}\';`,
        //         }, null, 2));
        //     }

        //     if (typeof db_user_auth_data.api_access.expiration_epoch !== 'number') {
        //         console.trace(`\`db_user_auth_data.api_access.expiration_epoch\` was not a number for discord_user_id: \'${discord_user_id}\'; roblox_user_id: \'${discord_user_id}\';`);
        //         return res.status(500).send(JSON.stringify({
        //             'message': `\`db_user_auth_data.api_access.expiration_epoch\` was not a number for discord_user_id: \'${discord_user_id}\'; roblox_user_id: \'${roblox_user_id}\';`,
        //         }, null, 2));
        //     }

        //     const game_owner_api_access_key_is_valid = game_owner_api_access_key === db_user_auth_data.api_access.key;
        //     if (!game_owner_api_access_key_is_valid) {
        //         return res.status(403).send(JSON.stringify({
        //             'message': '(string) \`api_access_key\` was invalid or unrecognized!',
        //         }, null, 2));
        //     }

        //     /* determine whether or not the access_key has expired yet */
        //     const current_epoch = moment().valueOf();
        //     const game_owner_api_access_key_has_expired = current_epoch >= db_user_auth_data.api_access.expiration_epoch;

        //     if (game_owner_api_access_key_has_expired) {
        //         return res.status(403).send(JSON.stringify({
        //             'message': '(string) \`api_access_key\` has expired!',
        //         }, null, 2));
        //     }
        // } else {
        //     return res.status(400).send(JSON.stringify({
        //         'message': 'missing (string) \`api_endpoint_token\` or (string) \`api_access_key\` in request body',
        //     }, null, 2));
        // }

        const [ db_user_data ] = await go_mongo_db.find(process.env.MONGO_DATABASE_NAME, process.env.MONGO_USERS_COLLECTION_NAME, {
            ...(discord_user_id ? {
                'identity.discord_user_id': discord_user_id,
            } : {
                'identity.roblox_user_id': roblox_user_id,
            }),
        });

        if (!db_user_data) {
            return res.status(404).send(JSON.stringify({
                'message': 'a roblox user could not be found for \`discord_user_id\` or \`roblox_user_id\`',
            }, null, 2));
        }

        const bot_guild = await client.guilds.fetch(bot_guild_id);

        const guild_member = await bot_guild.members.fetch({
            user: db_user_data.identity.discord_user_id,
            force: false,
            cache: true,
        }).catch(() => null);

        const user_is_in_guild = Boolean(guild_member);

        if (!user_is_in_guild) {
            return res.status(403).send(JSON.stringify({
                'message': `discord_user_id: ${db_user_data.identity.discord_user_id}; is not in the discord server!`,
            }, null, 2));
        }

        if (typeof db_user_data.products !== 'object') {
            throw new Error(`discord_user_id: ${discord_user_id}; roblox_user_id: ${roblox_user_id}; does not have \`db_user_data.products\` defined!`);
        }

        /** @type {string?} */
        const specified_product_code = req.params.specific_product_code;

        return res.status(200).send(JSON.stringify({
            ...(specified_product_code ? {
                [specified_product_code]: db_user_data.products[specified_product_code],
            } : db_user_data.products),
        }, null, 2));
    });
};
