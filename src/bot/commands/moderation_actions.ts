//------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
//------------------------------------------------------------//

//---------------------------------------------------------------------------------------------------------------//

import moment from 'moment-timezone';

import { Timer, array_chunks, string_ellipses } from '../../utilities';

import { go_mongo_db } from '../../mongo/mongo';

import { Discord, client } from '../discord_client';

import { command_permission_levels } from '../common/bot';

import { CustomEmbed } from '../common/message';

//---------------------------------------------------------------------------------------------------------------//

/**
 * Displays moderation actions (for / from) the specified (member / staff member)
 * @param {Discord.Message} message
 * @param {'all'|'member'|'staff'|'id'} lookup_mode (default: 'member')
 * @returns {Promise<void>}
 */
async function listModerationActions(
    message: Discord.Message,
    lookup_mode: 'all' | 'member' | 'staff' | 'id' = 'member',
) {
    if (!(message instanceof Discord.Message)) throw new TypeError('\`message\` must be a Discord.Message');
    if (!['all', 'member', 'staff', 'id'].includes(lookup_mode)) throw new RangeError('\`lookup_mode\` must be \'all\', \'member\', \'staff\', or \'id\'');

    /* get the command arguments */
    const sub_command_args = message.content.split(/\s+/g).slice(2);

    /* lookup query for database */
    const lookup_query = (sub_command_args[0] ?? '').replace(/[^\d\w\-]/g, '');

    /* send an initial message to the user */
    const bot_message = await message.channel.send({
        embeds: [
            CustomEmbed.from({
                description: 'Loading moderation actions...',
            }),
        ],
    });

    /* create a small user-experience delay */
    await Timer(500);

    /* check if a valid query was specified */
    if (lookup_mode !== 'all' && (typeof lookup_query !== 'string' || lookup_query.length === 0)) {
        await bot_message.edit({
            embeds: [
                CustomEmbed.from({
                    color: CustomEmbed.colors.YELLOW,
                    author: {
                        icon_url: `${client.user!.displayAvatarURL({ forceStatic: false })}`,
                        name: 'Inertia Lighting | Moderation Actions',
                    },
                    description: 'You need to specify a valid lookup query!',
                }),
            ],
        }).catch(console.warn);
        return;
    }

    /* fetch all moderation actions from the database */
    const db_moderation_actions = await go_mongo_db.find(process.env.MONGO_DATABASE_NAME as string, process.env.MONGO_MODERATION_ACTION_RECORDS_COLLECTION_NAME as string, {
        ...(lookup_mode === 'staff' ? {
            'record.staff_member_id': lookup_query,
        } : lookup_mode === 'member' ? {
            'identity.discord_user_id': lookup_query,
        } : lookup_mode === 'id' ? {
            'record.id': lookup_query,
        } : {
            /* assume that lookup_mode: 'all' is the default */
            /* in that case, we want to return all moderation actions */
        }),
    });

    /* check if the member has any records */
    if (db_moderation_actions.length === 0) {
        await bot_message.edit({
            embeds: [
                CustomEmbed.from({
                    color: CustomEmbed.colors.YELLOW,
                    author: {
                        icon_url: `${client.user!.displayAvatarURL({ forceStatic: false })}`,
                        name: 'Inertia Lighting | Moderation Actions',
                    },
                    description: 'I wasn\'t able to find any moderation actions for the specified lookup query!',
                }),
            ],
        }).catch(console.warn);
        return;
    }

    await bot_message.edit({
        components: [
            {
                type: 1,
                components: [
                    {
                        type: 2,
                        style: 2,
                        custom_id: 'previous',
                        emoji: {
                            id: undefined,
                            name: '⬅️',
                        },
                    }, {
                        type: 2,
                        style: 2,
                        custom_id: 'next',
                        emoji: {
                            id: undefined,
                            name: '➡️',
                        },
                    }, {
                        type: 2,
                        style: 2,
                        custom_id: 'stop',
                        emoji: {
                            id: undefined,
                            name: '⏹️',
                        },
                    },
                ],
            },
        ],
    });

    /* sort the moderation actions by epoch (newest -> oldest) */
    const sorted_moderation_actions = db_moderation_actions.sort((a, b) => b.record.epoch - a.record.epoch);

    /* split the moderation actions into a 2-dimensional array of chunks */
    const moderation_actions_chunks = array_chunks(sorted_moderation_actions, 5);

    /* send a carousel containing 10 moderation actions per page */
    let page_index = 0;

    async function editEmbedWithNextModerationActionsChunk() {
        const moderation_actions_chunk = moderation_actions_chunks[page_index];

        await bot_message.edit({
            embeds: [
                CustomEmbed.from({
                    author: {
                        icon_url: `${client.user!.displayAvatarURL({ forceStatic: false })}`,
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
                            `${string_ellipses(Discord.escapeMarkdown(moderation_action.record.reason), 250)}`,
                            '\`\`\`',
                        ].join('\n')
                    ).join('\n'),
                }),
            ],
        }).catch(console.warn);

        return; // complete async
    }

    await editEmbedWithNextModerationActionsChunk();

    const message_button_collector_filter = (button_interaction: Discord.MessageComponentInteraction) => button_interaction.user.id === message.author.id;
    const message_button_collector = bot_message.createMessageComponentCollector({
        filter: message_button_collector_filter,
        time: 5 * 60_000, // 5 minutes
    });

    message_button_collector.on('collect', async (button_interaction) => {
        message_button_collector.resetTimer();

        switch (button_interaction.customId) {
            case 'previous': {
                page_index = page_index < moderation_actions_chunks.length - 1 ? page_index + 1 : 0;
                break;
            }

            case 'next': {
                page_index = page_index > 0 ? page_index - 1 : moderation_actions_chunks.length - 1;
                break;
            }

            case 'stop': {
                message_button_collector.stop();
                break;
            }

            default: {
                break;
            }
        }

        await button_interaction.deferUpdate();

        if (message_button_collector.ended) return;

        await editEmbedWithNextModerationActionsChunk();
    });

    message_button_collector.on('end', async () => {
        await bot_message.delete().catch(console.warn);
    });

    return; // complete async
}

