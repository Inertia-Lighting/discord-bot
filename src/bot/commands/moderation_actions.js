/* Copyright © Inertia Lighting | All Rights Reserved */

//---------------------------------------------------------------------------------------------------------------//

'use strict';

//---------------------------------------------------------------------------------------------------------------//

const moment = require('moment-timezone');

const { array_chunks, string_ellipses, Timer } = require('../../utilities.js');

const { go_mongo_db } = require('../../mongo/mongo.js');

const { Discord, client } = require('../discord_client.js');

const { command_permission_levels } = require('../common/bot.js');

//---------------------------------------------------------------------------------------------------------------//

/**
 * Purges all reactions created users on a specified message
 * @param {Discord.Message} message
 * @returns {Promise<void>}
 */
async function purgeUserReactionsFromMessage(message) {
    if (!(message instanceof Discord.Message)) throw new TypeError('\`message\` must be a Discord.Message');
    if (!(message?.guild instanceof Discord.Guild)) throw new TypeError('\`message.guild\` must be a Discord.Guild');

    if (!message.guild.me.permissions.has(Discord.Permissions.FLAGS.MANAGE_MESSAGES)) return;

    for (const message_reaction of message.reactions.cache.values()) {
        const reaction_users = message_reaction.users.cache.filter(user => !user.bot && !user.system); // don't interact with bots / system

        for (const reaction_user of reaction_users.values()) {
            message_reaction.users.remove(reaction_user);
            if (reaction_users.size > 0) await Timer(250); // prevent api abuse
        }
    }

    return; // complete async
}

//---------------------------------------------------------------------------------------------------------------//

/**
 * Displays moderation actions (for / from) the specified (member / staff member)
 * @param {Discord.Message} message
 * @param {'member'|'staff'} lookup_mode (default: 'member')
 * @returns {Promise<void>}
 */
