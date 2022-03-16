/* Copyright © Inertia Lighting | All Rights Reserved */

//---------------------------------------------------------------------------------------------------------------//

'use strict';

//---------------------------------------------------------------------------------------------------------------//

const { Discord } = require('../discord_client.js');

const { command_permission_levels } = require('../common/bot.js');

//---------------------------------------------------------------------------------------------------------------//

module.exports = {
    name: 'demo',
    description: 'why does this even exist',
    aliases: ['demo', 'test', 'testing'],
    permission_level: command_permission_levels.PUBLIC,
    cooldown: 10_000,
    async execute(message, args) {
        message.channel.send({
            embeds: [
                new Discord.MessageEmbed({
                    color: 0x60A0FF,
                    description: 'You can try out our products from the testing game!',
                }),
            ],
            components: [
                {
                    type: 1,
                    components: [
                        {
                            type: 2,
                            style: 5,
                            label: 'Testing Game',
                            url: 'https://demo.inertia.lighting/',
                        },
                    ],
                },
            ],
        }).catch(console.warn);
    },
};