/**
 * Update moderation action subcommand
 */
 async function updateModerationAction(message: Discord.Message) {
    const sub_command_args = message.content.split(/\s+/g).slice(2);

    const lookup_query = (sub_command_args[0] ?? '').replace(/[^\d\w\-]/g, '');
    if (lookup_query.length === 0) {
        message.reply({
            embeds: [
                CustomEmbed.from({
                    color: CustomEmbed.colors.YELLOW,
                    author: {
                        icon_url: `${client.user!.displayAvatarURL({ forceStatic: false })}`,
                        name: 'Inertia Lighting | Moderation Actions',
                    },
                    description: 'You need to specify a moderation-actions id when using this command.',
                }),
            ],
        }).catch(console.warn);
        return;
    }

    const [ db_moderation_action ] = await go_mongo_db.find(process.env.MONGO_DATABASE_NAME as string, process.env.MONGO_MODERATION_ACTION_RECORDS_COLLECTION_NAME as string, {
        'record.id': lookup_query,
    });

    if (!db_moderation_action) {
        message.reply({
            embeds: [
                CustomEmbed.from({
                    color: CustomEmbed.colors.YELLOW,
                    author: {
                        icon_url: `${client.user!.displayAvatarURL({ forceStatic: false })}`,
                        name: 'Inertia Lighting | Moderation Actions',
                    },
                    description: 'Unable to find a moderation action with the specified id!',
                }),
            ],
        }).catch(console.warn);
        return;
    }

    const updated_ma_reason = sub_command_args.slice(1).join(' ');
    if (updated_ma_reason.length < 5) {
        message.reply({
            embeds: [
                CustomEmbed.from({
                    color: CustomEmbed.colors.YELLOW,
                    author: {
                        icon_url: `${client.user!.displayAvatarURL({ forceStatic: false })}`,
                        name: 'Inertia Lighting | Moderation Actions',
                    },
                    description: 'The supplied reason was less than 5 characters long, please be more descriptive.',
                }),
            ],
        }).catch(console.warn);
        return;
    }

    try {
        await go_mongo_db.update(process.env.MONGO_DATABASE_NAME as string, process.env.MONGO_MODERATION_ACTION_RECORDS_COLLECTION_NAME as string, {
            'record.id': db_moderation_action.record.id,
        }, {
            $set: {
                'record.reason': `${updated_ma_reason} <edited by ${message.author.tag} (${message.author.id}) on ${moment().tz('America/New_York').format('YYYY[-]MM[-]DD | hh:mm A | [GMT]ZZ')}>`,
            },
        });
    } catch {
        message.reply({
            embeds: [
                CustomEmbed.from({
                    color: CustomEmbed.colors.YELLOW,
                    author: {
                        icon_url: `${client.user!.displayAvatarURL({ forceStatic: false })}`,
                        name: 'Inertia Lighting | Moderation Actions',
                    },
                    description: 'Unable to update the moderation action with the specified id!',
                }),
            ],
        }).catch(console.warn);
        return;
    }

    message.reply({
        embeds: [
            CustomEmbed.from({
                color: CustomEmbed.colors.GREEN,
                author: {
                    icon_url: `${client.user!.displayAvatarURL({ forceStatic: false })}`,
                    name: 'Inertia Lighting | Moderation Actions',
                },
                description: 'Successfully updated the moderation action with the specified id!',
            }),
        ],
    }).catch(console.warn);

    return; // complete async
}

