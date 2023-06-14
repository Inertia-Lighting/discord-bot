//------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
//------------------------------------------------------------//

import * as Discord from 'discord.js';

import { delay } from '@root/utilities';

//------------------------------------------------------------//

const non_allowed_regex_filter = /[^\w\d]|_/gi;

const display_name_override_nickname = 'Illegal Nickname';
const display_name_override_reason = 'The user\'s display name contained too many non-allowed characters.';

//------------------------------------------------------------//

export async function illegalNicknameHandler(member: Discord.GuildMember) {
    if (member.user.bot) return;
    if (member.user.system) return;
    if (!member.manageable) return; // the user has a higher role than the bot, so don't continue

    const user_display_name = `${member.displayName}`; // force to be a string
    const non_allowed_occurrences = user_display_name.match(non_allowed_regex_filter) ?? []; // force to be an array

    const non_allowed_occurrences_threshold = user_display_name.length / 3; // 1/3rd of the display name
    const non_allowed_occurrences_threshold_exceeded = non_allowed_occurrences.length > non_allowed_occurrences_threshold;

    if (!non_allowed_occurrences_threshold_exceeded) return; // only proceed if the non-allowed character threshold is exceeded

    await delay(5_000); // try to prevent the user from spamming nickname changes

    try {
        await member.setNickname(display_name_override_nickname, display_name_override_reason);
    } catch {} // ignore any errors, as they will most likely be related to missing permissions
}
