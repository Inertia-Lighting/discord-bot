/* Copyright © Inertia Lighting | All Rights Reserved */

//---------------------------------------------------------------------------------------------------------------//

'use strict';

//---------------------------------------------------------------------------------------------------------------//

const axios = require('axios');

const { Timer } = require('../../utilities.js');

//---------------------------------------------------------------------------------------------------------------//

module.exports = {
    name: 'send_embeds_from_json',
    description: 'sends embeds from json for Drawn',
    aliases: ['send_embeds_from_json'],
    permission_level: 'admin',
    async execute(message, args) {
        const msg_attachment = message.attachments.first();

        if (!msg_attachment) {
            message.reply({
                content: 'Please send a \`.json\` file first!',
            }).catch(console.warn);
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
                await message.channel.send({
                    embeds: [
                        embed,
                    ],
                });
                await Timer(2_500);
            }
        } catch (error) {
            console.trace(error);
            message.reply({
                content: 'Something went wrong, please check the console for details!',
            }).catch(console.warn);
        }
    },
};
