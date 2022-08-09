/* Copyright © Inertia Lighting | All Rights Reserved */
//---------------------------------------------------------------------------------------------------------------//
'use strict';
//---------------------------------------------------------------------------------------------------------------//
const { Discord } = require('../discord_client.js');
const { command_permission_levels } = require('../common/bot.js');
//---------------------------------------------------------------------------------------------------------------//
module.exports = {
    name: 'product_hub',
    description: 'why does this even exist',
    aliases: ['product_hub', 'producthub', 'hub'],
    permission_level: command_permission_levels.PUBLIC,
    cooldown: 10_000,
    async execute(message, args) {
        message.channel.send({
            embeds: [
                new Discord.MessageEmbed({
                    color: 0x60A0FF,
                    description: 'Check out our Product Hub!',
                }),
            ],
            components: [
                {
                    type: 1,
                    components: [
                        {
                            type: 2,
                            style: 5,
                            label: 'Product Hub',
                            url: 'https://product-hub.inertia.lighting/',
                        },
                    ],
                },
            ],
        }).catch(console.warn);
    },
};
//# sourceMappingURL=product_hub.js.map