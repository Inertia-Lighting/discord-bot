'use strict';

//---------------------------------------------------------------------------------------------------------------//

const { Discord, client } = require('../discord_client.js');

//---------------------------------------------------------------------------------------------------------------//

const { commandHandler } = require('../handlers/commandHandler.js');

//---------------------------------------------------------------------------------------------------------------//

const command_prefix = process.env.COMMAND_PREFIX;

//---------------------------------------------------------------------------------------------------------------//

module.exports = {
    name: 'message',
    async handler(message) {
        /* don't allow bots */
        if (message.author.bot) return;

        /* only allow text channels */
        if (message.channel.type !== 'text') return;

        /* respond to mentions */
        if (message.content.startsWith(`<@!${client.user.id}>`)) {
            message.reply(`The command_prefix for me is \`${command_prefix}\`. To see a list of commands do \`${command_prefix}help\`!`).catch(console.warn);
        }

        /* handle commands */
        if (message.content.startsWith(command_prefix)) {
            commandHandler(Discord, client, message, command_prefix);
        }
    },
};
