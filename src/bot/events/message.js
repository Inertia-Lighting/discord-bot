'use strict';

//---------------------------------------------------------------------------------------------------------------//

const { client } = require('../discord_client.js');

//---------------------------------------------------------------------------------------------------------------//

const { suggestionsChannelHandler } = require('../handlers/suggestions_channel_handler.js');
const { commandHandler } = require('../handlers/command_handler.js');

//---------------------------------------------------------------------------------------------------------------//

const command_prefix = process.env.BOT_COMMAND_PREFIX;

const suggestions_channel_id = process.env.BOT_SUGGESTIONS_CHANNEL_ID;

//---------------------------------------------------------------------------------------------------------------//

module.exports = {
    name: 'message',
    async handler(message) {
        /* don't allow bots */
        if (message.author.bot) return;

        /* only allow text channels */
        if (message.channel.type !== 'text') return;

        /* handle messages sent in the suggestions channel */
        if (message.channel.id === suggestions_channel_id) {
            suggestionsChannelHandler(message);
            return;
        }

        /* respond to mentions of this bot */
        if (message.content.startsWith(`<@!${client.user.id}>`)) {
            message.reply([
                `The command_prefix for me is \`${command_prefix}\`.`,
                `To see a list of commands do \`${command_prefix}help\`!`,
            ].join('\n')).catch(console.warn);
        }

        /* handle commands */
        if (message.content.startsWith(command_prefix)) {
            commandHandler(message);
        }
    },
};