async function listModerationActions(message, lookup_mode='member') {
    if (!(message instanceof Discord.Message)) throw new TypeError('\`message\` must be a Discord.Message');
    if (!['all', 'member', 'staff'].includes(lookup_mode)) throw new RangeError('\`lookup_mode\` must be \'all\', \'member\', or \'staff\'');

    /* get the command arguments */
    const sub_command_args = message.content.split(/\s+/g).slice(2);

    /* lookup query for database */
    const db_user_id_lookup_query = (sub_command_args[0] ?? '').replace(/\D/g, '');

    /* send an initial message to the user */
    const bot_message = await message.channel.send({
        embeds: [
            new Discord.MessageEmbed({
                color: 0x60A0FF,
                description: 'Loading moderation actions...',
            }),
        ],
    });

    /* create a small user-experience delay */
    await Timer(500);

    /* check if a valid query was specified */
    if (lookup_mode !== 'all' && (typeof db_user_id_lookup_query !== 'string' || db_user_id_lookup_query.length === 0)) {
        await bot_message.edit({
            embeds: [
                new Discord.MessageEmbed({
                    color: 0xFFFF00,
                    author: {
                        iconURL: `${client.user.displayAvatarURL({ dynamic: true })}`,
                        name: 'Inertia Lighting | Moderation Actions',
                    },
                    description: 'You need to specify a valid @user mention!',
                }),
            ],
        }).catch(console.warn);
        return;
    }

    /* fetch all moderation actions from the database */
    const db_moderation_actions = await go_mongo_db.find(process.env.MONGO_DATABASE_NAME, process.env.MONGO_MODERATION_ACTION_RECORDS_COLLECTION_NAME, {
        ...(lookup_mode === 'staff' ? {
            'record.staff_member_id': db_user_id_lookup_query,
        } : lookup_mode === 'member' ? {
            'identity.discord_user_id': db_user_id_lookup_query,
        } : {
            /* assume that lookup_mode: 'all' is the default */
            /* in that case, we want to return all moderation actions */
        }),
    });

    /* check if the member has any records */
    if (db_moderation_actions.length === 0) {
        await bot_message.edit({
            embeds: [
                new Discord.MessageEmbed({
                    color: 0xFFFF00,
                    author: {
                        iconURL: `${client.user.displayAvatarURL({ dynamic: true })}`,
                        name: 'Inertia Lighting | Moderation Actions',
                    },
                    description: 'I wasn\'t able to find any moderation actions for the specified individual!',
                }),
            ],
        }).catch(console.warn);
        return;
    }

    /* sort the moderation actions by epoch (newest -> oldest) */
    const sorted_moderation_actions = db_moderation_actions.sort((a, b) => b.record.epoch - a.record.epoch);

    /* split the moderation actions into a 2-dimensional array of chunks */
    const moderation_actions_chunks = array_chunks(sorted_moderation_actions, 10);

    /* send a carousel containing 10 moderation actions per page */
    let page_index = 0;

    async function editEmbedWithNextModerationActionsChunk() {
        const moderation_actions_chunk = moderation_actions_chunks[page_index];

        await bot_message.edit({
            embeds: [
                new Discord.MessageEmbed({
                    color: 0x60A0FF,
                    author: {
                        iconURL: `${client.user.displayAvatarURL({ dynamic: true })}`,
                        name: 'Inertia Lighting | Moderation Actions',
                    },
                    description: moderation_actions_chunk.map(moderation_action =>
                        [
                            `**Id** \`${moderation_action.record.id}\``,
                            `**Staff** <@${moderation_action.record.staff_member_id}>`,
                            `**Member** <@${moderation_action.identity.discord_user_id}>`,
                            `**Date** \`${moment(moderation_action.record.epoch).tz('America/New_York').format('YYYY[-]MM[-]DD | hh:mm A | [GMT]ZZ')}\``,
                            `**Type** \`${moderation_action.record.type}\``,
                            '**Reason**',
                            '\`\`\`',
                            `${string_ellipses(moderation_action.record.reason, 250)}`,
                            '\`\`\`',
                        ].join('\n')
                    ).join('\n'),
                }),
            ],
        }).catch(console.warn);

        return; // complete async
    }

    await editEmbedWithNextModerationActionsChunk();
    await bot_message.react('⬅️');
    await bot_message.react('➡️');
    await bot_message.react('⏹️');

    const message_reaction_filter = (collected_reaction, user) => user.id === message.author.id;
    const message_reaction_collector = bot_message.createReactionCollector({
        filter: message_reaction_filter,
        time: 5 * 60_000, // 5 minutes
    });

    message_reaction_collector.on('collect', async (collected_reaction, collected_reaction_user) => {
        message_reaction_collector.resetTimer();

        switch (collected_reaction.emoji.name) {
            case '⬅️': {
                page_index = page_index < moderation_actions_chunks.length - 1 ? page_index + 1 : 0;
                break;
            }
            case '➡️': {
                page_index = page_index > 0 ? page_index - 1 : moderation_actions_chunks.length - 1;
                break;
            }
            case '⏹️': {
                message_reaction_collector.stop();
                break;
            }
            case '🖕': {
                await bot_message.channel.send({
                    content: `${collected_reaction_user}, That\'s very rude!`,
                }).catch(console.warn);
                break;
            }
            default: {
                break;
            }
        }

        if (message_reaction_collector.ended) return;

        await editEmbedWithNextModerationActionsChunk();
        await Timer(500); // prevent api abuse
        await purgeUserReactionsFromMessage(bot_message);
    });

    message_reaction_collector.on('end', async () => {
        await bot_message.delete().catch(console.warn);
    });

    return; // complete async
}

/**
 * Removes moderation actions
 * @param {Discord.Message} message
 * @returns {Promise<void>}
 */
