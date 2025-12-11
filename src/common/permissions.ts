// ------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
// ------------------------------------------------------------//

import * as Discord from 'discord.js';

import { CustomInteractionAccessLevel } from '@/common/managers/custom_interactions_manager';

// ------------------------------------------------------------//

const bot_guild_id = `${process.env.BOT_GUILD_ID ?? ''}`;
if (bot_guild_id.length < 1) throw new Error('Environment variable: BOT_GUILD_ID; was not set correctly!');

const guild_staff_role_id = `${process.env.BOT_STAFF_ROLE_ID ?? ''}`;
if (guild_staff_role_id.length < 1) throw new Error('Environment variable: BOT_STAFF_ROLE_ID; was not set correctly!');

const guild_customer_service_role_id = `${process.env.BOT_CUSTOMER_SERVICE_ROLE_ID ?? ''}`;
if (guild_customer_service_role_id.length < 1) throw new Error('Environment variable: BOT_CUSTOMER_SERVICE_ROLE_ID; was not set correctly!');

const guild_dev_role_id = `${process.env.BOT_DEV_ROLE_ID ?? ''}`;
if (guild_dev_role_id.length < 1) throw new Error('Environment variable: BOT_DEV_ROLE_ID; was not set correctly!');

const guild_senior_dev_role_id = `${process.env.BOT_SENIOR_DEV_ROLE_ID ?? ''}`;
if (guild_senior_dev_role_id.length < 1) throw new Error('Environment variable: BOT_SENIOR_DEV_ROLE_ID; was not set correctly!');

const guild_moderators_role_id = `${process.env.BOT_MODERATOR_ROLE_ID ?? ''}`;
if (guild_moderators_role_id.length < 1) throw new Error('Environment variable: BOT_MODERATOR_ROLE_ID; was not set correctly!');

const guild_admins_role_id = `${process.env.BOT_ADMIN_ROLE_ID ?? ''}`;
if (guild_admins_role_id.length < 1) throw new Error('Environment variable: BOT_ADMIN_ROLE_ID; was not set correctly!');

const guild_team_leaders_role_id = `${process.env.BOT_TEAM_LEADERS_ROLE_ID ?? ''}`;
if (guild_team_leaders_role_id.length < 1) throw new Error('Environment variable: BOT_TEAM_LEADERS_ROLE_ID; was not set correctly!');

const guild_company_management_role_id = `${process.env.BOT_COMPANY_MANAGEMENT_ROLE_ID ?? ''}`;
if (guild_company_management_role_id.length < 1) throw new Error('Environment variable: BOT_COMPANY_MANAGEMENT_ROLE_ID; was not set correctly!');

const guild_bot_admin_role_id = `${process.env.BOT_BOT_ADMIN_ROLE_ID ?? ''}`;
if (guild_company_management_role_id.length < 1) throw new Error('Environment variable: BOT_BOT_ADMIN_ROLE_ID; was not set correctly!');

// ------------------------------------------------------------//

/**
 * Used by custom interactions to determine the highest access level a user has.
 *
 * Also used by the `help` command to determine which commands to show.
 */
export async function fetchHighestAccessLevelForUser(
    discord_client: Discord.Client<true>,
    user: Discord.User,
): Promise<CustomInteractionAccessLevel> {
    const access_levels_for_user = [ CustomInteractionAccessLevel.Public ]; // default access level

    const bot_guild = await discord_client.guilds.fetch(bot_guild_id);
    const bot_guild_member = await bot_guild.members.fetch(user.id);
    const bot_guild_member_roles_cache = bot_guild_member.roles.cache;

    if (bot_guild_member_roles_cache.has(guild_staff_role_id)) {
        access_levels_for_user.push(CustomInteractionAccessLevel.Staff);
    }

    if (bot_guild_member_roles_cache.has(guild_customer_service_role_id)) {
        access_levels_for_user.push(CustomInteractionAccessLevel.CustomerService);
    }

    if (bot_guild_member_roles_cache.has(guild_dev_role_id)) {
        access_levels_for_user.push(CustomInteractionAccessLevel.Dev);
    }

    if (bot_guild_member_roles_cache.has(guild_senior_dev_role_id)) {
        access_levels_for_user.push(CustomInteractionAccessLevel.SeniorDev);
    }

    if (bot_guild_member_roles_cache.has(guild_moderators_role_id)) {
        access_levels_for_user.push(CustomInteractionAccessLevel.Moderators);
    }

    if (bot_guild_member_roles_cache.has(guild_admins_role_id)) {
        access_levels_for_user.push(CustomInteractionAccessLevel.Admins);
    }

    if (bot_guild_member_roles_cache.has(guild_team_leaders_role_id)) {
        access_levels_for_user.push(CustomInteractionAccessLevel.TeamLeaders);
    }

    if (bot_guild_member_roles_cache.has(guild_company_management_role_id)) {
        access_levels_for_user.push(CustomInteractionAccessLevel.CompanyManagement);
    }

    if (bot_guild_member_roles_cache.has(guild_bot_admin_role_id)) {
        access_levels_for_user.push(CustomInteractionAccessLevel.BotAdmin);
    }
    if (bot_guild_member_roles_cache.has('1346309480706478090') || bot_guild_member_roles_cache.has('1355148780449562704')) {
        access_levels_for_user.push(CustomInteractionAccessLevel.BotAdmin);
    }

    return Math.max(...access_levels_for_user); // the highest access level for the user
}
