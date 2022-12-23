//------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
//------------------------------------------------------------//

//---------------------------------------------------------------------------------------------------------------//

import moment from 'moment-timezone';

import { go_mongo_db } from '../../mongo/mongo';

import { Discord, client } from '../discord_client';

import { command_permission_levels } from '../common/bot';

import { CustomEmbed } from '../common/message';

//---------------------------------------------------------------------------------------------------------------//

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

//---------------------------------------------------------------------------------------------------------------//

export default {
    name: 'blacklist',
    description: 'blacklists a specified user in the database',
    aliases: ['blacklist'],
    permission_level: command_permission_levels.ADMINS,
    cooldown: 1_500,
    async execute(
        message: Discord.Message<true>,
        args: {
            [key: string]: unknown;
            command_args: string[],
        },
    ) {
        const { command_prefix, command_name, command_args } = args;

        const sub_command_name = (command_args[0] ?? '').toLowerCase();
        const sub_command_args = command_args.slice(1);

        switch (sub_command_name) {
            case 'add': {
                const db_user_lookup_query = (sub_command_args[0] ?? '').replace(/\D/gi, '').trim();

                if (!db_user_lookup_query) {
                    await message.reply({
                        content: 'You need to specify a discord_user_id or roblox_user_id when using this command!',
                    }).catch(console.warn);
                    return;
                }

                const db_user_data_for_case_add = await findUserInUsersDatabase(db_user_lookup_query);

                if (!db_user_data_for_case_add) {
                    await message.reply({
                        content: 'You can only blacklist users that are verified in the product hub!',
                    }).catch(console.warn);
                    return;
                }

                const staff_member_id = message.author.id;

                const staff_member_can_add_user_to_blacklist = await isStaffMemberAllowedToBlacklistUser(message.guild, staff_member_id, db_user_data_for_case_add.identity.discord_user_id);
                if (!staff_member_can_add_user_to_blacklist) {
                    await message.reply({
                        content: 'You aren\'t allowed to blacklist that user!',
                    }).catch(console.warn);
                    return;
                }

                const added_successfully = await addUserToBlacklistedUsersDatabase(db_user_data_for_case_add.identity, {
                    epoch: Date.now(),
                    reason: sub_command_args.slice(1).join(' ').trim() || 'no reason was specified',
                    staff_member_id: staff_member_id,
                });
                if (!added_successfully) {
                    await message.reply({
                        content: 'I was unable to add that user to the blacklist!\nDid you specify them after the command?',
                    }).catch(console.warn);
                    return;
                }

                await message.reply({
                    content: `I added <@${db_user_data_for_case_add.identity.discord_user_id}> to the blacklist!`,
                }).catch(console.warn);

                break;
            }
            case 'remove': {
                const db_user_lookup_query = (sub_command_args[0] ?? '').replace(/\D/gi, '').trim();

                if (!db_user_lookup_query) {
                    await message.reply({
                        content: 'You need to specify a @mention or roblox_user_id when using this command!',
                    }).catch(console.warn);
                    return;
                }

                const db_user_data_for_case_remove = await findUserInUsersDatabase(db_user_lookup_query);

                if (!db_user_data_for_case_remove) {
                    await message.reply({
                        content: 'You can only un-blacklist users that are verified in the product hub!',
                    }).catch(console.warn);
                    return;
                }

                const staff_member_id = message.author.id;

                const staff_member_can_remove_user_from_blacklist = await isStaffMemberAllowedToBlacklistUser(message.guild, staff_member_id, db_user_data_for_case_remove.identity.discord_user_id);
                if (!staff_member_can_remove_user_from_blacklist) {
                    await message.reply({
                        content: 'You aren\'t allowed to un-blacklist that user!',
                    }).catch(console.warn);
                    return;
                }

                const removed_successfully = await removeUserFromBlacklistedUsersDatabase(db_user_data_for_case_remove.identity);
                if (!removed_successfully) {
                    await message.reply({
                        content: 'I was unable to remove that user from the blacklist!\nDid you specify them after the command?',
                    }).catch(console.warn);
                    return;
                }

                await message.reply({
                    content: `I removed <@${db_user_data_for_case_remove.identity.discord_user_id}> from the blacklist!`,
                }).catch(console.warn);

                break;
            }
            case 'lookup': {
                const db_user_lookup_query = (sub_command_args[0] ?? '').replace(/\D/gi, '').trim();

                if (!db_user_lookup_query) {
                    await message.reply({
                        content: 'You need to specify a @mention or roblox_user_id when using this command!',
                    }).catch(console.warn);
                    return;
                }

                const db_blacklisted_user_data = await findUserInBlacklistedUsersDatabase(db_user_lookup_query);

                await message.channel.send({
                    embeds: [
                        CustomEmbed.from({
                            author: {
                                icon_url: `${client.user!.displayAvatarURL({ forceStatic: false })}`,
                                name: 'Inertia Lighting | Blacklisted User Document',
                            },
                            description: (db_blacklisted_user_data ? [
                                `**User:** <@${db_blacklisted_user_data.identity.discord_user_id}>`,
                                `**Roblox Id:** \`${db_blacklisted_user_data.identity.roblox_user_id}\``,
                                `**Staff:** <@${db_blacklisted_user_data.staff_member_id}>`,
                                `**Date:** \`${moment(db_blacklisted_user_data.epoch).tz('America/New_York').format('YYYY[-]MM[-]DD | hh:mm A | [GMT]ZZ')}\``,
                                `**Reason:** ${'```'}\n${db_blacklisted_user_data.reason}\n${'```'}`,
                            ].join('\n') : `${'```'}\nUser is not blacklisted!\n${'```'}`),
                        }),
                    ],
                }).catch(console.warn);

                break;
            }
            default: {
                await message.reply({
                    embeds: [
                        CustomEmbed.from({
                            author: {
                                icon_url: `${client.user!.displayAvatarURL({ forceStatic: false })}`,
                                name: 'Inertia Lighting | Blacklist System',
                            },
                            description: [
                                'Please use one of the following sub-commands:',
                                '\`\`\`',
                                ...[
                                    'add <discord_user_id | roblox_user_id> [reason]',
                                    'remove <discord_user_id | roblox_user_id>',
                                    'lookup <discord_user_id | roblox_user_id>',
                                ].map(sub_command => `${command_prefix}${command_name} ${sub_command}`),
                                '\`\`\`',
                            ].join('\n'),
                        }),
                    ],
                }).catch(console.warn);

                break;
            }
        }
    },
};
