"use strict";
/* Copyright © Inertia Lighting | All Rights Reserved */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserPermissionLevel = exports.command_permission_levels = exports.user_is_not_allowed_access_to_command_message_options = void 0;
//---------------------------------------------------------------------------------------------------------------//
const Discord = __importStar(require("discord.js"));
//---------------------------------------------------------------------------------------------------------------//
const guild_staff_role_id = process.env.BOT_STAFF_ROLE_ID;
const guild_moderator_role_id = process.env.BOT_MODERATOR_ROLE_ID;
const guild_admin_role_id = process.env.BOT_ADMIN_ROLE_ID;
const guild_team_leaders_role_id = process.env.BOT_TEAM_LEADERS_ROLE_ID;
const guild_directors_role_id = process.env.BOT_DIRECTORS_ROLE_ID;
const guild_founders_role_id = process.env.BOT_FOUNDERS_ROLE_ID;
//---------------------------------------------------------------------------------------------------------------//
const user_is_not_allowed_access_to_command_message_options = {
    embeds: [
        new Discord.MessageEmbed({
            color: 0xFF00FF,
            title: 'Nice try, this command is protected!',
            description: 'You aren\'t allowed to use this command!',
        }),
    ],
};
exports.user_is_not_allowed_access_to_command_message_options = user_is_not_allowed_access_to_command_message_options;
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
exports.command_permission_levels = command_permission_levels;
//---------------------------------------------------------------------------------------------------------------//
function getUserPermissionLevel(guild_member) {
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
exports.getUserPermissionLevel = getUserPermissionLevel;
//# sourceMappingURL=bot.js.map