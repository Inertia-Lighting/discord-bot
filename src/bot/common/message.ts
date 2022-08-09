/* Copyright © Inertia Lighting | All Rights Reserved */

//---------------------------------------------------------------------------------------------------------------//

import { Discord } from '../discord_client.js';

//---------------------------------------------------------------------------------------------------------------//

/**
 * Disables all message components on a message.
 */
function disableMessageComponents(message: Discord.Message): Promise<Discord.Message> {
    if (!(message instanceof Discord.Message)) throw new TypeError('message must be an instance of Discord.Message');

    return message.fetch(true).then(message => message.edit({
        embeds: message.embeds,
        components: message.components.map(component_row => ({
            ...component_row.toJSON(),
            components: component_row.components.map(component => ({
                ...component.toJSON(),
                disabled: true,
            })),
        })) as unknown as Discord.MessageActionRow[],
    }));
}

//---------------------------------------------------------------------------------------------------------------//

module.exports = {
    disableMessageComponents,
};
