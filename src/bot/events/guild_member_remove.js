/* Copyright © Inertia Lighting | All Rights Reserved */

//---------------------------------------------------------------------------------------------------------------//

'use strict';

//---------------------------------------------------------------------------------------------------------------//

const { guildMemberRemoveLogger } = require('../handlers/logs/guild_member_retention.js');

//---------------------------------------------------------------------------------------------------------------//

module.exports = {
    name: 'guildMemberRemove',
    async handler(member) {
        if (member.user.system) return; // don't operate on system accounts
        if (member.user.bot) return; // don't operate on bots to prevent feedback-loops

        /* log the member joining */
        await guildMemberRemoveLogger(member).catch(console.trace);
    },
};
