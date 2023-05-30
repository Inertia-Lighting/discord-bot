//------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
//------------------------------------------------------------//

import * as Discord from 'discord.js';

import { go_mongo_db } from '@root/mongo/mongo';

import { CustomInteraction, CustomInteractionAccessLevel } from '../common/managers/custom_interactions_manager';

//------------------------------------------------------------//

/**
 * Fetches a user in the users database
 */
async function findUserInUsersDatabase(user_lookup_query: string) {
    if (typeof user_lookup_query !== 'string') throw new TypeError('\`user_lookup_query\` must be a string');

    const [ db_user_data ] = await go_mongo_db.find(process.env.MONGO_DATABASE_NAME as string, process.env.MONGO_USERS_COLLECTION_NAME as string, {
        $or: [
            { 'identity.discord_user_id': user_lookup_query },
            { 'identity.roblox_user_id': user_lookup_query },
        ],
    }, {
        projection: {
            '_id': false,
        },
    }) as unknown as {
        identity: {
            discord_user_id: string,
            roblox_user_id: string,
        },
    }[];

    return db_user_data;
}

/**
 * Fetches a user in the blacklisted-users database
 */
 async function findUserInBlacklistedUsersDatabase(user_lookup_query: string) {
    if (typeof user_lookup_query !== 'string') throw new TypeError('\`user_lookup_query\` must be a string');

    const [ db_blacklisted_user_data ] = await go_mongo_db.find(process.env.MONGO_DATABASE_NAME as string, process.env.MONGO_BLACKLISTED_USERS_COLLECTION_NAME as string, {
        $or: [
            { 'identity.discord_user_id': user_lookup_query },
            { 'identity.roblox_user_id': user_lookup_query },
        ],
    }, {
        projection: {
            '_id': false,
        },
    }) as unknown as {
        identity: {
            discord_user_id: string,
            roblox_user_id: string,
        },
        staff_member_id: string,
        epoch: number,
        reason: string,
    }[];

    return db_blacklisted_user_data;
}

/**
 * Adds a user to the blacklisted-users database
 */
async function addUserToBlacklistedUsersDatabase(
    { discord_user_id, roblox_user_id }: {
        discord_user_id: string,
        roblox_user_id: string,
    },
    { epoch, reason, staff_member_id }: {
        epoch: number,
        reason: string,
        staff_member_id: string,
    },
): Promise<boolean> {
    if (typeof discord_user_id !== 'string') throw new TypeError('\`discord_user_id\` must be a string');
    if (typeof roblox_user_id !== 'string') throw new TypeError('\`roblox_user_id\` must be a string');
    if (typeof epoch !== 'number') throw new TypeError('\`epoch\` must be a number');
    if (typeof reason !== 'string') throw new TypeError('\`reason\` must be a string');
    if (typeof staff_member_id !== 'string') throw new TypeError('\`staff_member_id\` must be a string');

    try {
        await go_mongo_db.update(process.env.MONGO_DATABASE_NAME as string, process.env.MONGO_BLACKLISTED_USERS_COLLECTION_NAME as string, {
            'identity.discord_user_id': discord_user_id,
            'identity.roblox_user_id': roblox_user_id,
        }, {
            $set: {
                'epoch': epoch,
                'reason': reason,
                'staff_member_id': staff_member_id,
            },
        }, {
            upsert: true,
        });
    } catch (error) {
        console.trace(error);
        return false; // user was not added to blacklist
    }

    return true; // user was added to blacklist
}

/**
 * Removes a user from the blacklisted-users database
 */
async function removeUserFromBlacklistedUsersDatabase(
    { discord_user_id, roblox_user_id }: {
        discord_user_id: string,
        roblox_user_id: string,
    },
): Promise<boolean> {
    if (typeof discord_user_id !== 'string') throw new TypeError('\`discord_user_id\` must be a string');
    if (typeof roblox_user_id !== 'string') throw new TypeError('\`roblox_user_id\` must be a string');

    try {
        await go_mongo_db.remove(process.env.MONGO_DATABASE_NAME as string, process.env.MONGO_BLACKLISTED_USERS_COLLECTION_NAME as string, {
            'identity.discord_user_id': discord_user_id,
            'identity.roblox_user_id': roblox_user_id,
        });
    } catch (error) {
        console.trace(error);
        return false; // user was not removed from blacklist
    }

    return true; // user was removed from blacklist
}

//---------------------------------------------------------------------------------------------------------------//

/**
 * Check if the staff member is allowed to blacklist the potential user.
 */
async function isStaffMemberAllowedToBlacklistUser(
    guild: Discord.Guild,
    staff_member_id: string,
    discord_user_id: string,
): Promise<boolean> {
    if (!guild) throw new TypeError('\`guild\` was undefined');
    if (!staff_member_id) throw new TypeError('\`staff_member_id\` was undefined');
    if (!discord_user_id) throw new TypeError('\`user_id\` was undefined');

    /* don't let staff blacklist themselves */
    if (staff_member_id === discord_user_id) return false;

    /* check that the staff member exists in the guild */
    const staff_member = await guild.members.fetch(staff_member_id).catch(() => undefined);
    if (!staff_member) return false; // if the staff member somehow doesn't exist in the guild, don't allow them to blacklist users

    /* check if the user exists in the guild */
    const member_being_blacklisted = await guild.members.fetch(discord_user_id).catch(() => undefined);
    if (!member_being_blacklisted) return true; // assume that the user can be blacklisted since they don't exist in the guild

    /* check the role hierarchy since they exist in the guild */
    const staff_member_role_hierarchy_is_greater = staff_member.roles.highest.comparePositionTo(member_being_blacklisted.roles.highest) > 0;
    return staff_member_role_hierarchy_is_greater;
}

//------------------------------------------------------------//

export default new CustomInteraction({
    identifier: 'blacklist',
    type: Discord.InteractionType.ApplicationCommand,
    data: {
        type: Discord.ApplicationCommandType.ChatInput,
        description: 'Blacklists a specified user in the database',
        options: [
            {
                name: 'action',
                description: 'add, remove, lookup',
                type: Discord.ApplicationCommandOptionType.Subcommand,
            },
        ],
    },
    metadata: {
        required_access_level: CustomInteractionAccessLevel.Admins,
    },
    handler: async (discord_client, interaction) => {
        if (!interaction.isChatInputCommand()) return;
        if (!interaction.inCachedGuild()) return;
        if (!interaction.channel) return;

        await interaction.deferReply({ ephemeral: false });

        await interaction.editReply({
            content: `Pong: ${discord_client.ws.ping}`,
        });
    },
});
