/* Copyright © Inertia Lighting | All Rights Reserved */

//---------------------------------------------------------------------------------------------------------------//

'use strict';

//---------------------------------------------------------------------------------------------------------------//

const { welcomeMessageHandler } = require('../handlers/welcome_message_handler.js');
const { illegalNicknameHandler } = require('../handlers/illegal_nickname_handler.js');
const { automaticVerificationHandler } = require('../handlers/automatic_verification_handler.js');

//---------------------------------------------------------------------------------------------------------------//

module.exports = {
    name: 'guildMemberAdd',
    async handler(member) {
        if (member.user.system) return; // don't operate on system accounts
        if (member.user.bot) return; // don't operate on bots to prevent feedback-loops

        /* send the welcome message to the member */
        await welcomeMessageHandler(member).catch(console.trace);

        /* handle nicknames for new members */
        await illegalNicknameHandler(member).catch(console.trace);

        /* automatically verify the user (if possible) */
        await automaticVerificationHandler(member).catch(console.trace);
    },
};
