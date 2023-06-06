//------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
//------------------------------------------------------------//

import * as Discord from 'discord.js';

import { DbBlacklistedUserRecord, DbUserData } from '@root/types/types';

import { getMarkdownFriendlyTimestamp } from '@root/utilities';

import { go_mongo_db } from '@root/mongo/mongo';

import { CustomEmbed } from '@root/bot/common/message';

import { CustomInteraction, CustomInteractionAccessLevel, CustomInteractionRunContext } from '@root/bot/common/managers/custom_interactions_manager';

//------------------------------------------------------------//

const db_database_name = `${process.env.MONGO_DATABASE_NAME ?? ''}`;
if (db_database_name.length < 1) throw new Error('Environment variable: MONGO_DATABASE_NAME; is not set correctly.');

const db_users_collection_name = `${process.env.MONGO_USERS_COLLECTION_NAME ?? ''}`;
if (db_users_collection_name.length < 1) throw new Error('Environment variable: MONGO_USERS_COLLECTION_NAME; is not set correctly.');

const db_blacklisted_users_collection_name = `${process.env.MONGO_BLACKLISTED_USERS_COLLECTION_NAME ?? ''}`;
if (db_blacklisted_users_collection_name.length < 1) throw new Error('Environment variable: MONGO_BLACKLISTED_USERS_COLLECTION_NAME; is not set correctly.');

//------------------------------------------------------------//

/**
 * Fetches a user in the users database
 */
async function findUserInUsersDatabase(
    user_lookup_type: 'discord' | 'roblox',
    user_lookup_query: string,
): Promise<Omit<DbUserData, '_id'> | undefined> {
    if (typeof user_lookup_query !== 'string') throw new TypeError('\`user_lookup_query\` must be a string');

    const find_query = {
        ...(user_lookup_type === 'discord' ? {
            'identity.discord_user_id': user_lookup_query,
        } : {
            'identity.roblox_user_id': user_lookup_query,
        }),
    };

    const [ db_user_data ] = await go_mongo_db.find(db_database_name, db_users_collection_name, find_query, {
        projection: {
            '_id': false,
        },
    }) as unknown as Omit<DbUserData, '_id'>[];

    return db_user_data;
}

/**
 * Fetches a user in the blacklisted-users database
 */
async function findUserInBlacklistedUsersDatabase(
    user_lookup_type: 'discord' | 'roblox',
    user_lookup_query: string,
): Promise<Omit<DbBlacklistedUserRecord, '_id'> | undefined> {
    if (typeof user_lookup_query !== 'string') throw new TypeError('\`user_lookup_query\` must be a string');

    const find_query = {
        ...(user_lookup_type === 'discord' ? {
            'identity.discord_user_id': user_lookup_query,
        } : {
            'identity.roblox_user_id': user_lookup_query,
        }),
    };

    const [ db_blacklisted_user_data ] = await go_mongo_db.find(db_database_name, db_blacklisted_users_collection_name, find_query, {
        projection: {
            '_id': false,
        },
    }) as unknown as Omit<DbBlacklistedUserRecord, '_id'>[];

    return db_blacklisted_user_data;
}

/**
 * Adds a user to the blacklisted-users database
 */
