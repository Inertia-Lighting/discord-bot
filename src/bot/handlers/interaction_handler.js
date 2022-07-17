/* Copyright © Inertia Lighting | All Rights Reserved */

//---------------------------------------------------------------------------------------------------------------//

'use strict';

//---------------------------------------------------------------------------------------------------------------//

const { interactions } = require('../common/interaction.js');

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
    const client_interaction = interactions.find(client_interaction => {
        let unknown_interaction_identifier;
        switch (unknown_interaction.type) {
            case 'MESSAGE_COMPONENT': {
                unknown_interaction_identifier = unknown_interaction.customId;
                break;
            }

            case 'MODAL_SUBMIT': {
                unknown_interaction_identifier = unknown_interaction.customId;
                break;
            }

            case 'APPLICATION_COMMAND': {
                unknown_interaction_identifier = unknown_interaction.commandName;
                break;
            }

            case 'APPLICATION_COMMAND_AUTOCOMPLETE': {
                unknown_interaction_identifier = unknown_interaction.commandName;
                break;
            }

            case 'PING': {
                unknown_interaction_identifier = unknown_interaction.id;
                break;
            }

            default: {
                unknown_interaction_identifier = undefined;
                break;
            }
        }

        return client_interaction.identifier === unknown_interaction_identifier;
    });

    /* check if the interaction exists */
    if (
        !client_interaction
    ) {
        console.warn('Unknown interaction:', { unknown_interaction });

        if (
            unknown_interaction.type === 'APPLICATION_COMMAND' &&
            unknown_interaction.command.type === 'CHAT_INPUT'
        ) {
            unknown_interaction.reply('Sorry but this command doesn\'t work right now!');
        }

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
