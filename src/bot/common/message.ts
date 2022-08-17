//------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
//------------------------------------------------------------//

//---------------------------------------------------------------------------------------------------------------//

import { Discord } from '../discord_client';

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
        })) as unknown as Discord.ActionRow<Discord.MessageActionRowComponent>[],
    }));
}

class CustomEmbed {
    static colors = {
        BRAND: 0x60A0FF,
        WHITE: 0xFFFFFF,
        RED: 0xFF0000,
        ORANGE: 0xFF5500,
        YELLOW: 0xFFFF00,
        GREEN: 0x00FF00,
        BLUE: 0x0000FF,
        INDIGO: 0x550088,
        VIOLET: 0xAA00FF,
    };

    static from(options: Discord.APIEmbed): Discord.EmbedBuilder {
        options.color ??= this.colors.BRAND;

        return Discord.EmbedBuilder.from(options);
    }
}

//---------------------------------------------------------------------------------------------------------------//

export {
    disableMessageComponents,
    CustomEmbed,
};