/**
 * Removes moderation actions
 */
async function clearModerationActions(message: Discord.Message) {
    if (!(message instanceof Discord.Message)) throw new TypeError('\`message\` must be a Discord.Message');

    /* get the command arguments */
    const sub_command_args = message.content.split(/\s+/g).slice(2);

    /* lookup query for database */
    const db_lookup_query = sub_command_args[0];

    /* send an initial message to the user */
    const bot_message = await message.channel.send({
        embeds: [
            CustomEmbed.from({
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
                CustomEmbed.from({
                    color: CustomEmbed.colors.YELLOW,
                    author: {
                        icon_url: `${client.user!.displayAvatarURL({ forceStatic: false })}`,
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
        const db_deletion_result = await go_mongo_db.remove(process.env.MONGO_DATABASE_NAME as string, process.env.MONGO_MODERATION_ACTION_RECORDS_COLLECTION_NAME as string, {
            $or: [
                { 'record.id': db_lookup_query.trim() },
                { 'identity.discord_user_id': db_lookup_query.replace(/\D/g, '').trim() },
            ],
        });
        db_delete_operation_count = db_deletion_result.deletedCount ?? 0;
    } catch {
        await bot_message.edit({
            embeds: [
                CustomEmbed.from({
                    color: CustomEmbed.colors.RED,
                    author: {
                        icon_url: `${client.user!.displayAvatarURL({ forceStatic: false })}`,
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
                CustomEmbed.from({
                    color: CustomEmbed.colors.RED,
                    author: {
                        icon_url: `${client.user!.displayAvatarURL({ forceStatic: false })}`,
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
            CustomEmbed.from({
                color: 0x00FF00,
                author: {
                    icon_url: `${client.user!.displayAvatarURL({ forceStatic: false })}`,
                    name: 'Inertia Lighting | Moderation Actions',
                },
                description: `Successfully cleared ${db_delete_operation_count} moderation action(s)!`,
            }),
        ],
    }).catch(console.warn);

    return; // complete async
}

//---------------------------------------------------------------------------------------------------------------//

export default {
    name: 'moderation_actions',
    description: 'displays moderation actions from the database',
    aliases: ['moderation_actions', 'ma'],
    permission_level: command_permission_levels.STAFF,
    cooldown: 1_500,
    async execute(
        message: Discord.Message<true>,
        args: {
            [key: string]: unknown;
            command_args: string[];
        },
    ) {
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

            case 'lookup': {
                await listModerationActions(message, 'id');

                break;
            }

            case 'update': {
                await updateModerationAction(message);

                break;
            }

            case 'clear': {
                await clearModerationActions(message);
                break;
            }

            default: {
                await message.channel.send({
                    embeds: [
                        CustomEmbed.from({
                            color: 0x60A0FF,
                            author: {
                                icon_url: `${client.user!.displayAvatarURL({ forceStatic: false })}`,
                                name: 'Inertia Lighting | Moderation Actions',
                            },
                            title: 'Here are the available sub-commands!',
                            description: [
                                'Displaying all moderation actions in the server:',
                                '\`\`\`',
                                `${command_prefix}${command_name} list`,
                                '\`\`\`',
                                'Displaying a moderation action in the server:',
                                '\`\`\`',
                                `${command_prefix}${command_name} lookup <MODERATION_ACTION_ID>`,
                                '\`\`\`',
                                'Displaying moderation actions for a member in the server:',
                                '\`\`\`',
                                `${command_prefix}${command_name} for <MEMBER_MENTION>`,
                                '\`\`\`',
                                'Displaying moderation actions from a staff member in the server:',
                                '\`\`\`',
                                `${command_prefix}${command_name} from <STAFF_MEMBER_MENTION>`,
                                '\`\`\`',
                                'Updating a moderation action in the server:',
                                '\`\`\`',
                                `${command_prefix}${command_name} update <MODERATION_ACTION_ID> <NEW_REASON>`,
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
