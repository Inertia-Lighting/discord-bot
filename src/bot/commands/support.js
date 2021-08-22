/* Copyright © Inertia Lighting | All Rights Reserved */

//---------------------------------------------------------------------------------------------------------------//

'use strict';

//---------------------------------------------------------------------------------------------------------------//

const fs = require('fs');
const path = require('path');
const moment = require('moment-timezone');

//---------------------------------------------------------------------------------------------------------------//

const { go_mongo_db } = require('../../mongo/mongo.js');
const { Timer } = require('../../utilities.js');

const { Discord, client } = require('../discord_client.js');

const { command_permission_levels } = require('../common/bot.js');

//---------------------------------------------------------------------------------------------------------------//

const bot_command_prefix = process.env.BOT_COMMAND_PREFIX;
const support_tickets_category_id = process.env.BOT_SUPPORT_TICKETS_CATEGORY_ID;
const support_tickets_transcripts_channel_id = process.env.BOT_SUPPORT_TICKETS_TRANSCRIPTS_CHANNEL_ID;

//---------------------------------------------------------------------------------------------------------------//

/**
 * @typedef {String} SupportCategoryId
 * @typedef {{
 *  id: SupportCategoryId,
 *  human_index: Number,
 *  name: String,
 *  description: String,
 *  qualified_support_role_ids: Discord.Snowflake[],
 *  automatically_save_when_closed: Boolean,
 *  instructions_message_options: Discord.MessageOptions,
 * }} SupportCategory
 * @typedef {Discord.Collection<SupportCategoryId, SupportCategory>} SupportCategories
 */

