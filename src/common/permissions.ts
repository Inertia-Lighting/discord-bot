//------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
//------------------------------------------------------------//

import * as Discord from 'discord.js';

import { CustomInteractionAccessLevel } from './managers/custom_interactions_manager';
import { Interaction } from 'discord.js';

//------------------------------------------------------------//

const bot_guild_id = `${process.env.BOT_GUILD_ID ?? ''}`;
if (bot_guild_id.length < 1) throw new Error('Environment variable: BOT_GUILD_ID; was not set correctly!');

const guild_staff_role_id = `${process.env.BOT_STAFF_ROLE_ID ?? ''}`;
if (guild_staff_role_id.length < 1) throw new Error('Environment variable: BOT_STAFF_ROLE_ID; was not set correctly!');

const guild_customer_service_role_id = `${process.env.BOT_CUSTOMER_SERVICE_ROLE_ID ?? ''}`;
if (guild_customer_service_role_id.length < 1) throw new Error('Environment variable: BOT_CUSTOMER_SERVICE_ROLE_ID; was not set correctly!');

const guild_moderators_role_id = `${process.env.BOT_MODERATOR_ROLE_ID ?? ''}`;
if (guild_moderators_role_id.length < 1) throw new Error('Environment variable: BOT_MODERATOR_ROLE_ID; was not set correctly!');

const guild_admins_role_id = `${process.env.BOT_ADMIN_ROLE_ID ?? ''}`;
if (guild_admins_role_id.length < 1) throw new Error('Environment variable: BOT_ADMIN_ROLE_ID; was not set correctly!');

const guild_team_leaders_role_id = `${process.env.BOT_TEAM_LEADERS_ROLE_ID ?? ''}`;
if (guild_team_leaders_role_id.length < 1) throw new Error('Environment variable: BOT_TEAM_LEADERS_ROLE_ID; was not set correctly!');

const guild_company_management_role_id = `${process.env.BOT_COMPANY_MANAGEMENT_ROLE_ID ?? ''}`;
if (guild_company_management_role_id.length < 1) throw new Error('Environment variable: BOT_COMPANY_MANAGEMENT_ROLE_ID; was not set correctly!');

//------------------------------------------------------------//

export async function fetchHighestAccessLevelForUser(
    discord_client: Discord.Client<true>,
    user: Discord.User,
): Promise<CustomInteractionAccessLevel> {

    const access_levels_for_user = [ CustomInteractionAccessLevel.Public ]; // default access level

    const bot_guild = await discord_client.guilds.fetch(bot_guild_id);
    const bot_guild_member = await bot_guild.members.fetch(interaction.user.id);
    const bot_guild_member_roles_cache = bot_guild_member.roles.cache;

    if (member_roles_cache.has(guild_staff_role_id)) {
        access_levels_for_user.push(CustomInteractionAccessLevel.Staff);
    }

    if (member_roles_cache.has(guild_customer_service_role_id)) {
        access_levels_for_user.push(CustomInteractionAccessLevel.CustomerService);
    }

    if (member_roles_cache.has(guild_moderators_role_id)) {
        access_levels_for_user.push(CustomInteractionAccessLevel.Moderators);
    }

    if (member_roles_cache.has(guild_admins_role_id)) {
        access_levels_for_user.push(CustomInteractionAccessLevel.Admins);
    }

    if (member_roles_cache.has(guild_team_leaders_role_id)) {
        access_levels_for_user.push(CustomInteractionAccessLevel.TeamLeaders);
    }

    if (member_roles_cache.has(guild_company_management_role_id)) {
        access_levels_for_user.push(CustomInteractionAccessLevel.CompanyManagement);
    }

    return Math.max(...access_levels_for_user); // the highest access level for the user
}
