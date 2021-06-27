/* Copyright © Inertia Lighting | All Rights Reserved */

//---------------------------------------------------------------------------------------------------------------//

'use strict';

//---------------------------------------------------------------------------------------------------------------//

const moment = require('moment-timezone');

const { array_chunks, string_ellipses, Timer } = require('../../utilities.js');

const { go_mongo_db } = require('../../mongo/mongo.js');

const { Discord, client } = require('../discord_client.js');

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

async function listModerationActionsForMember(message, { sub_command_name, sub_command_args }) {
    /* lookup query for database */
    const db_member_id_lookup_query = message.mentions.members?.first()?.id ?? undefined;

    /* send an initial message to the user */
    const bot_message = await message.channel.send(new Discord.MessageEmbed({
        color: 0x60A0FF,
        description: 'Loading moderation actions...',
    }));

    /* create a small user-experience delay */
    await Timer(500);

    /* fetch all moderation actions from the database */
    const db_moderation_actions = await go_mongo_db.find(process.env.MONGO_DATABASE_NAME, process.env.MONGO_MODERATION_ACTION_RECORDS_COLLECTION_NAME, {
        'identity.discord_user_id': db_member_id_lookup_query,
    });

    /* check if the member has any records */
    if (db_moderation_actions.length === 0) {
        await bot_message.edit(new Discord.MessageEmbed({
            color: 0xFFFF00,
            author: {
                iconURL: `${client.user.displayAvatarURL({ dynamic: true })}`,
                name: 'Inertia Lighting | Moderation Actions',
            },
            description: 'I wasn\'t able to find any moderation actions for the specified member!',
        })).catch(console.warn);
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

        await bot_message.edit(new Discord.MessageEmbed({
            color: 0x60A0FF,
            author: {
                iconURL: `${client.user.displayAvatarURL({ dynamic: true })}`,
                name: 'Inertia Lighting | Moderation Actions',
            },
            description: moderation_actions_chunk.map(moderation_action =>
                [
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
        })).catch(console.warn);

        return; // complete async
    }

    await editEmbedWithNextModerationActionsChunk();
    await bot_message.react('⬅️');
    await bot_message.react('➡️');
    await bot_message.react('⏹️');

    const message_reaction_filter = (collected_reaction, user) => user.id === message.author.id;
    const message_reaction_collector = bot_message.createReactionCollector(message_reaction_filter, {
        time: 5 * 60_000, // 5 minutes
    });

    message_reaction_collector.on('collect', async (collected_reaction) => {
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
            default: {
                break;
            }
        }

        if (message_reaction_collector.ended) return;

        await editEmbedWithNextModerationActionsChunk();
        await Timer(250);
        await purgeUserReactionsFromMessage(bot_message);
    });

    message_reaction_collector.on('end', async () => {
        await bot_message.delete();
    });
}

//---------------------------------------------------------------------------------------------------------------//

module.exports = {
    name: 'moderation_actions',
    description: 'displays moderation actions from the database',
    aliases: ['moderation_actions'],
    permission_level: 'staff',
    cooldown: 10_000,
    async execute(message, args) {
        const { command_prefix, command_name, command_args } = args;

        const sub_command_name = `${command_args[0]}`.toLowerCase();
        const sub_command_args = command_args.slice(1);

        switch (sub_command_name) {
            case 'for': {
                await listModerationActionsForMember(message, { ...args, sub_command_name, sub_command_args });

                break;
            }
            default: {
                await message.channel.send(new Discord.MessageEmbed({
                    color: 0x60A0FF,
                    author: {
                        iconURL: `${client.user.displayAvatarURL({ dynamic: true })}`,
                        name: 'Inertia Lighting | Moderation Actions',
                    },
                    title: 'Here are the available sub-commands!',
                    description: [
                        `- ${command_prefix}${command_name} for USER_HERE`,
                        `- ${command_prefix}${command_name} clear USER_HERE`,
                    ].join('\n'),
                })).catch(console.warn);

                break;
            }
        }
    },
};