async function clearModerationActions(message) {
    if (!(message instanceof Discord.Message)) throw new TypeError('\`message\` must be a Discord.Message');

    /* get the command arguments */
    const sub_command_args = message.content.split(/\s+/g).slice(2);

    /* lookup query for database */
    const db_lookup_query = sub_command_args[0];

    /* send an initial message to the user */
    const bot_message = await message.channel.send({
        embeds: [
            new Discord.MessageEmbed({
                color: 0x60A0FF,
                description: 'Loading moderation actions...',
            }),
        ],
    });

    /* create a small user-experience delay */
    await Timer(500);

    /* check if a valid query was specified */
    if (typeof db_lookup_query !== 'string' || db_lookup_query.length === 0) {
        await bot_message.edit({
            embeds: [
                new Discord.MessageEmbed({
                    color: 0xFFFF00,
                    author: {
                        iconURL: `${client.user.displayAvatarURL({ dynamic: true })}`,
                        name: 'Inertia Lighting | Moderation Actions',
                    },
                    description: 'You need to specify a @user mention or moderation action id!',
                }),
            ],
        }).catch(console.warn);
        return;
    }

    /* remove the member's moderation actions from the database */
    let db_delete_operation_count = 0;
    try {
        const db_deletion_result = await go_mongo_db.remove(process.env.MONGO_DATABASE_NAME, process.env.MONGO_MODERATION_ACTION_RECORDS_COLLECTION_NAME, {
            $or: [
                { 'record.id': db_lookup_query.trim() },
                { 'identity.discord_user_id': db_lookup_query.replace(/\D/g, '').trim() },
            ],
        });
        db_delete_operation_count = db_deletion_result.deletedCount ?? 0;
    } catch {
        await bot_message.edit({
            embeds: [
                new Discord.MessageEmbed({
                    color: 0xFF0000,
                    author: {
                        iconURL: `${client.user.displayAvatarURL({ dynamic: true })}`,
                        name: 'Inertia Lighting | Moderation Actions',
                    },
                    title: 'Something went wrong!',
                    description: 'Please inform my developers that an error occurred while clearing moderation actions from the database!',
                }),
            ],
        }).catch(console.warn);
        return;
    }

    if (db_delete_operation_count === 0) {
        await bot_message.edit({
            embeds: [
                new Discord.MessageEmbed({
                    color: 0xFF0000,
                    author: {
                        iconURL: `${client.user.displayAvatarURL({ dynamic: true })}`,
                        name: 'Inertia Lighting | Moderation Actions',
                    },
                    description: `No moderation actions were found for the specified query: \`${db_lookup_query}\``,
                }),
            ],
        }).catch(console.warn);
        return;
    }

    await bot_message.edit({
        embeds: [
            new Discord.MessageEmbed({
                color: 0x00FF00,
                author: {
                    iconURL: `${client.user.displayAvatarURL({ dynamic: true })}`,
                    name: 'Inertia Lighting | Moderation Actions',
                },
                description: `Successfully cleared ${db_delete_operation_count} moderation action(s)!`,
            }),
        ],
    }).catch(console.warn);

    return; // complete async
}

//---------------------------------------------------------------------------------------------------------------//

module.exports = {
    name: 'moderation_actions',
    description: 'displays moderation actions from the database',
    aliases: ['moderation_actions', 'ma'],
    permission_level: command_permission_levels.STAFF,
    cooldown: 10_000,
    async execute(message, args) {
        const { command_prefix, command_name, command_args } = args;

        const sub_command_name = `${command_args[0]}`.toLowerCase();

        switch (sub_command_name) {
            case 'list': {
                await listModerationActions(message, 'all');

                break;
            }
            case 'for': {
                await listModerationActions(message, 'member');

                break;
            }
            case 'from': {
                await listModerationActions(message, 'staff');

                break;
            }
            case 'clear': {
                await clearModerationActions(message);

                break;
            }
            default: {
                await message.channel.send({
                    embeds: [
                        new Discord.MessageEmbed({
                            color: 0x60A0FF,
                            author: {
                                iconURL: `${client.user.displayAvatarURL({ dynamic: true })}`,
                                name: 'Inertia Lighting | Moderation Actions',
                            },
                            title: 'Here are the available sub-commands!',
                            description: [
                                'Displaying all moderation actions in the server:',
                                '\`\`\`',
                                `${command_prefix}${command_name} list`,
                                '\`\`\`',
                                'Displaying moderation actions for a member in the server:',
                                '\`\`\`',
                                `${command_prefix}${command_name} for <MEMBER_MENTION>`,
                                '\`\`\`',
                                'Displaying moderation actions from a staff member in the server:',
                                '\`\`\`',
                                `${command_prefix}${command_name} from <STAFF_MEMBER_MENTION>`,
                                '\`\`\`',
                                'Clearing all moderation actions for a member in the server:',
                                '\`\`\`',
                                `${command_prefix}${command_name} clear <USER_MENTION_OR_MODERATION_ACTION_ID>`,
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
