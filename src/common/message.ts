// ------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
// ------------------------------------------------------------//

import * as Discord from 'discord.js';

// ------------------------------------------------------------//

enum CustomEmbedColor {
    Brand = 0x60a0ff,
    White = 0xffffff,
    Red = 0xff0000,
    Orange = 0xff5500,
    Yellow = 0xffff00,
    Green = 0x00ff00,
    Blue = 0x0000ff,
    Indigo = 0x550088,
    Violet = 0xaa00ff,
    Magenta = 0xff00ff,
    Gray = 0x808080,
}

export class CustomEmbed {
    static Color = CustomEmbedColor;

    static from(
        options: Discord.APIEmbed & {
            color?: CustomEmbedColor;
        },
    ): Discord.EmbedBuilder {
        options.color ??= this.Color.Brand;

        return Discord.EmbedBuilder.from(options);
    }
}
