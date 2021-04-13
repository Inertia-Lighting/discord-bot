'use strict';

//---------------------------------------------------------------------------------------------------------------//

const { Timer } = require('../../utilities.js');

//---------------------------------------------------------------------------------------------------------------//

const non_ascii_regex_filter = /[^A-Z0-9\-\_\'\s]/gi;

const display_name_override_nickname = 'Illegal Nickname';
const display_name_override_reason = 'The user\'s display name contained non-ascii character(s).';

//---------------------------------------------------------------------------------------------------------------//

module.exports = {
    name: 'guildMemberUpdate',
    async handler(old_member, new_member) {
        if (new_member.user.system) return; // don't operate on system accounts
        if (new_member.user.bot) return; // don't operate on bots to prevent feedback-loops

        /* user nickname validator */
        if (old_member.displayName !== new_member.displayName) {
            if (!new_member.manageable) return; // the user has a higher role than the bot, so don't continue

            const user_display_name = `${new_member.displayName}`; // force to be a string
            const non_ascii_occurrences = user_display_name.match(non_ascii_regex_filter) ?? []; // force to be an array

            if (non_ascii_occurrences.length === 0) return; // only proceed if there are non-ascii characters

            await Timer(10_000); // try to prevent the user from noticing the nickname change by delaying the change

            try {
                await new_member.setNickname(display_name_override_nickname, display_name_override_reason);
            } catch {} // ignore any errors, as they will most likely be permission errors
        }
    },
};