const support_categories = new Discord.Collection([
    // {
    //     id: 'PARTNER_REQUESTS',
    //     name: 'Partner Requests',
    //     description: 'Come here if you want to request a partnership with Inertia Lighting.',
    //     qualified_support_role_ids: [
    //         process.env.BOT_SUPPORT_STAFF_PARTNER_REQUESTS_ROLE_ID,
    //     ],
    //     automatically_save_when_closed: true,
    //     instructions_message_options: {
    //         embeds: [
    //             new Discord.MessageEmbed({
    //                 color: 0x60A0FF,
    //                 author: {
    //                     iconURL: `${client.user.displayAvatarURL({ dynamic: true })}`,
    //                     name: 'Inertia Lighting | Support Ticket Instructions',
    //                 },
    //                 title: 'Please fill out our partner request form.',
    //                 description: [
    //                     '[Inertia Lighting Partner Request Form](https://inertia.lighting/partner-requests-form)',
    //                     '',
    //                     '**If you don\'t fill out the template properly, your ticket will be ignored!**',
    //                 ].join('\n'),
    //             }),
    //         ],
    //     },
    // },
    {
        id: 'PRODUCT_TRANSFERS',
        name: 'Product Transfers',
        description: 'Come here if you want to transfer any of your products to another account.',
        qualified_support_role_ids: [
            process.env.BOT_SUPPORT_STAFF_PRODUCT_TRANSFERS_ROLE_ID,
        ],
        automatically_save_when_closed: true,
        instructions_message_options: {
            embeds: [
                new Discord.MessageEmbed({
                    color: 0x60A0FF,
                    author: {
                        iconURL: `${client.user.displayAvatarURL({ dynamic: true })}`,
                        name: 'Inertia Lighting | Support Ticket Instructions',
                    },
                    description: [
                        '**Please fill out this template so that our staff can assist you.**',
                        '- **Product(s):** ( C-Lights, Magic Panels, etc )',
                        '- **Reason:** ( new account | gift for someone | other )',
                        '- **New Roblox Account:** ( copy the URL of the profile page for the account | n/a )',
                        '- **New Discord Account:** ( @mention the account | n/a )',
                        '',
                        '**If you don\'t fill out the template properly, your ticket will be ignored!**',
                    ].join('\n'),
                }),
            ],
        },
    }, {
        id: 'PRODUCT_PURCHASES',
        name: 'Purchases',
        description: 'Come here if you are having issues with making a purchase.',
        qualified_support_role_ids: [
            process.env.BOT_SUPPORT_STAFF_PRODUCT_PURCHASES_ROLE_ID,
        ],
        automatically_save_when_closed: false,
        instructions_message_options: {
            embeds: [
                new Discord.MessageEmbed({
                    color: 0x60A0FF,
                    author: {
                        iconURL: `${client.user.displayAvatarURL({ dynamic: true })}`,
                        name: 'Inertia Lighting | Support Ticket Instructions',
                    },
                    description: [
                        '**Please fill out this template so that our staff can assist you.**',
                        '- **Product(s):** ( C-Lights, Magic Panels, etc )',
                        '- **Purchase Date(s):** ( 1970-01-01 )',
                        '- **Proof Of Purchase(s):** ( screenshot [your transactions](https://www.roblox.com/transactions) )',
                        '- **Issue:** ( describe your issue )',
                        '',
                        '**If you don\'t fill out the template properly, your ticket will be ignored!**',
                    ].join('\n'),
                }),
            ],
        },
    }, {
        id: 'PRODUCT_ISSUES',
        name: 'Product Issues',
        description: 'Come here if you are having issues with our products.',
        qualified_support_role_ids: [
            process.env.BOT_SUPPORT_STAFF_PRODUCT_ISSUES_ROLE_ID,
        ],
        automatically_save_when_closed: false,
        instructions_message_options: {
            embeds: [
                new Discord.MessageEmbed({
                    color: 0x60A0FF,
                    author: {
                        iconURL: `${client.user.displayAvatarURL({ dynamic: true })}`,
                        name: 'Inertia Lighting | Support Ticket Instructions',
                    },
                    description: [
                        '**Please fill out this template so that our staff can assist you.**',
                        '- **Product(s):** ( C-Lights, Magic Panels, etc )',
                        '- **Read Setup Guide:** ( yes | maybe | no )',
                        '- **Game Is Published:** ( yes | idk |  no )',
                        '- **HTTPS Enabled In Game:** ( yes | idk | no )',
                        '- **Roblox Studio Output:** ( screenshot your [studio output](https://prnt.sc/y6hnau) )',
                        '- **Issue:** ( describe your issue )',
                        '',
                        '**If you don\'t fill out the template properly, your ticket will be ignored!**',
                    ].join('\n'),
                }),
            ],
        },
    }, {
        id: 'PRODUCT_QUESTIONS',
        name: 'Product Questions',
        description: 'Come here if you have questions about our products.',
        qualified_support_role_ids: [
            process.env.BOT_SUPPORT_STAFF_PRODUCT_QUESTIONS_ROLE_ID,
        ],
        automatically_save_when_closed: false,
        instructions_message_options: {
            embeds: [
                new Discord.MessageEmbed({
                    color: 0x60A0FF,
                    author: {
                        iconURL: `${client.user.displayAvatarURL({ dynamic: true })}`,
                        name: 'Inertia Lighting | Support Ticket Instructions',
                    },
                    description: [
                        '**Please fill out this template so that our staff can assist you.**',
                        '- **Product(s):** ( C-Lights, Magic Panels, etc )',
                        '- **Question:** ( what\'s your question? )',
                        '',
                        '**If you don\'t fill out the template properly, your ticket will be ignored!**',
                    ].join('\n'),
                }),
            ],
        },
    }, {
        id: 'OTHER',
        name: 'Other',
        description: 'Come here if none of the other categories match your issue.',
        qualified_support_role_ids: [
            process.env.BOT_SUPPORT_STAFF_OTHER_ROLE_ID,
        ],
        automatically_save_when_closed: false,
        instructions_message_options: {
            embeds: [
                new Discord.MessageEmbed({
                    color: 0x60A0FF,
                    author: {
                        iconURL: `${client.user.displayAvatarURL({ dynamic: true })}`,
                        name: 'Inertia Lighting | Support Ticket Instructions',
                    },
                    title: 'Please describe your issue / why you opened this ticket.',
                }),
            ],
        },
    },
].map((item, index) => {
    const updated_item = { ...item, human_index: index + 1 };
    return [ item.id, updated_item ]; // map entry
}));

