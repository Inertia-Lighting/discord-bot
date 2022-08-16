/* Copyright © Inertia Lighting | All Rights Reserved */

//---------------------------------------------------------------------------------------------------------------//

import * as Discord from 'discord.js';

import { interactions } from '../common/interaction.js';

//---------------------------------------------------------------------------------------------------------------//

/**
 * Handles raw interaction payloads from Discord
 */
async function interactionHandler(unknown_interaction: Discord.Interaction) {
    const client_interaction = interactions.find(client_interaction => {
        const unknown_interaction_identifier = unknown_interaction.isMessageComponent() ? (
            unknown_interaction.customId
        ) : (
            unknown_interaction.isModalSubmit() ? (
                unknown_interaction.customId
            ) : (
                unknown_interaction.isApplicationCommand() ? (
                    unknown_interaction.commandName
                ) : (
                    unknown_interaction.isAutocomplete() ? (
                        unknown_interaction.commandName
                    ) : (
                        unknown_interaction.id
                    )
                )
            )
        );

        return client_interaction.identifier === unknown_interaction_identifier;
    });

    /* check if the interaction exists */
    if (
        !client_interaction
    ) {
        console.warn('Unknown interaction:', { unknown_interaction });

        if (
            unknown_interaction.isApplicationCommand() &&
            unknown_interaction.command?.type === 'CHAT_INPUT'
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

export {
    interactionHandler,
};
