//------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
//------------------------------------------------------------//

//---------------------------------------------------------------------------------------------------------------//

import { command_permission_levels } from '../common/bot';

import { Discord, client } from '../discord_client';

import { Timer, array_chunks, string_ellipses } from '../../utilities';

import { UserNote, createNoteForUser, lookupNoteForUser, lookupNotesForUser, purgeNotesFromUser, removeNoteFromUser, updateNoteForUser } from '../handlers/user_notes_handler';

//---------------------------------------------------------------------------------------------------------------//

/**
 * Create note subcommand
 */
async function createNoteCommand(message: Discord.Message) {
    const sub_command_args = message.content.split(/\s+/g).slice(2);

    const lookup_query = (sub_command_args[0] ?? '').replace(/[^\d\w\-]/g, '');

    try {
        await client.users.fetch(lookup_query);
    } catch {
        message.reply({
            embeds: [
                new Discord.MessageEmbed({
                    color: 0xFFFF00,
                    author: {
                        iconURL: `${client.user!.displayAvatarURL({ dynamic: true })}`,
                        name: 'Inertia Lighting | User Notes',
                    },
                    description: `\"${lookup_query}\" is not a valid user...`,
                }),
            ],
        }).catch(console.warn);

        return;
    }

    const note_contents = sub_command_args.slice(1).join(' ');
    if (note_contents.length < 5) {
        message.reply({
            embeds: [
                new Discord.MessageEmbed({
                    color: 0xFFFF00,
                    author: {
                        iconURL: `${client.user!.displayAvatarURL({ dynamic: true })}`,
                        name: 'Inertia Lighting | User Notes',
                    },
                    description: 'The supplied note was less then 5 characters, please be more descriptive next time.',
                }),
            ],
        }).catch(console.warn);
        return;
    }

    const note_was_created_successfully = await createNoteForUser({
        discord_user_id: lookup_query,
    }, {
        epoch: Date.now(),
        note: note_contents,
        staff_member_id: message.author.id,
    });

    if (!note_was_created_successfully) {
        message.reply({
            embeds: [
                new Discord.MessageEmbed({
                    color: 0xFF0000,
                    author: {
                        iconURL: `${client.user!.displayAvatarURL({ dynamic: true })}`,
                        name: 'Inertia Lighting | User Notes',
                    },
                    description: 'An error occurred while creating a note for the user.',
                }),
            ],
        }).catch(console.warn);
        return;
    }

    message.reply({
        embeds: [
            new Discord.MessageEmbed({
                color: 0x00FF00,
                author: {
                    iconURL: `${client.user!.displayAvatarURL({ dynamic: true })}`,
                    name: 'Inertia Lighting | User Notes',
                },
                description: 'Successfully created note for user.',
            }),
        ],
    }).catch(console.warn);
}

/**
 * Update note subcommand
 */
async function updateNoteCommand(message: Discord.Message) {
    const sub_command_args = message.content.split(/\s+/g).slice(2);

    const lookup_query = (sub_command_args[0] ?? '').replace(/[^\d\w\-]/g, '');
    if (lookup_query.length === 0) {
        message.reply({
            embeds: [
                new Discord.MessageEmbed({
                    color: 0xFFFF00,
                    author: {
                        iconURL: `${client.user!.displayAvatarURL({ dynamic: true })}`,
                        name: 'Inertia Lighting | User Notes',
                    },
                    description: 'You need to specify a note id when using this command.',
                }),
            ],
        }).catch(console.warn);
        return;
    }

    const note_in_database = await lookupNoteForUser({
        id: lookup_query,
    });

    if (!note_in_database) {
        message.reply({
            embeds: [
                new Discord.MessageEmbed({
                    color: 0xFFFF00,
                    author: {
                        iconURL: `${client.user!.displayAvatarURL({ dynamic: true })}`,
                        name: 'Inertia Lighting | User Notes',
                    },
                    description: 'Unable to find specified note id in the database!',
                }),
            ],
        }).catch(console.warn);
        return;
    }

    const note_contents = sub_command_args.slice(1).join(' ');
    if (note_contents.length < 5) {
        message.reply({
            embeds: [
                new Discord.MessageEmbed({
                    color: 0xFFFF00,
                    author: {
                        iconURL: `${client.user!.displayAvatarURL({ dynamic: true })}`,
                        name: 'Inertia Lighting | User Notes',
                    },
                    description: 'The supplied note was less then 5 characters, please be more descriptive next time.',
                }),
            ],
        }).catch(console.warn);
        return;
    }

    const successfully_updated_note = await updateNoteForUser({
        id: note_in_database.record.id,
        epoch: Date.now(),
        note: note_contents,
        staff_member_id: message.author.id,
    });

    if (!successfully_updated_note) {
        message.reply({
            embeds: [
                new Discord.MessageEmbed({
                    color: 0xFF0000,
                    author: {
                        iconURL: `${client.user!.displayAvatarURL({ dynamic: true })}`,
                        name: 'Inertia Lighting | User Notes',
                    },
                    description: 'An error occurred while updating a note for the user.',
                }),
            ],
        }).catch(console.warn);
        return;
    }
    message.reply({
        embeds: [
            new Discord.MessageEmbed({
                color: 0x00FF00,
                author: {
                    iconURL: `${client.user!.displayAvatarURL({ dynamic: true })}`,
                    name: 'Inertia Lighting | User Notes',
                },
                description: 'Successfully updated note for user.',
            }),
        ],
    }).catch(console.warn);
}

