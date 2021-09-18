/* Copyright © Inertia Lighting | All Rights Reserved */

//---------------------------------------------------------------------------------------------------------------//

'use strict';

//---------------------------------------------------------------------------------------------------------------//

const { interactionHandler } = require('../handlers/interaction_handler.js');

//---------------------------------------------------------------------------------------------------------------//

module.exports = {
    name: 'interactionCreate',
    async handler(interaction) {
        /* don't allow bots */
        if (interaction.user.bot) return;

        /* handle interactions */
        interactionHandler(interaction);
    },
};
