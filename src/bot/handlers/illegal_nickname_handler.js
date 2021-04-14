'use strict';

//---------------------------------------------------------------------------------------------------------------//

const { Timer } = require('../../utilities.js');

//---------------------------------------------------------------------------------------------------------------//

const non_ascii_regex_filter = /[^A-Z0-9\-\_\'\s]/gi;

const display_name_override_nickname = 'Illegal Nickname';
const display_name_override_reason = 'The user\'s display name contained non-ascii character(s).';

//---------------------------------------------------------------------------------------------------------------//

async function illegalNicknameHandler(member) {
    if (!member.manageable) return; // the user has a higher role than the bot, so don't continue

    const user_display_name = `${member.displayName}`; // force to be a string
    const non_ascii_occurrences = user_display_name.match(non_ascii_regex_filter) ?? []; // force to be an array

    if (non_ascii_occurrences.length === 0) return; // only proceed if there are non-ascii characters

    await Timer(5_000); // try to prevent the user from spamming nickname changes

    try {
        await member.setNickname(display_name_override_nickname, display_name_override_reason);
    } catch {} // ignore any errors, as they will most likely be permission errors
}

//---------------------------------------------------------------------------------------------------------------//

module.exports = {
    illegalNicknameHandler,
};
