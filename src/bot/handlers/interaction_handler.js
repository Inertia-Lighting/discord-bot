/* Copyright © Inertia Lighting | All Rights Reserved */

//---------------------------------------------------------------------------------------------------------------//

'use strict';

//---------------------------------------------------------------------------------------------------------------//

const { client } = require('../discord_client.js');

//---------------------------------------------------------------------------------------------------------------//

/**
 * @typedef {import('discord.js').Interaction} DiscordInteraction
 * @typedef {{
 *  identifier: string,
 *  execute(interaction: Discord.Interaction) => Promise<void>,
 * }} CustomInteraction
 */

//---------------------------------------------------------------------------------------------------------------//

/**
 * Handles raw interaction payloads from Discord
 * @param {DiscordInteraction} unknown_interaction
 * @returns {Promise<void>}
 */
async function interactionHandler(unknown_interaction) {
    /** @type {CustomInteraction?} */
    const interaction = client.$.interactions.find(interaction => {
        const unknown_interaction_identifier = unknown_interaction.type === 'MESSAGE_COMPONENT' ? (
            unknown_interaction.customId
        ) : (
            unknown_interaction.type === 'APPLICATION_COMMAND' ? (
                unknown_interaction.commandName
            ) : (
                unknown_interaction.id
            )
        );

        return interaction.identifier === unknown_interaction_identifier;
    });

    /* check if the interaction exists */
    if (!interaction) return;

    /* execute the interaction */
    try {
        await interaction.execute(unknown_interaction);
    } catch (error) {
        console.trace({
            interaction_identifier: interaction.identifier,
            interaction_type: unknown_interaction.type,
            error_message: error,
        });
    }
}

//---------------------------------------------------------------------------------------------------------------//

module.exports = {
    interactionHandler,
};
