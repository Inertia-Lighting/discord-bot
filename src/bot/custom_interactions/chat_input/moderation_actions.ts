//------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
//------------------------------------------------------------//

import moment from 'moment-timezone';

import * as Discord from 'discord.js';

import { Timer, array_chunks, string_ellipses } from '@root/utilities';

import { CustomInteraction, CustomInteractionAccessLevel, CustomInteractionRunContext } from '@root/bot/common/managers/custom_interactions_manager';

import { go_mongo_db } from '@root/mongo/mongo';

import { CustomEmbed } from '@root/bot/common/message';

//------------------------------------------------------------//

const db_database_name = `${process.env.MONGO_DATABASE_NAME ?? ''}`;
if (db_database_name.length < 1) throw new Error('Environment variable: MONGO_DATABASE_NAME; is not set correctly.');

const db_moderation_action_records_collection_name = `${process.env.MONGO_MODERATION_ACTION_RECORDS_COLLECTION_NAME ?? ''}`;
if (db_moderation_action_records_collection_name.length < 1) throw new Error('Environment variable: MONGO_MODERATION_ACTION_RECORDS_COLLECTION_NAME; is not set correctly.');

//------------------------------------------------------------//

enum ModerationActionLookupMode {
    All = 'all',
    DiscordUser = 'member',
    StaffMember = 'staff',
    Id = 'id',
}

//------------------------------------------------------------//

