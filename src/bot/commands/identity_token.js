/* Copyright © Inertia Lighting | All Rights Reserved */

//---------------------------------------------------------------------------------------------------------------//

'use strict';

//---------------------------------------------------------------------------------------------------------------//

const { Discord } = require('../discord_client.js');

const { command_permission_levels } = require('../common/bot.js');

//---------------------------------------------------------------------------------------------------------------//

module.exports = {
    name: 'identity_token',
    description: 'n/a',
    aliases: ['identity_token'],
    permission_level: command_permission_levels.PUBLIC,
    cooldown: 15_000,
    async execute(message, args) {
        message.reply({
            embeds: [
                new Discord.MessageEmbed({
                    color: 0x60A0FF,
                    description: 'Go to <#811341531784413235> to learn more about Identity Tokens!',
                }),
            ],
        }).catch(console.warn);
    },
};
