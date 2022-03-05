/* Copyright © Inertia Lighting | All Rights Reserved */

//---------------------------------------------------------------------------------------------------------------//

'use strict';

//---------------------------------------------------------------------------------------------------------------//

const { Discord } = require('../discord_client.js');

//---------------------------------------------------------------------------------------------------------------//

/**
 * Disables all message components on a message.
 * @param {Discord.Message} message
 * @returns {Promise<Discord.Message>}
 */
 function disableMessageComponents(message) {
    if (!(message instanceof Discord.Message)) throw new TypeError('message must be an instance of Discord.Message');

    return message.fetch(true).then(message => message.edit({
        embeds: message.embeds,
        components: message.components.map(component_row => ({
            ...component_row.toJSON(),
            components: component_row.components.map(component => ({
                ...component.toJSON(),
                disabled: true,
            })),
        })),
    }));
}

//---------------------------------------------------------------------------------------------------------------//

module.exports = {
    disableMessageComponents,
};
