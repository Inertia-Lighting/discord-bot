/* Copyright © Inertia Lighting | All Rights Reserved */

//---------------------------------------------------------------------------------------------------------------//

'use strict';

//---------------------------------------------------------------------------------------------------------------//

const { illegalNicknameHandler } = require('../handlers/illegal_nickname_handler.js');

//---------------------------------------------------------------------------------------------------------------//

module.exports = {
    name: 'guildMemberUpdate',
    async handler(old_member, new_member) {
        if (new_member.user.system) return; // don't operate on system accounts
        if (new_member.user.bot) return; // don't operate on bots to prevent feedback-loops

        /* user nickname validator */
        if (old_member.displayName !== new_member.displayName) {
            await illegalNicknameHandler(new_member);
        }
    },
};