/**
 * Remove note subcommand
 */
async function removeNoteCommand(message: Discord.Message) {
    const sub_command_args = message.content.split(/\s+/g).slice(2);

    const lookup_query = (sub_command_args[0] ?? '').replace(/[^\d\w\-]/g, '');
    if (lookup_query.length === 0) {
        message.reply({
            embeds: [
                new Discord.MessageEmbed({
                    color: 0xFFFF00,
                    author: {
                        iconURL: `${client.user!.displayAvatarURL({ dynamic: true })}`,
                        name: 'Inertia Lighting | User Notes',
                    },
                    description: 'You need to specify a note id when using this command.',
                }),
            ],
        }).catch(console.warn);
        return;
    }

    const note_in_database = await lookupNoteForUser({
        id: lookup_query,
    });

    if (!note_in_database) {
        message.reply({
            embeds: [
                new Discord.MessageEmbed({
                    color: 0xFFFF00,
                    author: {
                        iconURL: `${client.user!.displayAvatarURL({ dynamic: true })}`,
                        name: 'Inertia Lighting | User Notes',
                    },
                    description: 'That note ID was not found in the database!',
                }),
            ],
        }).catch(console.warn);
        return;
    }

    const successfully_removed_note = await removeNoteFromUser({ id: note_in_database.record.id });

    if (!successfully_removed_note) {
        message.reply({
            embeds: [
                new Discord.MessageEmbed({
                    color: 0xFF0000,
                    author: {
                        iconURL: `${client.user!.displayAvatarURL({ dynamic: true })}`,
                        name: 'Inertia Lighting | User Notes',
                    },
                    description: 'An error occurred while removing a note for the user.',
                }),
            ],
        }).catch(console.warn);
        return;
    }

    message.reply({
        embeds: [
            new Discord.MessageEmbed({
                color: 0x00FF00,
                author: {
                    iconURL: `${client.user!.displayAvatarURL({ dynamic: true })}`,
                    name: 'Inertia Lighting | User Notes',
                },
                description: 'Successfully removed a note from user.',
            }),
        ],
    }).catch(console.warn);
}

/**
 * Purge notes subcommand
 */
async function purgeNotesCommand(message: Discord.Message) {
    const sub_command_args = message.content.split(/\s+/g).slice(2);

    const lookup_query = (sub_command_args[0] ?? '').replace(/[^\d\w\-]/g, '');

    try {
        await client.users.fetch(lookup_query);
    } catch {
        message.reply({
            embeds: [
                new Discord.MessageEmbed({
                    color: 0xFFFF00,
                    author: {
                        iconURL: `${client.user!.displayAvatarURL({ dynamic: true })}`,
                        name: 'Inertia Lighting | User Notes',
                    },
                    description: `\"${lookup_query}\" is not a valid user...`,
                }),
            ],
        }).catch(console.warn);

        return;
    }

    const successfully_purged_notes = await purgeNotesFromUser({ discord_user_id: lookup_query });

    if (!successfully_purged_notes) {
        message.reply({
            embeds: [
                new Discord.MessageEmbed({
                    color: 0xFF0000,
                    author: {
                        iconURL: `${client.user!.displayAvatarURL({ dynamic: true })}`,
                        name: 'Inertia Lighting | User Notes',
                    },
                    description: `An error occurred while removing all notes from <@${lookup_query}>.`,
                }),
            ],
        }).catch(console.warn);
        return;
    }

    message.reply({
        embeds: [
            new Discord.MessageEmbed({
                color: 0x00FF00,
                author: {
                    iconURL: `${client.user!.displayAvatarURL({ dynamic: true })}`,
                    name: 'Inertia Lighting | User Notes',
                },
                description: `Successfully removed all notes from <@${lookup_query}>.`,
            }),
        ],
    }).catch(console.warn);
}

/**
 * Lookup notes subcommand
 */