//---------------------------------------------------------------------------------------------------------------//

/**
 * Creates a support ticket channel
 * @param {Discord.Guild} guild
 * @param {Discord.GuildMember} guild_member
 * @param {SupportCategory} support_category
 * @returns {Promise<Discord.TextChannel>}
 */
async function createSupportTicketChannel(guild, guild_member, support_category) {
    const support_tickets_category = guild.channels.resolve(support_tickets_category_id);

    if (!support_tickets_category) throw new Error('Can\'t find the support ticket category!');

    const support_channel_name = `${support_category.id}-${guild_member.id}`.toLowerCase();

    const potential_open_ticket_channel = guild.channels.cache.find(channel => channel.parentID === support_tickets_category.id && channel.name === support_channel_name);
    if (potential_open_ticket_channel) throw new Error('A support ticket channel is already open!');

    const support_ticket_channel = await guild.channels.create(support_channel_name, {
        type: 'text',
        topic: `${guild_member} | ${support_category.name} | Opened on ${moment().format('ddd MMM DD YYYY [at] HH:mm:ss [GMT]ZZ')} | Staff may close this using \`${bot_command_prefix}close_ticket\``,
        parent: support_tickets_category,
        permissionOverwrites: [
            ...support_tickets_category.permissionOverwrites.cache.values(), // clone the parent channel permissions
            {
                id: process.env.BOT_STAFF_ROLE_ID,
                allow: [ 'VIEW_CHANNEL' ],
                deny: [ 'SEND_MESSAGES' ], // staff must wait for the user to active the support ticket
            }, {
                id: guild_member.id,
                allow: [ 'VIEW_CHANNEL', 'SEND_MESSAGES' ],
            },
        ],
    });

    return support_ticket_channel;
}

/**
 * Closes a support ticket channel
 * @param {Discord.TextChannel} support_channel
 * @param {Boolean} save_transcript
 * @returns {Promise<Discord.TextChannel>}
 */
async function closeSupportTicketChannel(support_channel, save_transcript) {
    if (save_transcript) {
        const support_ticket_topic_name = support_channel.name.match(/([a-zA-Z\-\_])+(?![\-\_])\D/i)?.[0];
        const support_ticket_owner_id = support_channel.name.match(/(?!.*\-)?([0-9])+/i)?.[0];

        const all_messages_in_channel = await support_channel.messages.fetch({ limit: 100 }); // 100 is the max
        const all_messages_in_channel_processed = Array.from(all_messages_in_channel.values()).reverse();

        const all_channel_participants = Array.from(new Set(all_messages_in_channel_processed.map(msg => msg.author.id)));

        const temp_file_path = path.join(process.cwd(), 'temporary', `transcript_${support_channel.name}.json`);
        fs.writeFileSync(temp_file_path, JSON.stringify(all_messages_in_channel_processed, null, 2), { flag: 'w' });

        const temp_file_read_stream = fs.createReadStream(temp_file_path);
        const message_attachment = new Discord.MessageAttachment(temp_file_read_stream);

        const support_ticket_transcripts_channel = client.channels.resolve(support_tickets_transcripts_channel_id);
        await support_ticket_transcripts_channel.send({
            embeds: [
                new Discord.MessageEmbed({
                    color: 0x60A0FF,
                    author: {
                        iconURL: `${client.user.displayAvatarURL({ dynamic: true })}`,
                        name: 'Inertia Lighting | Support Ticket Transcripts System',
                    },
                    fields: [
                        {
                            name: 'Ticket Id',
                            value: `${'```'}\n${support_channel.name}\n${'```'}`,
                            inline: false,
                        }, {
                            name: 'Topic',
                            value: `${'```'}\n${support_ticket_topic_name}\n${'```'}`,
                            inline: false,
                        }, {
                            name: 'Creation Date',
                            value: `${'```'}\n${moment(support_channel.createdTimestamp).tz('America/New_York').format('YYYY[-]MM[-]DD hh:mm A [GMT]ZZ')}\n${'```'}`,
                            inline: false,
                        }, {
                            name: 'User',
                            value: `<@!${support_ticket_owner_id}>\n`,
                            inline: false,
                        }, {
                            name: 'Participants',
                            value: `${all_channel_participants.map(user_id => `<@!${user_id}>`).join(' - ')}`,
                            inline: false,
                        },
                    ],
                }),
            ],
            files: [
                message_attachment,
            ],
        }).catch(console.warn);

        fs.unlinkSync(temp_file_path);
    }

    await Timer(5000); // wait 5 seconds before deleting the channel

    await support_channel.delete().catch(console.warn);

    return support_channel;
}

