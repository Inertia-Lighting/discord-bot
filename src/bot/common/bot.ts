//------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
//------------------------------------------------------------//

//---------------------------------------------------------------------------------------------------------------//

import * as Discord from 'discord.js';

import { CustomEmbed } from './message';

//---------------------------------------------------------------------------------------------------------------//

const guild_staff_role_id = process.env.BOT_STAFF_ROLE_ID as string;
const guild_moderator_role_id = process.env.BOT_MODERATOR_ROLE_ID as string;
const guild_admin_role_id = process.env.BOT_ADMIN_ROLE_ID as string;
const guild_team_leaders_role_id = process.env.BOT_TEAM_LEADERS_ROLE_ID as string;
const guild_directors_role_id = process.env.BOT_DIRECTORS_ROLE_ID as string;
const guild_founders_role_id = process.env.BOT_FOUNDERS_ROLE_ID as string;

//---------------------------------------------------------------------------------------------------------------//

const user_is_not_allowed_access_to_command_message_options = {
    embeds: [
        CustomEmbed.from({
            color: CustomEmbed.colors.MAGENTA,
            title: 'Nice try, this command is protected!',
            description: 'You aren\'t allowed to use this command!',
        }),
    ],
};

//---------------------------------------------------------------------------------------------------------------//

const command_permission_levels = {
    PUBLIC: 1,
    STAFF: 2,
    MODERATORS: 3,
    ADMINS: 4,
    TEAM_LEADERS: 5,
    DIRECTORS: 6,
    FOUNDERS: 7,
};

//---------------------------------------------------------------------------------------------------------------//

function getUserPermissionLevel(
    guild_member: Discord.GuildMember
) {
    let user_permission_level = command_permission_levels.PUBLIC;

    if (guild_member.roles.cache.has(guild_staff_role_id)) {
        user_permission_level = command_permission_levels.STAFF;
    }

    if (guild_member.roles.cache.has(guild_moderator_role_id)) {
        user_permission_level = command_permission_levels.MODERATORS;
    }

    if (guild_member.roles.cache.has(guild_admin_role_id)) {
        user_permission_level = command_permission_levels.ADMINS;
    }

    if (guild_member.roles.cache.has(guild_team_leaders_role_id)) {
        user_permission_level = command_permission_levels.TEAM_LEADERS;
    }

    if (guild_member.roles.cache.has(guild_directors_role_id)) {
        user_permission_level = command_permission_levels.DIRECTORS;
    }

    if (guild_member.roles.cache.has(guild_founders_role_id)) {
        user_permission_level = command_permission_levels.FOUNDERS;
    }

    return user_permission_level;
}

//---------------------------------------------------------------------------------------------------------------//

export {
    user_is_not_allowed_access_to_command_message_options,
    command_permission_levels,
    getUserPermissionLevel,
};
