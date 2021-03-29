'use strict';

//---------------------------------------------------------------------------------------------------------------//

const moment = require('moment-timezone');

const { go_mongo_db } = require('../../mongo/mongo.js');

const { Discord, client } = require('../discord_client.js');

//---------------------------------------------------------------------------------------------------------------//

/**
 * Fetches a user in the users database
 * @param {String} discord_user_id
 * @param {String} roblox_user_id
 * @returns {Promise<any|undefined>} db_user_data
 */
async function findUserInUsersDatabase(discord_user_id=undefined, roblox_user_id=undefined) {
    const [ db_user_data ] = await go_mongo_db.find(process.env.MONGO_DATABASE_NAME, process.env.MONGO_USERS_COLLECTION_NAME, {
        ...(discord_user_id ? {
            'identity.discord_user_id': discord_user_id,
        } : {
            'identity.roblox_user_id': roblox_user_id,
        }),
    });
    return db_user_data;
}

/**
 * Adds a user to the blacklist
 * @param {*} db_user_data
 * @param {*} blacklist_metadata
 * @returns {Promise<boolean>} success or failure
 */
async function addUserToBlacklistedUsersDatabase({ identity: { discord_user_id, roblox_user_id } }, { epoch, reason, staff_member_id }) {
    if (discord_user_id && roblox_user_id) {
        await go_mongo_db.update(process.env.MONGO_DATABASE_NAME, process.env.MONGO_BLACKLISTED_USERS_COLLECTION_NAME, {
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
        await go_mongo_db.update(process.env.MONGO_DATABASE_NAME, process.env.MONGO_API_AUTH_USERS_COLLECTION_NAME, {
            'identity.discord_user_id': discord_user_id,
            'identity.roblox_user_id': roblox_user_id,
        }, {
            $set: {
                ['api_access.enabled']: false,
            },
        }, {
            upsert: true,
        });
        return true; // user was added to blacklist
    } else {
        return false; // user was not added to blacklist
    }
}

/**
 * Removes a user from the blacklist
 * @param {*} db_user_data
 * @returns {Promise<boolean>} success or failure
 */
async function removeUserFromBlacklistedUsersDatabase({ identity: { discord_user_id, roblox_user_id } }) {
    if (discord_user_id && roblox_user_id) {
        await go_mongo_db.remove(process.env.MONGO_DATABASE_NAME, process.env.MONGO_BLACKLISTED_USERS_COLLECTION_NAME, {
            'identity.discord_user_id': discord_user_id,
            'identity.roblox_user_id': roblox_user_id,
        });
        await go_mongo_db.update(process.env.MONGO_DATABASE_NAME, process.env.MONGO_API_AUTH_USERS_COLLECTION_NAME, {
            'identity.discord_user_id': discord_user_id,
            'identity.roblox_user_id': roblox_user_id,
        }, {
            $set: {
                ['api_access.enabled']: true,
            },
        }, {
            upsert: true,
        });
        return true; // user was removed from blacklist
    } else {
        return false; // user was not removed from blacklist
    }
}

/**
 * Looks up a user in the blacklist
 * @param {String} discord_user_id
 * @param {String} roblox_user_id
 * @returns {Promise<any>} blacklisted_user_db_data
 */
async function lookupUserInBlacklistedUsersDatabase(discord_user_id=undefined, roblox_user_id=undefined) {
    const [ blacklisted_user_db_data ] = await go_mongo_db.find(process.env.MONGO_DATABASE_NAME, process.env.MONGO_BLACKLISTED_USERS_COLLECTION_NAME, {
        ...(discord_user_id ? {
            'identity.discord_user_id': discord_user_id,
        } : {
            'identity.roblox_user_id': roblox_user_id,
        }),
    }, {
        projection: {
            '_id': false,
        },
    });
    return blacklisted_user_db_data;
}

//---------------------------------------------------------------------------------------------------------------//

/**
 * Check if the staff member is allowed to blacklist the potential user.
 * @param {Guild} guild
 * @param {String} staff_member_id
 * @param {String?} user_id
 */
async function checkIfStaffMemberIsAllowedToBlacklistUser(guild, staff_member_id, user_id) {
    if (!staff_member_id) throw new Error('\`staff_member_id\` was undefined!');

    if (!user_id) return false; // in the event that a user was not found in the users database, then they can't be blacklisted

    /* don't let staff blacklist themselves */
    if (staff_member_id === user_id) return false;

    /* check that the staff member exists in the guild */
    const staff_member = await guild.members.fetch(staff_member_id);
    if (!staff_member) return false;

    /* check if the member exists in the guild */
    const member_being_blacklisted = await guild.members.fetch(user_id);
    if (!member_being_blacklisted) return true; // no need to check role hierarchy if the user isn't in the guild

    /* check the role hierarchy since they exist in the guild */
    const staff_member_role_hierarchy_is_greater = staff_member.roles.highest.comparePositionTo(member_being_blacklisted.roles.highest) > 0;
    return staff_member_role_hierarchy_is_greater;
}

//---------------------------------------------------------------------------------------------------------------//

module.exports = {
    name: 'blacklist',
    description: 'blacklists a specified user in the database',
    aliases: ['blacklist'],
    permission_level: 'admin',
    async execute(message, args) {
        const { command_prefix, command_name, command_args } = args;

        const staff_member_id = message.author.id;

        const lookup_discord_user_id = message.mentions.members.first()?.id;
        const lookup_roblox_user_id = command_args[1];

        const db_user_data = (await findUserInUsersDatabase(lookup_discord_user_id, lookup_roblox_user_id)) ?? {}; // force the result to be an object

        switch (command_args[0]?.toLowerCase()) {
            case 'add':
                if (!db_user_data) {
                    message.reply('You can only blacklist users that have verified in the product hub!');
                    return;
                }

                const staff_member_can_add_user_to_blacklist = await checkIfStaffMemberIsAllowedToBlacklistUser(message.guild, staff_member_id, db_user_data?.identity?.discord_user_id);
                if (!staff_member_can_add_user_to_blacklist) {
                    message.reply('You aren\'t allowed to blacklist that user!');
                    return;
                }

                const added_successfully = await addUserToBlacklistedUsersDatabase(db_user_data, {
                    epoch: Date.now(),
                    reason: command_args.slice(2).join(' ').trim() || 'no reason was specified',
                    staff_member_id: staff_member_id,
                });
                if (added_successfully) {
                    message.reply('I added that user to the blacklist!');
                } else {
                    message.reply('I was unable to add that user to the blacklist!\nDid you specify them after the command?');
                }

                break;
            case 'remove':
                if (!db_user_data) {
                    message.reply('You can only un-blacklist users that have verified in the product hub!');
                    return;
                }

                const staff_member_can_remove_user_from_blacklist = await checkIfStaffMemberIsAllowedToBlacklistUser(message.guild, staff_member_id, db_user_data?.identity?.discord_user_id);
                if (!staff_member_can_remove_user_from_blacklist) {
                    message.reply('You aren\'t allowed to un-blacklist that user!');
                    return;
                }

                const removed_successfully = await removeUserFromBlacklistedUsersDatabase(db_user_data);
                if (removed_successfully) {
                    message.reply('I removed that user from the blacklist!');
                } else {
                    message.reply('I was unable to remove that user from the blacklist!\nDid you specify them after the command?');
                }

                break;
            case 'lookup':
                const blacklisted_user_db_data = await lookupUserInBlacklistedUsersDatabase(lookup_discord_user_id, lookup_roblox_user_id);
                message.channel.send(new Discord.MessageEmbed({
                    color: 0x60A0FF,
                    author: {
                        iconURL: `${client.user.displayAvatarURL({ dynamic: true })}`,
                        name: 'Inertia Lighting | Blacklisted User Document',
                    },
                    description: (blacklisted_user_db_data ? [
                        `**User:** <@${blacklisted_user_db_data.identity.discord_user_id}>`,
                        `**Roblox Id:** \`${blacklisted_user_db_data.identity.roblox_user_id}\``,
                        `**Staff:** <@${blacklisted_user_db_data.staff_member_id}>`,
                        `**Date:** \`${moment(blacklisted_user_db_data.epoch).tz('America/New_York').format('YYYY[-]MM[-]DD | hh:mm A | [GMT]ZZ')}\``,
                        `**Reason:** ${'```'}\n${blacklisted_user_db_data.reason}\n${'```'}`,
                    ].join('\n') : `${'```'}\nUser is not blacklisted!\n${'```'}`),
                })).catch(console.warn);
                break;
            default:
                message.reply(new Discord.MessageEmbed({
                    color: 0x60A0FF,
                    author: {
                        iconURL: `${client.user.displayAvatarURL({ dynamic: true })}`,
                        name: 'Inertia Lighting | Blacklist System',
                    },
                    description: [
                        'Please use one of the following sub-commands:',
                        '\`\`\`',
                        ...[
                            'add <user_mention | roblox_id> [reason]',
                            'remove <user_mention | roblox_id>',
                            'lookup <user_mention | roblox_id>',
                        ].map(sub_command => `${command_prefix}${command_name} ${sub_command}`),
                        '\`\`\`',
                    ].join('\n'),
                })).catch(console.warn);
                break;
        }
    },
};
