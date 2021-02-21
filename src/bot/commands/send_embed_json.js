'use strict';

//---------------------------------------------------------------------------------------------------------------//

const axios = require('axios');

const { Timer } = require('../../utilities.js');

// const { Discord, client } = require('../discord_client.js');

//---------------------------------------------------------------------------------------------------------------//

module.exports = {
    name: 'send_embeds_from_json',
    description: 'sends embeds from json for Drawn',
    aliases: ['send_embeds_from_json'],
    permission_level: 'admin',
    async execute(message, args) {
        const msg_attachment = message.attachments.first();

        if (!msg_attachment) {
            message.reply('Send a file first!').catch(console.warn);
            return;
        }

        try {
            const { data: msg_attachment_file_contents } = await axios.get(msg_attachment.url);

            if (typeof msg_attachment_file_contents !== 'object') {
                throw new TypeError('\`msg_attachment_file_contents\` was not an object!');
            }

            const webhook_message_options = msg_attachment_file_contents;
            webhook_message_options.avatarURL = webhook_message_options.avatar_url;
            delete webhook_message_options.avatar_url;

            for (const embed of webhook_message_options.embeds) {
                message.channel.send({ embed: embed }).catch(console.warn);
                await Timer(5_000);
            }
        } catch (error) {
            console.trace(error);
            message.reply('Something went wrong, check the console!').catch(console.warn);
        }
    },
};
