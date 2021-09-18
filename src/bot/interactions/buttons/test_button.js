/* Copyright © Inertia Lighting | All Rights Reserved */

//---------------------------------------------------------------------------------------------------------------//

'use strict';

//---------------------------------------------------------------------------------------------------------------//

/**
 * @typedef {import('discord.js').ButtonInteraction} ButtonInteraction
 */

//---------------------------------------------------------------------------------------------------------------//

module.exports = {
    identifier: 'test_button',
    /** @param {ButtonInteraction} interaction */
    async execute(interaction) {
        await interaction.reply('this is a test');
    },
};
