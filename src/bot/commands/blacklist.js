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
 * @returns {Promise<any|undefined>} user_db_data
 */
async function findUserInUsersDatabase(discord_user_id=undefined, roblox_user_id=undefined) {
    const [ user_db_data ] = await go_mongo_db.find(process.env.MONGO_DATABASE_NAME, process.env.MONGO_USERS_COLLECTION_NAME, {
        ...(discord_user_id ? {
            'discord_user_id': discord_user_id,
        } : {
            'roblox_user_id': roblox_user_id,
        }),
    });
    return user_db_data;
}

/**
 * Adds a user to the blacklist
 * @param {*} user_db_data 
 * @param {*} blacklist_metadata 
 * @returns {Promise<boolean>} success or failure
 */
async function addUserToBlacklistedUsersDatabase({ discord_user_id, roblox_user_id }, { epoch, reason, staff_member_id }) {
    if (discord_user_id && roblox_user_id) {
        await go_mongo_db.update(process.env.MONGO_DATABASE_NAME, process.env.MONGO_BLACKLISTED_USERS_COLLECTION_NAME, {
            'discord_user_id': discord_user_id,
        }, {
            $set: {
                'discord_user_id': discord_user_id,
                'roblox_user_id': roblox_user_id,
                'epoch': epoch,
                'reason': reason,
                'staff_member_id': staff_member_id,
            },
        }, {
            upsert: true,
        });
        return true; // user was added to blacklist
    } else {
        console.trace('missing \`discord_user_id\` or \`roblox_user_id\`!');
        return false; // user was not added to blacklist
    }
}

/**
 * Removes a user from the blacklist
 * @param {*} user_db_data 
 * @returns {Promise<boolean>} success or failure
 */
async function removeUserFromBlacklistedUsersDatabase({ discord_user_id, roblox_user_id }) {
    if (discord_user_id && roblox_user_id) {
        await go_mongo_db.remove(process.env.MONGO_DATABASE_NAME, process.env.MONGO_BLACKLISTED_USERS_COLLECTION_NAME, {
            'discord_user_id': discord_user_id,
            'roblox_user_id': roblox_user_id,
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
            'discord_user_id': discord_user_id,
        } : {
            'roblox_user_id': roblox_user_id,
        }),
    }, {
        projection: {
            '_id': false,
        },
    });
    return blacklisted_user_db_data;
}

//---------------------------------------------------------------------------------------------------------------//

module.exports = {
    name: 'blacklist',
    description: 'blacklists a specified user in the database',
    aliases: ['blacklist'],
    permission_level: 'admin',
    async execute(message, args) {
        const { command_prefix, command_name, command_args } = args;

        const lookup_discord_user_id = message.mentions.members.first()?.id;
        const lookup_roblox_user_id = command_args[1];

        const user_db_data = (await findUserInUsersDatabase(lookup_discord_user_id, lookup_roblox_user_id)) ?? {}; // force the result to be an object

        switch (command_args[0]?.toLowerCase()) {
            case 'add':
                const added_successfully = await addUserToBlacklistedUsersDatabase(user_db_data, {
                    epoch: Date.now(),
                    reason: command_args.slice(2).join(' ').trim() || 'no reason was specified',
                    staff_member_id: message.author.id,
                });
                if (added_successfully) {
                    message.reply('I added that user to the blacklist!');
                } else {
                    message.reply('I was unable to add that user to the blacklist!\nDid you specify them after the command?');
                }
                break;
            case 'remove':
                const removed_successfully = await removeUserFromBlacklistedUsersDatabase(user_db_data);
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
                        `**User:** <@${blacklisted_user_db_data.discord_user_id}>`,
                        `**Roblox Id:** \`${blacklisted_user_db_data.roblox_user_id}\``,
                        `**Staff:** <@${blacklisted_user_db_data.staff_member_id}>`,
                        `**Date:** \`${moment(blacklisted_user_db_data.epoch).tz('America/New_York').format('YYYY[-]MM[-]DD | hh:mm A | [GMT]ZZ')}\``,
                        `**Reason:** \`\`\`\n${blacklisted_user_db_data.reason}\n\`\`\``,
                    ].join('\n') : '\`\`\`\nuser not found in blacklist database\n\`\`\`'),
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
                            'add <discord_user_mention | roblox_player_id> [reason]',
                            'remove <discord_user_mention | roblox_player_id>',
                            'lookup <discord_user_mention | roblox_player_id>',
                        ].map(sub_command => `${command_prefix}${command_name} ${sub_command}`),
                        '\`\`\`',
                    ].join('\n'),
                })).catch(console.warn);
                break;
        }
    },
};
