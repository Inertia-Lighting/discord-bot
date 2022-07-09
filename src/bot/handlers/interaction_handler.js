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
    const client_interaction = client.$.interactions.find(client_interaction => {
        const unknown_interaction_identifier = unknown_interaction.type === 'MESSAGE_COMPONENT' ? (
            unknown_interaction.customId
        ) : (
            unknown_interaction.type === 'APPLICATION_COMMAND' ? (
                unknown_interaction.commandName
            ) : (
                unknown_interaction.type === 'APPLICATION_COMMAND_AUTOCOMPLETE' ? (
                    unknown_interaction.commandName
                ) : (
                    unknown_interaction.type === 'PING' ? (
                        unknown_interaction.id
                    ) : (
                        null
                    )
                )
            )
        );

        return client_interaction.identifier === unknown_interaction_identifier;
    });

    /* check if the interaction exists */
    if (!client_interaction) {
        console.warn(`Unknown interaction: ${unknown_interaction}`);

        unknown_interaction?.reply('Sorry but this command doesn\'t work right now!');

        return;
    }

    /* interaction logging */
    console.info({
        client_interaction_identifier: client_interaction.identifier,
        interaction_type: unknown_interaction.type,
        interaction: unknown_interaction,
    });

    /* execute the interaction */
    try {
        await client_interaction.execute(unknown_interaction);
    } catch (error) {
        console.trace({
            client_interaction_identifier: client_interaction.identifier,
            interaction_type: unknown_interaction.type,
            error_message: error,
        });
    }
}

//---------------------------------------------------------------------------------------------------------------//

module.exports = {
    interactionHandler,
};