async function lookupNotesCommand(message: Discord.Message, lookup_method: 'user_mention' | 'note_id') {
    const sub_command_args = message.content.split(/\s+/g).slice(2);

    const lookup_query = (sub_command_args[0] ?? '').replace(/[^\d\w\-]/g, '');

    if (lookup_method === 'user_mention') {
        try {
            await client.users.fetch(lookup_query);
        } catch {
            message.reply({
                embeds: [
                    new Discord.MessageEmbed({
                        color: 0xFFFF00,
                        author: {
                            iconURL: `${client.user!.displayAvatarURL({ dynamic: true })}`,
                            name: 'Inertia Lighting | User Notes',
                        },
                        description: `\"${lookup_query}\" was not a valid user id.`,
                    }),
                ],
            }).catch(console.warn);

            return;
        }
    }

    const bot_message = await message.reply({
        embeds: [
            new Discord.MessageEmbed({
                color: 0x60A0FF,
                description: 'Loading user notes...',
            }),
        ],
    });

    /* create a small user-experience delay */
    await Timer(500);

    const user_notes = lookup_method === 'user_mention' ? (
        await lookupNotesForUser({
            discord_user_id: lookup_query,
        })
    ) : (
        [
            await lookupNoteForUser({
                id: lookup_query,
            }),
        ]
    ) as UserNote[];

    if (user_notes.length === 0 || (lookup_method === 'note_id' && message.mentions.users.size > 0)) {
        await bot_message.edit({
            embeds: [
                new Discord.MessageEmbed({
                    color: 0xFFFF00,
                    author: {
                        iconURL: `${client.user!.displayAvatarURL({ dynamic: true })}`,
                        name: 'Inertia Lighting | User Notes',
                    },
                    description: 'I wasn\'t able to find any user notes for the specified query!',
                }),
            ],
        }).catch(console.warn);

        return;
    }

    const sorted_user_notes = user_notes.sort((a, b) => b.record.epoch - a.record.epoch);
    const user_notes_chunks = array_chunks(sorted_user_notes, 5);

    if (user_notes_chunks.length > 1) {
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
    }

    let page_index = 0;

    async function editEmbedWithNextUserNotesChunk() {
        const user_notes_chunk = user_notes_chunks[page_index];

        await bot_message.edit({
            embeds: [
                new Discord.MessageEmbed({
                    color: 0x60A0FF,
                    author: {
                        iconURL: `${client.user!.displayAvatarURL({ dynamic: true })}`,
                        name: 'Inertia Lighting | User Notes',
                    },
                    description: user_notes_chunk.map(user_note =>
                        [
                            `**Id** \`${user_note.record.id}\``,
                            `**Staff** <@${user_note.record.staff_member_id}>`,
                            `**Member** <@${user_note.identity.discord_user_id}>`,
                            `**Date** <t:${`${user_note.record.epoch}`.slice(0, -3)}:f>`,
                            '**Content**',
                            '\`\`\`',
                            `${string_ellipses(Discord.escapeMarkdown(user_note.record.note), 250)}`,
                            '\`\`\`',
                        ].join('\n')
                    ).join('\n'),
                }),
            ],
        }).catch(console.warn);

        return; // complete async
    }

    await editEmbedWithNextUserNotesChunk();

    const message_button_collector_filter = (button_interaction: Discord.MessageComponentInteraction) => button_interaction.user.id === message.author.id;
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

//---------------------------------------------------------------------------------------------------------------//

export default {
    name: 'notes',
    description: 'N/A',
    aliases: ['notes'],
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

        const subcommand_name = `${command_args[0]}`.toLowerCase();

        switch (subcommand_name) {
            case 'create': {
                await createNoteCommand(message);

                break;
            }

            case 'update': {
                await updateNoteCommand(message);

                break;
            }

            case 'remove': {
                await removeNoteCommand(message);

                break;
            }

            case 'purge': {
                await purgeNotesCommand(message);

                break;
            }

            case 'for': {
                await lookupNotesCommand(message, 'user_mention');

                break;
            }

            case 'lookup': {
                await lookupNotesCommand(message, 'note_id');

                break;
            }

            default: {
                await message.reply({
                    embeds: [
                        new Discord.MessageEmbed({
                            color: 0x60A0FF,
                            author: {
                                iconURL: `${client.user!.displayAvatarURL({ dynamic: true })}`,
                                name: 'Inertia Lighting | User Notes',
                            },
                            title: 'Here are the available sub-commands!',
                            description: [
                                'Creates a note for a user.',
                                '\`\`\`',
                                `${command_prefix}${command_name} create <USER_MENTION> <CONTENT>`,
                                '\`\`\`',
                                'Updates a note.',
                                '\`\`\`',
                                `${command_prefix}${command_name} update <NOTE_ID> <CONTENT>`,
                                '\`\`\`',
                                'Removes a note.',
                                '\`\`\`',
                                `${command_prefix}${command_name} remove <NOTE_ID>`,
                                '\`\`\`',
                                'Removes all notes from a user.',
                                '\`\`\`',
                                `${command_prefix}${command_name} purge <USER_MENTION>`,
                                '\`\`\`',
                                'Displays all notes for a user',
                                '\`\`\`',
                                `${command_prefix}${command_name} for <USER_MENTION>`,
                                '\`\`\`',
                                'Displays a note.',
                                '\`\`\`',
                                `${command_prefix}${command_name} lookup <NOTE_ID>`,
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
