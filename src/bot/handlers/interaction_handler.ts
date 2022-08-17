/* Copyright © Inertia Lighting | All Rights Reserved */

//---------------------------------------------------------------------------------------------------------------//

import * as Discord from 'discord.js';

import { interactions } from '../common/interaction';

//---------------------------------------------------------------------------------------------------------------//

/**
 * Handles raw interaction payloads from Discord
 */
async function interactionHandler(unknown_interaction: Discord.Interaction) {
    const client_interaction = interactions.find(client_interaction => {
        let unknown_interaction_identifier: string;

        switch (unknown_interaction.type) {
            case Discord.InteractionType.ApplicationCommand: {
                unknown_interaction_identifier = unknown_interaction.commandName;
                break;
            }

            case Discord.InteractionType.MessageComponent: {
                unknown_interaction_identifier = unknown_interaction.customId;
                break;
            }

            case Discord.InteractionType.ApplicationCommandAutocomplete: {
                unknown_interaction_identifier = unknown_interaction.commandName;
                break;
            }

            case Discord.InteractionType.ModalSubmit: {
                unknown_interaction_identifier = unknown_interaction.customId;
                break;
            }

            default: {
                unknown_interaction_identifier = (unknown_interaction as Discord.Interaction).id;

                break;
            }
        }

        return client_interaction.identifier === unknown_interaction_identifier;
    });

    /* check if the interaction exists */
    if (!client_interaction) {
        console.warn('Unknown interaction:', { unknown_interaction });

        if (unknown_interaction.isChatInputCommand()) {
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