async function addUserToBlacklistedUsersDatabase(
    identity: {
        discord_user_id: string,
        roblox_user_id: string,
    },
    { epoch, reason, staff_member_id }: {
        epoch: number,
        reason: string,
        staff_member_id: string,
    },
): Promise<boolean> {
    if (typeof identity.discord_user_id !== 'string') throw new TypeError('\`identity.discord_user_id\` must be a string');
    if (typeof identity.roblox_user_id !== 'string') throw new TypeError('\`identity.roblox_user_id\` must be a string');
    if (typeof epoch !== 'number') throw new TypeError('\`epoch\` must be a number');
    if (typeof reason !== 'string') throw new TypeError('\`reason\` must be a string');
    if (typeof staff_member_id !== 'string') throw new TypeError('\`staff_member_id\` must be a string');

    const user_blacklist_data: Omit<DbBlacklistedUserRecord, '_id'> = {
        'identity': identity,
        'epoch': epoch,
        'reason': reason,
        'staff_member_id': staff_member_id,
    };

    try {
        await go_mongo_db.add(db_database_name, db_blacklisted_users_collection_name, [ user_blacklist_data ]);
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
    identity: {
        discord_user_id: string,
        roblox_user_id: string,
    },
): Promise<boolean> {
    if (typeof identity.discord_user_id !== 'string') throw new TypeError('\`identity.discord_user_id\` must be a string');
    if (typeof identity.roblox_user_id !== 'string') throw new TypeError('\`identity.roblox_user_id\` must be a string');

    try {
        await go_mongo_db.remove(db_database_name, db_blacklisted_users_collection_name, {
            'identity': identity,
        });
    } catch (error) {
        console.trace(error);
        return false; // user was not removed from blacklist
    }

    return true; // user was removed from blacklist
}

//------------------------------------------------------------//

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

async function blacklistAddSubcommand(
    interaction: Discord.CommandInteraction,
    user_id_to_add: Discord.Snowflake,
    reason: string,
): Promise<void> {
    if (!interaction.inCachedGuild()) return; // if the interaction did not originate from a cached guild, ignore it

    const db_user_data = await findUserInUsersDatabase('discord', user_id_to_add);
    if (!db_user_data) {
        /** @todo make this look nicer */
        await interaction.editReply({
            content: 'That discord user is not in the database, so they cannot be added to the blacklist.',
        });

        return;
    }

    const is_staff_member_allowed_to_blacklist_user = await isStaffMemberAllowedToBlacklistUser(interaction.guild, interaction.user.id, user_id_to_add);
    if (!is_staff_member_allowed_to_blacklist_user) {
        /** @todo make this look nicer */
        await interaction.editReply({
            content: 'You are not allowed to blacklist that user.',
        });

        return;
    }

    const is_user_already_blacklisted = await findUserInBlacklistedUsersDatabase('discord', user_id_to_add);
    if (is_user_already_blacklisted) {
        /** @todo make this look nicer */
        await interaction.editReply({
            content: 'That user is already blacklisted.',
        });

        return;
    }

    const was_user_added_to_blacklist = await addUserToBlacklistedUsersDatabase(db_user_data.identity, {
        epoch: Date.now(),
        reason: reason,
        staff_member_id: interaction.user.id,
    });

    if (!was_user_added_to_blacklist) {
        /** @todo make this look nicer */
        await interaction.editReply({
            content: 'An error was encountered while trying to blacklist that user.',
        });

        return;
    }

    /** @todo make this look nicer */
    await interaction.editReply({
        embeds: [
            CustomEmbed.from({
                title: 'Added User to Blacklist',
                description: [
                    `Discord User: \`${db_user_data.identity.discord_user_id}\`; was added to the blacklist by <@${interaction.user.id}>.`,
                ].join('\n'),
            }),
        ],
    });
}

async function blacklistRemoveSubcommand(
    interaction: Discord.CommandInteraction,
    user_id_to_remove: Discord.Snowflake,
    reason: string,
): Promise<void> {
    if (!interaction.inCachedGuild()) return; // if the interaction did not originate from a cached guild, ignore it

    const db_user_data = await findUserInUsersDatabase('discord', user_id_to_remove);
    if (!db_user_data) {
        /** @todo make this look nicer */
        await interaction.editReply({
            content: 'That discord user is not in the database, so they cannot be removed from the blacklist.',
        });

        return;
    }

    const is_staff_member_allowed_to_blacklist_user = await isStaffMemberAllowedToBlacklistUser(interaction.guild, interaction.user.id, user_id_to_remove);
    if (!is_staff_member_allowed_to_blacklist_user) {
        /** @todo make this look nicer */
        await interaction.editReply({
            content: 'You are not allowed to remove that user from the blacklist.',
        });

        return;
    }

    const is_user_already_blacklisted = await findUserInBlacklistedUsersDatabase('discord', user_id_to_remove);
    if (!is_user_already_blacklisted) {
        /** @todo make this look nicer */
        await interaction.editReply({
            content: 'That user is not blacklisted, so they cannot be removed from the blacklist.',
        });

        return;
    }

    const was_user_removed_from_blacklist = await removeUserFromBlacklistedUsersDatabase(db_user_data.identity);
    if (!was_user_removed_from_blacklist) {
        /** @todo make this look nicer */
        await interaction.editReply({
            content: 'An error was encountered while trying to remove that user from the blacklist.',
        });

        return;
    }

    await interaction.editReply({
        embeds: [
            CustomEmbed.from({
                title: 'Removed User From Blacklist',
                description: [
                    `Discord User: \`${db_user_data.identity.discord_user_id}\`; was removed from the blacklist by <@${interaction.user.id}>.`,
                ].join('\n'),
            }),
        ],
    });
}

async function blacklistLookupSubcommand(
    interaction: Discord.CommandInteraction,
    user_id_type: 'discord' | 'roblox',
    user_id: string,
): Promise<void> {
    if (!interaction.inCachedGuild()) return; // if the interaction did not originate from a cached guild, ignore it

    const db_user_blacklist_data = await findUserInBlacklistedUsersDatabase(user_id_type, user_id);
    if (!db_user_blacklist_data) {
        await interaction.editReply({
            content: 'That user is not blacklisted.',
        });

        return;
    }

    const discord_friendly_timestamp = getMarkdownFriendlyTimestamp(db_user_blacklist_data.epoch);

    await interaction.editReply({
        embeds: [
            CustomEmbed.from({
                title: 'Blacklist Lookup',
                description: [
                    `**Discord:** \`${db_user_blacklist_data.identity.discord_user_id}\``,
                    `**Roblox:** \`${db_user_blacklist_data.identity.roblox_user_id}\``,
                    `**Staff Member:** \`${db_user_blacklist_data.staff_member_id}\``,
                    `**Epoch:** <t:${discord_friendly_timestamp}:R>`,
                    '**Reason:**',
                    '\`\`\`',
                    db_user_blacklist_data.reason,
                    '\`\`\`',
                ].join('\n'),
            }),
        ],
    });
}

//------------------------------------------------------------//

export default new CustomInteraction({
    identifier: 'blacklist',
    type: Discord.InteractionType.ApplicationCommand,
    data: {
        type: Discord.ApplicationCommandType.ChatInput,
        description: 'Blacklists a user from being able to use products.',
        options: [
            {
                name: 'add',
                description: 'Add a user to the blacklist.',
                type: Discord.ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        name: 'user',
                        type: Discord.ApplicationCommandOptionType.User,
                        description: 'Who is getting blacklisted?',
                        required: true,
                    }, {
                        name: 'reason',
                        type: Discord.ApplicationCommandOptionType.String,
                        description: 'Why are they getting blacklisted',
                        minLength: 1,
                        maxLength: 256,
                        required: true,
                    },
                ],
            }, {
                name: 'remove',
                description: 'Remove a user from the blacklist.',
                type: Discord.ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        name: 'user',
                        type: Discord.ApplicationCommandOptionType.User,
                        description: 'Who is getting removed from the blacklist?',
                        required: true,
                    }, {
                        name: 'reason',
                        type: Discord.ApplicationCommandOptionType.String,
                        description: 'Why are they getting removed from the blacklist?',
                        minLength: 1,
                        maxLength: 256,
                        required: true,
                    },
                ],
            }, {
                name: 'lookup',
                description: 'Lookup a user to see if they are blacklisted.',
                type: Discord.ApplicationCommandOptionType.SubcommandGroup,
                options: [
                    {
                        name: 'discord',
                        type: Discord.ApplicationCommandOptionType.Subcommand,
                        description: 'Lookup a Discord user.',
                        options: [
                            {
                                name: 'user',
                                type: Discord.ApplicationCommandOptionType.User,
                                description: 'Who are you looking up?',
                                required: true,
                            },
                        ],
                    }, {
                        name: 'roblox',
                        type: Discord.ApplicationCommandOptionType.Subcommand,
                        description: 'Lookup a Roblox user id.',
                        options: [
                            {
                                name: 'user-id',
                                type: Discord.ApplicationCommandOptionType.String,
                                description: 'Who are you looking up?',
                                required: true,
                            },
                        ],
                    },
                ],
            },
        ],
    },
    metadata: {
        required_run_context: CustomInteractionRunContext.Guild,
        required_access_level: CustomInteractionAccessLevel.TeamLeaders,
    },
    handler: async (discord_client, interaction) => {
        if (!interaction.isChatInputCommand()) return;
        if (!interaction.inCachedGuild()) return;
        if (!interaction.channel) return;

        await interaction.deferReply({ ephemeral: false });

        const sub_command_name = interaction.options.getSubcommand(true);
        const sub_command_group_name = interaction.options.getSubcommandGroup(false);

        /**
         * The nullish coalescing operator (`??`) is used here because sub command groups can be siblings with sub commands.
         * This will allow us to grab the first nested command whether it is a sub command or a sub command group.
         */
        switch (sub_command_group_name ?? sub_command_name) {
            case 'add': {
                /* `/blacklist add` */

                const user_to_add = interaction.options.getUser('user', true);
                const reason = interaction.options.getString('reason', true);

                await blacklistAddSubcommand(interaction, user_to_add.id, reason);

                break;
            }

            case 'remove': {
                /* `/blacklist remove` */

                const user_id_to_remove = interaction.options.getUser('user', true).id;
                const reason = interaction.options.getString('reason', true);

                await blacklistRemoveSubcommand(interaction, user_id_to_remove, reason);

                break;
            }

            case 'lookup': {
                /* `/blacklist lookup` */

                switch (sub_command_name) {
                    case 'discord': {
                        /* `/blacklist lookup discord` */

                        const user_to_lookup = interaction.options.getUser('user', true);

                        await blacklistLookupSubcommand(interaction, 'discord', user_to_lookup.id);

                        break;
                    }

                    case 'roblox': {
                        /* `/blacklist lookup roblox` */

                        const user_id_to_lookup = interaction.options.getString('user-id', true);

                        await blacklistLookupSubcommand(interaction, 'roblox', user_id_to_lookup);

                        break;
                    }

                    default: {
                        await interaction.editReply({
                            content: 'Unrecognized subcommand was provided for the `/blacklist lookup` subcommand group.',
                        });

                        break;
                    }
                }

                break;
            }

            default: {
                await interaction.editReply({
                    content: 'Unrecognized subcommand was provided for the `/blacklist` command.',
                });

                break;
            }
        }
    },
});
