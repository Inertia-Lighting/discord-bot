//------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
//------------------------------------------------------------//

import * as Discord from 'discord.js';

//------------------------------------------------------------//

/**
 * Disables all message components on a message.
 * @deprecated Do not use.
 */
export function disableMessageComponents(
    message: Discord.Message,
): Promise<Discord.Message> {
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

//------------------------------------------------------------//

enum CustomEmbedColor {
    Brand = 0x60A0FF,
    White = 0xFFFFFF,
    Red = 0xFF0000,
    Orange = 0xFF5500,
    Yellow = 0xFFFF00,
    Green = 0x00FF00,
    Blue = 0x0000FF,
    Indigo = 0x550088,
    Violet = 0xAA00FF,
    Magenta = 0xFF00FF,
}

export class CustomEmbed {
    static Color = CustomEmbedColor;

    static from(
        options: Discord.APIEmbed & {
            color?: CustomEmbedColor,
        },
    ): Discord.EmbedBuilder {
        options.color ??= this.Color.Brand;

        return Discord.EmbedBuilder.from(options);
    }
}
