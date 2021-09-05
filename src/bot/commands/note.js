/* Copyright © Inertia Lighting | All Rights Reserved */

//---------------------------------------------------------------------------------------------------------------//

'use strict';

// create update remove purge lookup

//---------------------------------------------------------------------------------------------------------------//

const { command_permission_levels } = require('../common/bot.js');


//---------------------------------------------------------------------------------------------------------------//

module.exports = {
    name: 'note',
    description: 'adds a note to a member in the discord guild',
    aliases: ['note'],
    permission_level: command_permission_levels.STAFF,
    async execute(message, args) {
        // const { command_prefix, command_name, command_args } = args;
        // const sub_command_args = message.content.split(/\s+/g).slice(2);

    },
};