/**
 * Sends the database documents to the support ticket channel
 * @param {Discord.TextChannel} support_channel
 * @param {Discord.GuildMember} guild_member
 * @returns {Promise<void>}
 */
async function sendDatabaseDocumentsToSupportTicketChannel(support_channel, guild_member) {
    /* send the user document */
    const [ db_user_data ] = await go_mongo_db.find(process.env.MONGO_DATABASE_NAME, process.env.MONGO_USERS_COLLECTION_NAME, {
        'identity.discord_user_id': guild_member.user.id,
    }, {
        projection: {
            '_id': false,
        },
    });
    await support_channel.send({
        content: 'This embed is for our support staff.',
        embeds: [
            new Discord.MessageEmbed({
                color: 0x60A0FF,
                author: {
                    iconURL: `${client.user.displayAvatarURL({ dynamic: true })}`,
                    name: 'Inertia Lighting | User Document',
                },
                description: `${'```'}json\n${JSON.stringify(db_user_data ?? 'user not found in database', null, 2)}\n${'```'}`,
            }),
        ],
    }).catch(console.warn);

    /* send the blacklisted user document */
    const [ blacklisted_user_db_data ] = await go_mongo_db.find(process.env.MONGO_DATABASE_NAME, process.env.MONGO_BLACKLISTED_USERS_COLLECTION_NAME, {
        'identity.discord_user_id': guild_member.user.id,
    }, {
        projection: {
            '_id': false,
        },
    });
    await support_channel.send({
        content: 'This embed is for our support staff.',
        embeds: [
            new Discord.MessageEmbed({
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
            }),
        ],
    }).catch(console.warn);

    return; // complete async
}

//---------------------------------------------------------------------------------------------------------------//

const active_category_selection_message_collectors = new Discord.Collection();

//---------------------------------------------------------------------------------------------------------------//

