//------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
//------------------------------------------------------------//

import * as Discord from 'discord.js';

import { chunkArray, delay, ellipseString, getMarkdownFriendlyTimestamp } from '@root/utilities';

import { CustomInteraction, CustomInteractionAccessLevel, CustomInteractionRunContext } from '@root/common/managers/custom_interactions_manager';

import { UserNote, createNoteForUser, lookupNoteForUser, lookupNotesForUser, purgeNotesFromUser, removeNoteFromUser, updateNoteForUser } from '@root/common/handlers';

import { CustomEmbed } from '@root/common/message';

//------------------------------------------------------------//

async function manageNotesLookupSubCommandHandler(
    interaction: Discord.ChatInputCommandInteraction,
) {
    if (!interaction.inCachedGuild()) return;
    if (!interaction.isChatInputCommand()) return;

    const note_id = interaction.options.getString('note_id', true);

    const user_note = await lookupNoteForUser({
        id: note_id,
    });

    if (!user_note) {
        await interaction.editReply({
            embeds: [
                CustomEmbed.from({
                    color: CustomEmbed.Color.Yellow,
                    author: {
                        icon_url: `${interaction.client.user.displayAvatarURL({ forceStatic: false })}`,
                        name: 'Inertia Lighting | User Notes',
                    },
                    description: 'I wasn\'t able to find the specified note in the database.',
                }),
            ],
        }).catch(console.warn);

        return;
    }

    await interaction.editReply({
        embeds: [
            CustomEmbed.from({
                author: {
                    icon_url: `${interaction.client.user.displayAvatarURL({ forceStatic: false })}`,
                    name: 'Inertia Lighting | User Notes',
                },
                description: [
                    `**Id** \`${user_note.record.id}\``,
                    `**Staff** ${Discord.userMention(user_note.record.staff_member_id)}`,
                    `**Member** ${Discord.userMention(user_note.identity.discord_user_id)}`,
                    `**Date** <t:${getMarkdownFriendlyTimestamp(user_note.record.epoch)}:f>`,
                    '**Content**',
                    '\`\`\`',
                    `${ellipseString(Discord.escapeMarkdown(user_note.record.note), 512)}`,
                    '\`\`\`',
                ].join('\n'),
            }),
        ],
    }).catch(console.warn);
}