async function listModerationActions(
    interaction: Discord.ChatInputCommandInteraction,
    { lookup_mode, lookup_query }: {
        lookup_mode: ModerationActionLookupMode.DiscordUser | ModerationActionLookupMode.StaffMember | ModerationActionLookupMode.Id,
        lookup_query: string,
    },
): Promise<void>;
async function listModerationActions(
    interaction: Discord.ChatInputCommandInteraction,
    { lookup_mode, lookup_query }: {
        lookup_mode: ModerationActionLookupMode.All,
        lookup_query: 'all',
    },
): Promise<void>;
async function listModerationActions(
    interaction: Discord.ChatInputCommandInteraction,
    { lookup_mode, lookup_query }: {
        lookup_mode: ModerationActionLookupMode,
        lookup_query: string,
    },
): Promise<void> {
    if (!interaction.inCachedGuild()) return;
    if (!interaction.isChatInputCommand()) return;

    /* send an initial message to the user */
    const bot_message = await interaction.editReply({
        embeds: [
            CustomEmbed.from({
                description: 'Loading moderation actions...',
            }),
        ],
    });

    /* create a small user-experience delay */
    await Timer(500);

    /* fetch all moderation actions from the database */
    let db_moderation_actions;
    switch (lookup_mode) {
        case ModerationActionLookupMode.All: {
            db_moderation_actions = await go_mongo_db.find(db_database_name, db_moderation_action_records_collection_name, {});

            break;
        }

        case ModerationActionLookupMode.DiscordUser: {
            db_moderation_actions = await go_mongo_db.find(db_database_name, db_moderation_action_records_collection_name, {
                'identity.discord_user_id': lookup_query,
            });

            break;
        }

        case ModerationActionLookupMode.StaffMember: {
            db_moderation_actions = await go_mongo_db.find(db_database_name, db_moderation_action_records_collection_name, {
                'record.staff_member_id': lookup_query,
            });

            break;
        }

        case ModerationActionLookupMode.Id: {
            db_moderation_actions = await go_mongo_db.find(db_database_name, db_moderation_action_records_collection_name, {
                'record.id': lookup_query,
            });

            break;
        }

        default: {
            throw new Error('Invalid lookup mode.');
        }
    }

    /* check if the member has any records */
    if (db_moderation_actions.length === 0) {
        await bot_message.edit({
            embeds: [
                CustomEmbed.from({
                    color: CustomEmbed.Color.Yellow,
                    author: {
                        icon_url: `${interaction.client.user.displayAvatarURL({ forceStatic: false })}`,
                        name: 'Inertia Lighting | Moderation Actions',
                    },
                    description: 'I wasn\'t able to find any moderation actions.',
                }),
            ],
        }).catch(console.warn);

        return;
    }

    await bot_message.edit({
        components: [
            {
                type: Discord.ComponentType.ActionRow,
                components: [
                    {
                        type: Discord.ComponentType.Button,
                        style: Discord.ButtonStyle.Secondary,
                        customId: 'previous',
                        label: 'Previous',
                    }, {
                        type: Discord.ComponentType.Button,
                        style: Discord.ButtonStyle.Secondary,
                        customId: 'next',
                        label: 'Next',
                    }, {
                        type: Discord.ComponentType.Button,
                        style: Discord.ButtonStyle.Danger,
                        customId: 'stop',
                        label: 'Stop',
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
                        icon_url: `${interaction.client.user.displayAvatarURL({ forceStatic: false })}`,
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

    const message_button_collector_filter = (button_interaction: Discord.MessageComponentInteraction) => button_interaction.user.id === interaction.user.id;
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

async function updateModerationAction(
    interaction: Discord.ChatInputCommandInteraction,
) {
    if (!interaction.inCachedGuild()) return;
    if (!interaction.isChatInputCommand()) return;

    const moderation_action_id = interaction.options.getString('moderation_action_id', true);
    const new_moderation_action_reason = interaction.options.getString('reason', true);

    const [ db_moderation_action ] = await go_mongo_db.find(db_database_name, db_moderation_action_records_collection_name, {
        'record.id': moderation_action_id,
    });

    if (!db_moderation_action) {
        await interaction.editReply({
            embeds: [
                CustomEmbed.from({
                    color: CustomEmbed.Color.Yellow,
                    author: {
                        icon_url: `${interaction.client.user.displayAvatarURL({ forceStatic: false })}`,
                        name: 'Inertia Lighting | Moderation Actions',
                    },
                    description: 'Unable to find a moderation action with the specified id!',
                }),
            ],
        }).catch(console.warn);

        return;
    }

    try {
        await go_mongo_db.update(db_database_name, db_moderation_action_records_collection_name, {
            'record.id': db_moderation_action.record.id,
        }, {
            $set: {
                'record.reason': `${new_moderation_action_reason} <edited by ${interaction.user.tag} (${interaction.user.id}) on ${moment().tz('America/New_York').format('YYYY[-]MM[-]DD | hh:mm A | [GMT]ZZ')}>`,
            },
        });
    } catch {
        interaction.editReply({
            embeds: [
                CustomEmbed.from({
                    color: CustomEmbed.Color.Yellow,
                    author: {
                        icon_url: `${interaction.client.user.displayAvatarURL({ forceStatic: false })}`,
                        name: 'Inertia Lighting | Moderation Actions',
                    },
                    description: 'Unable to update the moderation action with the specified id!',
                }),
            ],
        }).catch(console.warn);

        return;
    }

    await interaction.editReply({
        embeds: [
            CustomEmbed.from({
                color: CustomEmbed.Color.Green,
                author: {
                    icon_url: `${interaction.client.user.displayAvatarURL({ forceStatic: false })}`,
                    name: 'Inertia Lighting | Moderation Actions',
                },
                description: 'Successfully updated the specified moderation action!',
            }),
        ],
    }).catch(console.warn);

    return; // complete async
}

async function removeModerationAction(
    interaction: Discord.ChatInputCommandInteraction,
) {
    if (!interaction.inCachedGuild()) return;
    if (!interaction.isChatInputCommand()) return;

    const moderation_action_id = interaction.options.getString('moderation_action_id', true);

    /* remove the member's moderation actions from the database */
    let db_delete_operation_count = 0;
    try {
        const db_deletion_result = await go_mongo_db.remove(db_database_name, db_moderation_action_records_collection_name, {
            'record.id': moderation_action_id,
        });
        db_delete_operation_count = db_deletion_result.deletedCount ?? 0;
    } catch {
        await interaction.editReply({
            embeds: [
                CustomEmbed.from({
                    color: CustomEmbed.Color.Red,
                    author: {
                        icon_url: `${interaction.client.user.displayAvatarURL({ forceStatic: false })}`,
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
        await interaction.editReply({
            embeds: [
                CustomEmbed.from({
                    color: CustomEmbed.Color.Red,
                    author: {
                        icon_url: `${interaction.client.user.displayAvatarURL({ forceStatic: false })}`,
                        name: 'Inertia Lighting | Moderation Actions',
                    },
                    description: 'No moderation actions were removed for the specified query.',
                }),
            ],
        }).catch(console.warn);

        return;
    }

    await interaction.editReply({
        embeds: [
            CustomEmbed.from({
                color: 0x00FF00,
                author: {
                    icon_url: `${interaction.client.user.displayAvatarURL({ forceStatic: false })}`,
                    name: 'Inertia Lighting | Moderation Actions',
                },
                description: `Successfully cleared ${db_delete_operation_count} moderation action(s)!`,
            }),
        ],
    }).catch(console.warn);
}

async function purgeModerationActions(
    interaction: Discord.ChatInputCommandInteraction,
) {
    if (!interaction.inCachedGuild()) return;
    if (!interaction.isChatInputCommand()) return;

    const user = interaction.options.getUser('user', true);

    /* remove the member's moderation actions from the database */
    let db_delete_operation_count = 0;
    try {
        const db_deletion_result = await go_mongo_db.remove(db_database_name, db_moderation_action_records_collection_name, {
            'identity.discord_user_id': user.id,
        });
        db_delete_operation_count = db_deletion_result.deletedCount ?? 0;
    } catch {
        await interaction.editReply({
            embeds: [
                CustomEmbed.from({
                    color: CustomEmbed.Color.Red,
                    author: {
                        icon_url: `${interaction.client.user.displayAvatarURL({ forceStatic: false })}`,
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
        await interaction.editReply({
            embeds: [
                CustomEmbed.from({
                    color: CustomEmbed.Color.Red,
                    author: {
                        icon_url: `${interaction.client.user.displayAvatarURL({ forceStatic: false })}`,
                        name: 'Inertia Lighting | Moderation Actions',
                    },
                    description: 'No moderation actions were removed for the specified query.',
                }),
            ],
        }).catch(console.warn);

        return;
    }

    await interaction.editReply({
        embeds: [
            CustomEmbed.from({
                color: 0x00FF00,
                author: {
                    icon_url: `${interaction.client.user.displayAvatarURL({ forceStatic: false })}`,
                    name: 'Inertia Lighting | Moderation Actions',
                },
                description: `Successfully cleared ${db_delete_operation_count} moderation action(s)!`,
            }),
        ],
    }).catch(console.warn);
}

export default new CustomInteraction({
    identifier: 'moderation_actions',
    type: Discord.InteractionType.ApplicationCommand,
    data: {
        type: Discord.ApplicationCommandType.ChatInput,
        description: 'Used by our staff to manage moderation actions.',
        options: [
            {
                name: 'list',
                type: Discord.ApplicationCommandOptionType.Subcommand,
                description: 'Lists all the moderation actions.',
                options: [],
            }, {
                name: 'lookup',
                type: Discord.ApplicationCommandOptionType.Subcommand,
                description: 'Lookup a moderation action by a moderation action id.',
                options: [
                    {
                        name: 'moderation_action_id',
                        type: Discord.ApplicationCommandOptionType.String,
                        description: 'The moderation action id you want to lookup.',
                        minLength: 1,
                        maxLength: 64,
                        required: true,
                    },
                ],
            }, {
                name: 'for',
                type: Discord.ApplicationCommandOptionType.Subcommand,
                description: 'Lookup all the moderation actions for a user.',
                options: [
                    {
                        name: 'user',
                        type: Discord.ApplicationCommandOptionType.User,
                        description: 'The user you want to lookup.',
                        required: true,
                    },
                ],
            }, {
                name: 'from',
                type: Discord.ApplicationCommandOptionType.Subcommand,
                description: 'Lookup all the moderation actions by a staff member.',
                options: [
                    {
                        name: 'staff_member',
                        type: Discord.ApplicationCommandOptionType.User,
                        description: 'The staff member to lookup.',
                        required: true,
                    },
                ],
            }, {
                name: 'update',
                type: Discord.ApplicationCommandOptionType.Subcommand,
                description: 'Update a moderation action by a moderation action id.',
                options: [
                    {
                        name: 'moderation_action_id',
                        type: Discord.ApplicationCommandOptionType.String,
                        description: 'The moderation action id you want to update.',
                        minLength: 1,
                        maxLength: 64,
                        required: true,
                    }, {
                        name: 'reason',
                        type: Discord.ApplicationCommandOptionType.String,
                        description: 'The new reason for the moderation action.',
                        minLength: 1,
                        maxLength: 256,
                        required: true,
                    },
                ],
            }, {
                name: 'remove',
                type: Discord.ApplicationCommandOptionType.Subcommand,
                description: 'Removes a moderation action from the database.',
                options: [
                    {
                        name: 'moderation_action_id',
                        type: Discord.ApplicationCommandOptionType.String,
                        description: 'The moderation action id to remove from the database.',
                        minLength: 1,
                        maxLength: 64,
                        required: true,
                    },
                ],
            }, {
                name: 'purge',
                type: Discord.ApplicationCommandOptionType.Subcommand,
                description: 'Removes all moderation actions for a specified user.',
                options: [
                    {
                        name: 'user',
                        type: Discord.ApplicationCommandOptionType.User,
                        description: 'The user to remove all moderation actions for.',
                        required: true,
                    },
                ],
            },
        ],
    },
    metadata: {
        required_run_context: CustomInteractionRunContext.Guild,
        required_access_level: CustomInteractionAccessLevel.Staff,
    },
    handler: async (discord_client, interaction) => {
        if (!interaction.isChatInputCommand()) return;
        if (!interaction.inCachedGuild()) return;
        if (!interaction.channel) return;

        await interaction.deferReply({ ephemeral: false });

        const subcommand_name = interaction.options.getSubcommand(true);

        switch (subcommand_name) {
            case 'list': {
                await listModerationActions(interaction, {
                    lookup_mode: ModerationActionLookupMode.All,
                    lookup_query: 'all',
                });

                break;
            }

            case 'lookup': {
                const moderation_action_id = interaction.options.getString('moderation_action_id', true);

                await listModerationActions(interaction, {
                    lookup_mode: ModerationActionLookupMode.Id,
                    lookup_query: moderation_action_id,
                });

                break;
            }

            case 'for': {
                const user = interaction.options.getUser('user', true);

                await listModerationActions(interaction, {
                    lookup_mode: ModerationActionLookupMode.DiscordUser,
                    lookup_query: user.id,
                });

                break;
            }

            case 'from': {
                const staff_member = interaction.options.getUser('staff_member', true);

                await listModerationActions(interaction, {
                    lookup_mode: ModerationActionLookupMode.StaffMember,
                    lookup_query: staff_member.id,
                });

                break;
            }

            case 'update': {
                await updateModerationAction(interaction);

                break;
            }

            case 'remove': {
                await removeModerationAction(interaction);

                break;
            }

            case 'purge': {
                await purgeModerationActions(interaction);

                break;
            }

            default: {
                throw new Error(`Unknown subcommand name: ${subcommand_name}`);
            }
        }
    },
});