module.exports = {
    name: 'support',
    description: 'support tickets and stuff',
    aliases: ['support', 'close_ticket'],
    permission_level: command_permission_levels.PUBLIC,
    cooldown: 10_000,
    async execute(message, args) {
        const { user_permission_level, command_name } = args;

        async function supportTicketCommand() {
            if (active_category_selection_message_collectors.has(message.author.id)) {
                return; // don't allow multiple category_selection_message_collector to exist
            }

            /** @type {Discord.Message} */
            const category_selection_message = await message.channel.send({
                content: `${message.author}`,
                embeds: [
                    new Discord.MessageEmbed({
                        color: 0x60A0FF,
                        author: {
                            iconURL: `${client.user.displayAvatarURL({ dynamic: true })}`,
                            name: 'Inertia Lighting | Support System',
                        },
                        description: [
                            '**How can I help you today?**',
                            support_categories.map(({ human_index, name, description }) => `**${human_index} | ${name}**\n${description}`).join('\n\n'),
                            '**Please type the __category number__ or \`cancel\`.**',
                            '*Picking the wrong category will result in longer wait times!*',
                        ].join('\n\n'),
                    }),
                ],
            }).catch(console.warn);

            const category_selection_message_collector_filter = (msg) => msg.author.id === message.author.id;
            const category_selection_message_collector = category_selection_message.channel.createMessageCollector({
                filter: category_selection_message_collector_filter,
            });
            category_selection_message_collector.on('collect', async (collected_category_selection_message) => {
                const matching_support_category = support_categories.find((support_category) => `${support_category.human_index}` === collected_category_selection_message.content);
                if (matching_support_category) {
                    category_selection_message_collector.stop();

                    await Timer(250); // delay the message deletion
                    await category_selection_message.delete().catch(console.warn);

                    let support_channel;
                    try {
                        support_channel = await createSupportTicketChannel(message.guild, message.member, matching_support_category);
                    } catch {
                        return; // don't continue if we can't create a new support ticket channel
                    }

                    /* respond to the user with a mention for the support ticket channel */
                    await collected_category_selection_message.reply([
                        `You selected ${matching_support_category.name}!`,
                        `Go to ${support_channel} to continue.`,
                    ].join('\n')).catch(console.warn);

                    /* ping the user to let them know where to go */
                    await support_channel.send({
                        content: `${message.author}, welcome to your support ticket!`,
                    }).catch(console.warn);

                    /* send the database documents */
                    await sendDatabaseDocumentsToSupportTicketChannel(support_channel, message.member);

                    /* send the category-specific instructions */
                    const category_instructions_message = await support_channel.send({
                        ...matching_support_category.instructions_message_options,
                        content: `${message.author} please read this message!`,
                    }).catch(console.warn);

                    const category_instructions_options_message = await support_channel.send({
                        content: `${message.author}`,
                        embeds: [
                            new Discord.MessageEmbed({
                                color: 0x60A0FF,
                                description: [
                                    `**Send \`done\` after you have completed the [instructions](${category_instructions_message.url}).**`,
                                    '**Send \`cancel\` if you wish to cancel this ticket.**',
                                    '',
                                    '*Sending neither will result in your ticket automatically closing after 30 minutes.*',
                                ].join('\n'),
                            }),
                        ],
                    }).catch(console.warn);

                    const category_instructions_options_message_collector_filter = (msg) => msg.author.id === message.author.id;
                    const category_instructions_options_message_collector = support_channel.createMessageCollector({
                        filter: category_instructions_options_message_collector_filter,
                        time: 30 * 60_000, // force the message collector to stop after 30 minutes
                    });
                    category_instructions_options_message_collector.on('collect', async (collected_options_message) => {
                        async function cleanupCategoryInstructionsOptionsMessageCollector() {
                            category_instructions_options_message_collector.stop();
                            await Timer(500); // delay the message deletion
                            await category_instructions_options_message.delete().catch(console.warn);
                            await Timer(500); // delay the message deletion
                            await collected_options_message.delete().catch(console.warn);
                        }
                        switch (collected_options_message.content.toLowerCase()) {
                            case 'done': {
                                await cleanupCategoryInstructionsOptionsMessageCollector();

                                /* allow staff to interact in the support ticket */
                                await support_channel.permissionOverwrites.set([
                                    ...support_channel.permissionOverwrites.cache.values(), // clone the channel's current permissions
                                    {
                                        id: process.env.BOT_STAFF_ROLE_ID,
                                        allow: [ 'VIEW_CHANNEL', 'SEND_MESSAGES' ],
                                    },
                                ]).catch(console.trace);

                                const qualified_support_role_mentions = matching_support_category.qualified_support_role_ids.map(role_id => `<@&${role_id}>`).join(', ');
                                await support_channel.send({
                                    content: `${message.author}, Our ${qualified_support_role_mentions} staff will help you with your issue soon!`,
                                }).catch(console.warn);

                                break;
                            }
                            case 'cancel': {
                                await cleanupCategoryInstructionsOptionsMessageCollector();
                                await support_channel.send({
                                    content: `${message.author}, Cancelling support ticket...`,
                                }).catch(console.warn);
                                await closeSupportTicketChannel(support_channel, false);

                                break;
                            }
                            default: {
                                // we want to ignore all other messages that are sent
                                break;
                            }
                        }
                    });
                    category_instructions_options_message_collector.on('end', async (collected_messages, reason) => {
                        /* the following is used to denote when a message collector has exceeded our specified time */
                        if (reason === 'time') {
                            await closeSupportTicketChannel(support_channel, false);
                        }
                    });
                } else if (['cancel'].includes(collected_category_selection_message.content.toLowerCase())) {
                    category_selection_message_collector.stop();
                    await Timer(500); // delay the message deletion
                    await category_selection_message.delete().catch(console.warn);
                    await collected_category_selection_message.reply({
                        content: 'Canceled!',
                    }).catch(console.warn);
                } else {
                    await collected_category_selection_message.reply({
                        content: 'Please type the __category number__ or \`cancel\`.',
                    }).catch(console.warn);
                }
            });
            category_selection_message_collector.on('end', () => {
                active_category_selection_message_collectors.delete(message.author.id);
            });
            active_category_selection_message_collectors.set(message.author.id, category_selection_message_collector);

            /* automatically cancel the category selection collector */
            setTimeout(() => {
                category_selection_message.delete().catch(console.warn);
                category_selection_message_collector.stop();
            }, 5 * 60_000); // 5 minutes
        }

        async function closeTicketCommand() {
            if (user_permission_level < command_permission_levels.STAFF) {
                message.reply({
                    content: 'Sorry, only staff can close active support tickets.',
                }).catch(console.warn);
                return;
            }

            const channel_exists_in_support_tickets_category = message.channel.parentId === support_tickets_category_id;
            const channel_is_not_transcripts_channel = message.channel.id !== support_tickets_transcripts_channel_id;
            if (!(channel_exists_in_support_tickets_category && channel_is_not_transcripts_channel)) {
                message.reply({
                    content: 'This channel is not a support ticket.',
                }).catch(console.warn);
                return;
            }

            const support_channel = message.channel;
            const support_ticket_topic_name = support_channel.name.match(/([a-zA-Z\-\_])+(?![\-\_])\D/i)?.[0];
            const support_category = support_categories.find(support_category => support_category.id === support_ticket_topic_name.toUpperCase());

            let save_transcript = true;
            if (!support_category?.automatically_save_when_closed) {
                await message.reply({
                    content: 'Would you like to save the transcript for this support ticket before closing it?\n**( yes | no )**',
                }).catch(console.warn);

                const collection_filter = (msg) => msg.author.id === message.author.id && ['yes', 'no'].includes(msg.content.toLowerCase());
                const collected_messages = await support_channel.awaitMessages({
                    filter: collection_filter,
                    max: 1,
                }).catch(collected_messages => collected_messages);

                const first_collected_message_content = collected_messages.first()?.content;
                const formatted_first_collected_message_content = first_collected_message_content?.toLowerCase();

                save_transcript = ['yes'].includes(formatted_first_collected_message_content);
            }

            await support_channel.send({
                content: `${message.author}, Closing support ticket in 5 seconds...`,
            }).catch(console.warn);

            await closeSupportTicketChannel(support_channel, save_transcript);
        }

        switch (command_name) {
            case 'support': {
                await supportTicketCommand();
                break;
            }
            case 'close_ticket': {
                await closeTicketCommand();
                break;
            }
            default: {
                break;
            }
        }
    },
};