async function manageNotesForSubCommandHandler(
    interaction: Discord.ChatInputCommandInteraction,
) {
    if (!interaction.inCachedGuild()) return;
    if (!interaction.isChatInputCommand()) return;

    const user = interaction.options.getUser('user', true);

    const bot_message = await interaction.editReply({
        embeds: [
            CustomEmbed.from({
                description: 'Loading user notes...',
            }),
        ],
    });

    /* create a small user-experience delay */
    await delay(500);

    const user_notes = await lookupNotesForUser({
        discord_user_id: user.id,
    }) as UserNote[];

    if (user_notes.length === 0) {
        await bot_message.edit({
            embeds: [
                CustomEmbed.from({
                    color: CustomEmbed.Color.Yellow,
                    author: {
                        icon_url: `${interaction.client.user.displayAvatarURL({ forceStatic: false })}`,
                        name: 'Inertia Lighting | User Notes',
                    },
                    description: 'I wasn\'t able to find any notes for that user.',
                }),
            ],
        }).catch(console.warn);

        return;
    }

    const sorted_user_notes = user_notes.sort((a, b) => b.record.epoch - a.record.epoch);
    const user_notes_chunks = chunkArray(sorted_user_notes, 5);

    if (user_notes_chunks.length > 1) {
        await bot_message.edit({
            components: [
                {
                    type: Discord.ComponentType.ActionRow,
                    components: [
                        {
                            type: Discord.ComponentType.Button,
                            style: Discord.ButtonStyle.Secondary,
                            custom_id: 'previous',
                            label: 'Previous',
                        }, {
                            type: Discord.ComponentType.Button,
                            style: Discord.ButtonStyle.Secondary,
                            custom_id: 'next',
                            label: 'Next',
                        }, {
                            type: Discord.ComponentType.Button,
                            style: Discord.ButtonStyle.Danger,
                            custom_id: 'stop',
                            label: 'Stop',
                        },
                    ],
                },
            ],
        });
    }

    let page_index = 0;

    async function editEmbedWithNextUserNotesChunk() {
        const user_notes_chunk = user_notes_chunks[page_index];

        await bot_message.edit({
            embeds: [
                CustomEmbed.from({
                    author: {
                        icon_url: `${interaction.client.user.displayAvatarURL({ forceStatic: false })}`,
                        name: 'Inertia Lighting | User Notes',
                    },
                    description: user_notes_chunk.map(user_note =>
                        [
                            `**Id** \`${user_note.record.id}\``,
                            `**Staff** ${Discord.userMention(user_note.record.staff_member_id)}`,
                            `**Member** ${Discord.userMention(user_note.identity.discord_user_id)}`,
                            `**Date** <t:${`${user_note.record.epoch}`.slice(0, -3)}:f>`,
                            '**Content**',
                            '\`\`\`',
                            `${ellipseString(Discord.escapeMarkdown(user_note.record.note), 250)}`,
                            '\`\`\`',
                        ].join('\n')
                    ).join('\n'),
                }),
            ],
        }).catch(console.warn);
    }

    await editEmbedWithNextUserNotesChunk();

    const message_button_collector_filter = (
        button_interaction: Discord.MessageComponentInteraction,
    ) => button_interaction.user.id === interaction.user.id;

    const message_button_collector = bot_message.createMessageComponentCollector({
        filter: message_button_collector_filter,
        time: 5 * 60_000, // 5 minutes
    });

    message_button_collector.on('collect', async (button_interaction) => {
        message_button_collector.resetTimer();

        switch (button_interaction.customId) {
            case 'previous': {
                page_index = page_index < user_notes_chunks.length - 1 ? page_index + 1 : 0;

                break;
            }
            case 'next': {
                page_index = page_index > 0 ? page_index - 1 : user_notes_chunks.length - 1;

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

        await editEmbedWithNextUserNotesChunk();
    });

    message_button_collector.on('end', async () => {
        await bot_message.delete().catch(console.warn);
    });
}

async function manageNotesAddSubCommandHandler(
    interaction: Discord.ChatInputCommandInteraction,
) {
    if (!interaction.inCachedGuild()) return;
    if (!interaction.isChatInputCommand()) return;

    const user = interaction.options.getUser('user', true);
    const note = interaction.options.getString('note', true);

    const note_was_created_successfully = await createNoteForUser({
        discord_user_id: user.id,
    }, {
        epoch: Date.now(),
        note: note,
        staff_member_id: interaction.user.id,
    });

    if (!note_was_created_successfully) {
        await interaction.editReply({
            embeds: [
                CustomEmbed.from({
                    color: CustomEmbed.Color.Red,
                    author: {
                        icon_url: `${interaction.client.user.displayAvatarURL({ forceStatic: false })}`,
                        name: 'Inertia Lighting | User Notes',
                    },
                    description: 'An error occurred while creating a note for the user.',
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
                    name: 'Inertia Lighting | User Notes',
                },
                description: 'Successfully created note for user.',
            }),
        ],
    }).catch(console.warn);
}

async function manageNotesEditSubCommandHandler(
    interaction: Discord.ChatInputCommandInteraction,
) {
    if (!interaction.inCachedGuild()) return;
    if (!interaction.isChatInputCommand()) return;

    const note_id = interaction.options.getString('note_id', true);
    const note = interaction.options.getString('note', true);

    const note_in_database = await lookupNoteForUser({
        id: note_id,
    });

    if (!note_in_database) {
        await interaction.editReply({
            embeds: [
                CustomEmbed.from({
                    color: CustomEmbed.Color.Yellow,
                    author: {
                        icon_url: `${interaction.client.user.displayAvatarURL({ forceStatic: false })}`,
                        name: 'Inertia Lighting | User Notes',
                    },
                    description: 'Unable to find specified note id in the database!',
                }),
            ],
        }).catch(console.warn);

        return;
    }

    const successfully_updated_note = await updateNoteForUser({
        id: note_in_database.record.id,
        epoch: Date.now(),
        note: note,
        staff_member_id: interaction.user.id,
    });

    if (!successfully_updated_note) {
        await interaction.editReply({
            embeds: [
                CustomEmbed.from({
                    color: CustomEmbed.Color.Red,
                    author: {
                        icon_url: `${interaction.client.user.displayAvatarURL({ forceStatic: false })}`,
                        name: 'Inertia Lighting | User Notes',
                    },
                    description: 'An error occurred while updating a note for the user.',
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
                    name: 'Inertia Lighting | User Notes',
                },
                description: 'Successfully updated note for user.',
            }),
        ],
    }).catch(console.warn);
}

async function manageNotesRemoveSubCommandHandler(
    interaction: Discord.ChatInputCommandInteraction,
) {
    if (!interaction.inCachedGuild()) return;
    if (!interaction.isChatInputCommand()) return;

    const note_id = interaction.options.getString('note_id', true);

    const note_in_database = await lookupNoteForUser({
        id: note_id,
    });

    if (!note_in_database) {
        await interaction.editReply({
            embeds: [
                CustomEmbed.from({
                    color: CustomEmbed.Color.Yellow,
                    author: {
                        icon_url: `${interaction.client.user.displayAvatarURL({ forceStatic: false })}`,
                        name: 'Inertia Lighting | User Notes',
                    },
                    description: 'That note ID was not found in the database!',
                }),
            ],
        }).catch(console.warn);

        return;
    }

    const successfully_removed_note = await removeNoteFromUser({
        id: note_in_database.record.id,
    });

    if (!successfully_removed_note) {
        await interaction.editReply({
            embeds: [
                CustomEmbed.from({
                    color: CustomEmbed.Color.Red,
                    author: {
                        icon_url: `${interaction.client.user.displayAvatarURL({ forceStatic: false })}`,
                        name: 'Inertia Lighting | User Notes',
                    },
                    description: 'An error occurred while removing a note for the user.',
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
                    name: 'Inertia Lighting | User Notes',
                },
                description: 'Successfully removed a note from user.',
            }),
        ],
    }).catch(console.warn);
}

async function manageNotesPurgeSubCommandHandler(
    interaction: Discord.ChatInputCommandInteraction,
) {
    if (!interaction.inCachedGuild()) return;
    if (!interaction.isChatInputCommand()) return;

    const user = interaction.options.getUser('user', true);

    const successfully_purged_notes = await purgeNotesFromUser({ discord_user_id: user.id });

    if (!successfully_purged_notes) {
        await interaction.editReply({
            embeds: [
                CustomEmbed.from({
                    color: CustomEmbed.Color.Red,
                    author: {
                        icon_url: `${interaction.client.user.displayAvatarURL({ forceStatic: false })}`,
                        name: 'Inertia Lighting | User Notes',
                    },
                    description: `An error occurred while removing all notes from ${Discord.userMention(user.id)}.`,
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
                    name: 'Inertia Lighting | User Notes',
                },
                description: `Successfully removed all notes from ${Discord.userMention(user.id)}.`,
            }),
        ],
    }).catch(console.warn);
}

//------------------------------------------------------------//

export default new CustomInteraction({
    identifier: 'manage_user_notes',
    type: Discord.InteractionType.ApplicationCommand,
    data: {
        type: Discord.ApplicationCommandType.ChatInput,
        description: 'Used by staff to manage user notes.',
        options: [
            {
                type: Discord.ApplicationCommandOptionType.Subcommand,
                name: 'lookup',
                description: 'Lookup a note by id.',
                options: [
                    {
                        type: Discord.ApplicationCommandOptionType.String,
                        name: 'note_id',
                        description: 'The id of the note to lookup.',
                        minLength: 1,
                        maxLength: 64,
                        required: true,
                    },
                ],
            }, {
                type: Discord.ApplicationCommandOptionType.Subcommand,
                name: 'for',
                description: 'Find all notes for a user.',
                options: [
                    {
                        type: Discord.ApplicationCommandOptionType.User,
                        name: 'user',
                        description: 'The user to lookup notes for.',
                        required: true,
                    },
                ],
            }, {
                type: Discord.ApplicationCommandOptionType.Subcommand,
                name: 'add',
                description: 'Add a note to a user.',
                options: [
                    {
                        type: Discord.ApplicationCommandOptionType.User,
                        name: 'user',
                        description: 'The user to add a note to.',
                        required: true,
                    }, {
                        type: Discord.ApplicationCommandOptionType.String,
                        name: 'note',
                        description: 'The note to add to the user.',
                        minLength: 1,
                        maxLength: 1024,
                        required: true,
                    },
                ],
            }, {
                type: Discord.ApplicationCommandOptionType.Subcommand,
                name: 'edit',
                description: 'Edit a note for a user.',
                options: [
                    {
                        type: Discord.ApplicationCommandOptionType.String,
                        name: 'note_id',
                        description: 'The id of the note to edit.',
                        required: true,
                    }, {
                        type: Discord.ApplicationCommandOptionType.String,
                        name: 'note',
                        description: 'The new note to replace the old one with.',
                        minLength: 1,
                        maxLength: 1024,
                        required: true,
                    },
                ],
            }, {
                type: Discord.ApplicationCommandOptionType.Subcommand,
                name: 'remove',
                description: 'Remove a note from a user.',
                options: [
                    {
                        type: Discord.ApplicationCommandOptionType.String,
                        name: 'note_id',
                        description: 'The id of the note to remove.',
                        required: true,
                    },
                ],
            }, {
                type: Discord.ApplicationCommandOptionType.Subcommand,
                name: 'purge',
                description: 'Purge all notes for a user.',
                options: [
                    {
                        type: Discord.ApplicationCommandOptionType.User,
                        name: 'user',
                        description: 'The user to purge notes for.',
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
            case 'lookup': {
                await manageNotesLookupSubCommandHandler(interaction);

                break;
            }

            case 'for': {
                await manageNotesForSubCommandHandler(interaction);

                break;
            }

            case 'add': {
                await manageNotesAddSubCommandHandler(interaction);

                break;
            }

            case 'edit': {
                await manageNotesEditSubCommandHandler(interaction);

                break;
            }

            case 'remove': {
                await manageNotesRemoveSubCommandHandler(interaction);

                break;
            }

            case 'purge': {
                await manageNotesPurgeSubCommandHandler(interaction);

                break;
            }

            default: {
                throw new Error(`Unknown subcommand name: ${subcommand_name}`);
            }
        }
    },
});
