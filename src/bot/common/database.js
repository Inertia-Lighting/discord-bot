/* Copyright © Inertia Lighting | All Rights Reserved */

//---------------------------------------------------------------------------------------------------------------//

'use strict';

//---------------------------------------------------------------------------------------------------------------//

async function generateNewUserDocument({ discord_user_id, roblox_user_id }) {
    if (typeof discord_user_id !== 'string') throw new TypeError('discord_user_id must be a string');
    if (typeof roblox_user_id !== 'string') throw new TypeError('roblox_user_id must be a string');

    return {
        'identity': {
            'discord_user_id': discord_user_id,
            'roblox_user_id': roblox_user_id,
        },
        'karma': 0,
        'products': {},
    };
}

//---------------------------------------------------------------------------------------------------------------//

module.exports = {
    generateNewUserDocument,
};
