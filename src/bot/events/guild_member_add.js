/* Copyright © Inertia Lighting | All Rights Reserved */

//---------------------------------------------------------------------------------------------------------------//

'use strict';

//---------------------------------------------------------------------------------------------------------------//

const { welcomeMessageHandler } = require('../handlers/welcome_message_handler.js');
const { illegalNicknameHandler } = require('../handlers/illegal_nickname_handler.js');

//---------------------------------------------------------------------------------------------------------------//

const new_to_the_server_role_ids = process.env.BOT_NEW_TO_THE_SERVER_AUTO_ROLE_IDS.split(',');

//---------------------------------------------------------------------------------------------------------------//

module.exports = {
    name: 'guildMemberAdd',
    async handler(member) {
        if (member.user.system) return; // don't operate on system accounts
        if (member.user.bot) return; // don't operate on bots to prevent feedback-loops

        try {
            await member.fetch(true);
        } catch (error) {
            console.trace('Failed to fetch member:', error);
            return;
        }

        /* give new-to-the-server roles to the member */
        try {
            await member.roles.add(new_to_the_server_role_ids);
        } catch (error) {
            console.trace('Failed to give new-to-the-server roles to the member:', error);
        }

        /* send the welcome message to the member */
        await welcomeMessageHandler(member).catch(console.trace);

        /* handle nicknames for new members */
        await illegalNicknameHandler(member).catch(console.trace);
    },
};
