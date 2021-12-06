/* Copyright © Inertia Lighting | All Rights Reserved */

//---------------------------------------------------------------------------------------------------------------//

'use strict';

//---------------------------------------------------------------------------------------------------------------//

const fs = require('fs');
const path = require('path');
const moment = require('moment-timezone');

//---------------------------------------------------------------------------------------------------------------//

const { Timer } = require('../../utilities.js');

const { Discord, client } = require('../discord_client.js');

const { command_permission_levels } = require('../common/bot.js');

//---------------------------------------------------------------------------------------------------------------//

const bot_command_prefix = process.env.BOT_COMMAND_PREFIX;
const support_tickets_category_id = process.env.BOT_SUPPORT_TICKETS_CATEGORY_ID;
const support_tickets_transcripts_channel_id = process.env.BOT_SUPPORT_TICKETS_TRANSCRIPTS_CHANNEL_ID;

//---------------------------------------------------------------------------------------------------------------//

const display_database_documents_button = {
    type: 2,
    style: 2,
    custom_id: 'display_support_ticket_database_documents',
    label: 'Display database documents',
};

const ready_for_support_staff_button = {
    type: 2,
    style: 3,
    custom_id: 'ready_for_support_staff',
    label: 'I have completed the instructions',
};

const cancel_support_ticket_button = {
    type: 2,
    style: 4,
    custom_id: 'cancel_support_ticket',
    label: 'Cancel support ticket',
};

//---------------------------------------------------------------------------------------------------------------//

/**
 * @typedef {String} SupportCategoryId
 * @typedef {{
 *  id: SupportCategoryId,
 *  name: String,
 *  description: String,
 *  qualified_support_role_ids: Discord.Snowflake[],
 *  automatically_save_when_closed: Boolean,
 *  instructions_message_options: Discord.MessageOptions,
 * }} SupportCategory
 * @typedef {Discord.Collection<SupportCategoryId, SupportCategory>} SupportCategories
 */

const support_categories = new Discord.Collection([
    {
        id: 'ISSUES',
        name: 'Product Tech Support',
        description: 'Product technical support can be found here.',
        qualified_support_role_ids: [
            process.env.BOT_SUPPORT_STAFF_PRODUCT_ISSUES_ROLE_ID,
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
                        '**Fill out the template shown below.**',
                        '',
                        '\`(1)\` **Product(s):**',
                        '\`   \` What product(s) are you having issues with?',
                        '',
                        '\`(2)\` **Setup Guide:**',
                        '\`   \` Did you read the \`README\`?',
                        '\`   \` *( yes | kinda | maybe | no )*',
                        '',
                        '\`(3)\` **Studio Plugins:**',
                        '\`   \` Do you have any \"anti-virus\" plugins in Roblox Studio?',
                        '\`   \` *( yes | maybe | idk | no )*',
                        '',
                        '\`(4)\` **[Published Game](https://inertia.wtf/kvck4ln9y0a):**',
                        '\`   \` Did you publish your game using \`[ALT] + [P]\`?',
                        '\`   \` *( yes | idk | no )*',
                        '',
                        '\`(5)\` **[HTTP Requests Enabled](https://inertia.wtf/kvcihjnz10a):**',
                        '\`   \` Did you enable HTTP Requests in your game?',
                        '\`   \` *( yes | idk | no )*',
                        '',
                        '\`(6)\` **[Studio API Services Enabled](https://inertia.wtf/kvcihjnz10a):**',
                        '\`   \` Did you enable Studio Access to API Services in your game?',
                        '\`   \` *( yes | idk | no )*',
                        '',
                        '\`(7)\` **[Configured Identity Token](<https://discord.com/channels/601889649601806336/811341531784413235>):**',
                        '\`   \` Did you configure your Identity Token yet?',
                        '\`   \` *( yes | idk | no )*',
                        '',
                        '\`(8)\` **[Studio Output](https://inertia.wtf/ktudeh32f9a):**',
                        '\`   \` Screenshot your Roblox Studio output.',
                        '\`   \` Ensure that you are in \"Play Here\" mode.',
                        '\`   \` Send us everything in the output!',
                        '',
                        '\`(9)\` **Issue Encountered:**',
                        '\`   \` Fully describe the issue that you are encountering.',
                        '\`   \` Give us as much information as humanly possible!',
                        '',
                        '**Follow the instructions properly or your ticket will be ignored!**',
                        '*Once you are ready for staff, wait for a green button to appear.*',
                        '*The green button will automatically appear in a few minutes.*',
                    ].join('\n'),
                }),
            ],
        },
    }, {
        id: 'RECOVERY',
        name: 'Account Recovery',
        description: 'Recover products from an inaccessible account.',
        qualified_support_role_ids: [
            process.env.BOT_SUPPORT_STAFF_DATABASE_ROLE_ID,
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
                        '**Fill out the template shown below.**',
                        '',
                        '\`(1)\` **Old Roblox Account:**',
                        '\`   \` *( profile url | n/a )*',
                        '\`   \` Example: roblox.com/users/2010759283/profile',
                        '\`   \` Example: n/a',
                        '',
                        '\`(2)\` **Current Roblox Account:**',
                        '\`   \` *( profile url | n/a )*',
                        '\`   \` Example: roblox.com/users/2010759283/profile',
                        '',
                        '\`(3)\` **Old Discord Account:**',
                        '\`   \` *( @mention#0001 | discord id | n/a )*',
                        '\`   \` Example: @MidSpike#4322',
                        '\`   \` Example: 163646957783482370',
                        '\`   \` Example: n/a',
                        '',
                        '\`(4)\` **Current Discord Account:**',
                        '\`   \` *( @mention#0001 | discord id | n/a )*',
                        '\`   \` Example: @MidSpike#4322',
                        '\`   \` Example: 163646957783482370',
                        '',
                        '\`(5)\` **Explain What Happened:**',
                        '\`   \` Tell us what happened to your account in detail.',
                        '',
                        '**Follow the instructions properly or your ticket will be ignored!**',
                        '*Once you are ready for staff, wait for a green button to appear.*',
                        '*The green button will automatically appear in a few minutes.*',
                    ].join('\n'),
                }),
            ],
        },
    }, {
        id: 'TRANSFERS',
        name: 'Transfer Products',
        description: 'Transfer or gift products to a different account.',
        qualified_support_role_ids: [
            process.env.BOT_SUPPORT_STAFF_DATABASE_ROLE_ID,
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
                        '**Fill out the template shown below.**',
                        '',
                        '\`(1)\` **Product(s):**',
                        '\`   \` What product(s) do you wish to transfer?',
                        '',
                        '\`(2)\` **New Discord Account:**',
                        '\`   \` *( @mention#0001 | discord id | n/a )*',
                        '\`   \` Example: @MidSpike#4322',
                        '\`   \` Example: 163646957783482370',
                        '\`   \` Example: n/a',
                        '',
                        '\`(3)\` **New Roblox Account:**',
                        '\`   \` *( profile url | n/a )*',
                        '\`   \` Example: roblox.com/users/2010759283/profile',
                        '\`   \` Example: n/a',
                        '',
                        '\`(4)\` **Reason:**',
                        '\`   \` Why are you transferring your products?',
                        '\`   \` *( re-linking account | gifting products | other, please specify )*',
                        '',
                        '**Follow the instructions properly or your ticket will be ignored!**',
                        '*Once you are ready for staff, wait for a green button to appear.*',
                        '*The green button will automatically appear in a few minutes.*',
                    ].join('\n'),
                }),
            ],
        },
    }, {
        id: 'TRANSACTIONS',
        name: 'Transactions',
        description: 'Failed transactions or monetary issues with purchases.',
        qualified_support_role_ids: [
            process.env.BOT_SUPPORT_STAFF_PRODUCT_PURCHASES_ROLE_ID,
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
                        '**Fill out the template shown below.**',
                        '',
                        '\`(1)\` **Product(s):**',
                        '\`   \` What product(s) are involved?',
                        '',
                        '\`(2)\` **Purchase Date(s):**',
                        '\`   \` When did you attempt to make your purchase?',
                        '\`   \` *( 1970-01-01 )*',
                        '',
                        '\`(3)\` **[Proof Of Purchase](https://www.roblox.com/transactions):**',
                        '\`   \` Screenshot your roblox transactions or paypal receipt.',
                        '',
                        '\`(4)\` **Issue:**',
                        '\`   \` Fully describe the issue you are encountering.',
                        '',
                        '**Follow the instructions properly or your ticket will be ignored!**',
                        '*Once you are ready for staff, wait for a green button to appear.*',
                        '*The green button will automatically appear in a few minutes.*',
                    ].join('\n'),
                }),
            ],
        },
    }, {
        id: 'PARTNERS',
        name: 'Partner Requests',
        description: 'Apply to become a partner of Inertia Lighting.',
        qualified_support_role_ids: [
            process.env.BOT_SUPPORT_STAFF_PARTNER_REQUESTS_ROLE_ID,
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
                        '**Fill out the template shown below.**',
                        '',
                        '\`(1)\` **Group Name:**',
                        '\`   \` What is your group called?',
                        '\`   \` Example: Inertia Lighting (formerly: C-Tech Lighting)',
                        '',
                        '\`(2)\` **Owner:**',
                        '\`   \` *( discord account | roblox account | etc )*',
                        '\`   \` Example: <@!163646957783482370>, roblox.com/users/2010759283/profile',
                        '',
                        '\`(3)\` **Description:**',
                        '\`   \` Describe your group to us in detail.',
                        '',
                        '\`(4)\` **Member Count:**',
                        '\`   \` How many people are in your group?',
                        '',
                        '\`(5)\` **Social Links:**',
                        '\`   \` *( discord, roblox, website, etc )*',
                        '',
                        '\`(6)\` **Reasons:**',
                        '\`   \` Why do you want to partner with us?',
                        '\`   \` Why should we partner with you?',
                        '',
                        '**Follow the instructions properly or your ticket will be ignored!**',
                        '*Once you are ready for staff, wait for a green button to appear.*',
                        '*The green button will automatically appear in a few minutes.*',
                    ].join('\n'),
                }),
            ],
        },
    }, {
        id: 'OTHER',
        name: 'Other & Quick Questions',
        description: 'For all other forms of support.',
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
                    description: [
                        '**Tell us why you opened this ticket, and how we can help!**',
                        '*If you have a question, please explain the details.*',
                        '',
                        '**Follow the instructions properly or your ticket will be ignored!**',
                        '*Once you are ready for staff, wait for a green button to appear.*',
                        '*The green button will automatically appear in a few minutes.*',
                    ].join('\n'),
                }),
            ],
        },
    },
].map((item) => [ item.id, item ]));

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
 * @param {Discord.GuildMember?} member_that_closed_ticket
 * @param {Boolean} send_feedback_survey
 * @returns {Promise<Discord.TextChannel>}
 */
async function closeSupportTicketChannel(support_channel, save_transcript, member_that_closed_ticket, send_feedback_survey=false) {
    await support_channel.send({
        content: `${member_that_closed_ticket ? `${member_that_closed_ticket},` : 'automatically'} closing support ticket in 5 seconds...`,
    }).catch(console.warn);

    if (save_transcript && member_that_closed_ticket) {
        const support_ticket_topic_name = support_channel.name.match(/([a-zA-Z\-\_])+(?![\-\_])\D/i)?.[0];
        const support_ticket_owner_id = support_channel.name.match(/(?!.*\-)?([0-9])+/i)?.[0];

        const support_ticket_owner = await client.users.fetch(support_ticket_owner_id);

        const all_messages_in_channel = await support_channel.messages.fetch({ limit: 100 }); // 100 is the max
        const all_messages_in_channel_processed = Array.from(all_messages_in_channel.values()).reverse();

        const all_channel_participants = Array.from(new Set(all_messages_in_channel_processed.map(msg => msg.author.id)));

        const temp_file_path = path.join(process.cwd(), 'temporary', `transcript_${support_channel.name}.json`);
        fs.writeFileSync(temp_file_path, JSON.stringify(all_messages_in_channel_processed, null, 2), { flag: 'w' });

        const createTranscriptAttachment = () => {
            const temp_file_read_stream = fs.createReadStream(temp_file_path);
            return new Discord.MessageAttachment(temp_file_read_stream);
        };

        const transcript_embed = new Discord.MessageEmbed({
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
                    name: 'Creation Date',
                    value: `${'```'}\n${moment(support_channel.createdTimestamp).tz('America/New_York').format('YYYY[-]MM[-]DD hh:mm A [GMT]ZZ')}\n${'```'}`,
                    inline: false,
                }, {
                    name: 'Topic',
                    value: `${'```'}\n${support_ticket_topic_name}\n${'```'}`,
                    inline: false,
                }, {
                    name: 'Opened By',
                    value: `<@!${support_ticket_owner.id}>`,
                    inline: true,
                }, {
                    name: 'Closed By',
                    value: `<@!${member_that_closed_ticket.id}>`,
                    inline: true,
                }, {
                    name: 'Participants',
                    value: `${all_channel_participants.map(user_id => `<@!${user_id}>`).join(' - ')}`,
                    inline: false,
                },
            ],
        });

        /* send the transcript to transcripts channel */
        const support_ticket_transcripts_channel = await client.channels.fetch(support_tickets_transcripts_channel_id);
        const transcript_message = await support_ticket_transcripts_channel.send({
            embeds: [
                transcript_embed,
            ],
            files: [
                createTranscriptAttachment(),
            ],
        }).catch(console.warn);

        /* send the feedback survey to the user */
        if (send_feedback_survey) {
            try {
                const satisfaction_levels = {
                    'highest_satisfaction': {
                        name: 'Excellent',
                        description: 'Support went above and beyond expectations!',
                        color: '#00ff00',
                    },
                    'high_satisfaction': {
                        name: 'Good',
                        description: 'Support was able to help me without issues!',
                        color: '#77ff00',
                    },
                    'medium_satisfaction': {
                        name: 'Decent',
                        description: 'Support was able to help me with little issues!',
                        color: '#ffff00',
                    },
                    'low_satisfaction': {
                        name: 'Bad',
                        description: 'Support wasn\'t able to help me properly!',
                        color: '#ff7700',
                    },
                    'lowest_satisfaction': {
                        name: 'Horrible',
                        description: 'Support staff need better training!',
                        color: '#ff0000',
                    },
                };

                const support_ticket_owner_dms = await support_ticket_owner.createDM();

                await support_ticket_owner_dms.send({
                    embeds: [
                        new Discord.MessageEmbed({
                            color: 0x60A0FF,
                            author: {
                                iconURL: `${client.user.displayAvatarURL({ dynamic: true })}`,
                                name: 'Inertia Lighting | Support Ticket Transcript',
                            },
                            description: 'Your support ticket transcript is attached to this message.',
                        }),
                    ],
                    files: [
                        createTranscriptAttachment(),
                    ],
                });

                const user_feedback_survey_message = await support_ticket_owner_dms.send({
                    embeds: [
                        new Discord.MessageEmbed({
                            color: 0x60A0FF,
                            author: {
                                iconURL: `${client.user.displayAvatarURL({ dynamic: true })}`,
                                name: 'Inertia Lighting | Support Ticket Feedback',
                            },
                            description: 'How was your most recent support ticket experience?',
                        }),
                    ],
                    components: [
                        {
                            type: 1,
                            components: [
                                {
                                    type: 3,
                                    custom_id: 'support_user_feedback_survey_color',
                                    placeholder: 'Select a rating!',
                                    min_values: 1,
                                    max_values: 1,
                                    options: Object.entries(satisfaction_levels).map(([key, value]) => ({
                                        label: value.name,
                                        description: value.description,
                                        value: key,
                                    })),
                                },
                            ],
                        },
                    ],
                });

                const user_feedback_survey_components_collector = user_feedback_survey_message.createMessageComponentCollector({
                    filter: (interaction) => interaction.user.id === support_ticket_owner.id,
                    time: 30 * 60_000,
                    max: 1,
                });

                user_feedback_survey_components_collector.on('collect', async (interaction) => {
                    await interaction.deferUpdate();

                    if (!interaction.isSelectMenu()) return;

                    switch (interaction.customId) {
                        case 'support_user_feedback_survey_color': {
                            const satisfaction_level = satisfaction_levels[interaction.values[0]];

                            const customer_review_embed = new Discord.MessageEmbed({
                                color: satisfaction_level.color ?? 0x60A0FF,
                                title: `User feedback: ${satisfaction_level.name}`,
                                description: `${satisfaction_level.description}`,
                            });

                            await transcript_message.edit({
                                embeds: [
                                    transcript_embed,
                                    customer_review_embed,
                                ],
                            }).catch(console.warn);

                            await user_feedback_survey_message.edit({
                                embeds: [
                                    new Discord.MessageEmbed({
                                        color: 0x60A0FF,
                                        title: 'Thanks for the feedback!',
                                    }),
                                ],
                            }).catch(console.warn);

                            break;
                        }

                        default: {
                            return; // don't continue if we don't have a valid custom_id
                        }
                    }
                });

                user_feedback_survey_components_collector.on('end', async () => {
                    await user_feedback_survey_message.edit({
                        components: [],
                    }).catch(console.warn);
                });
            } catch {} // ignore any errors
        }

        /* delete the temporary file */
        fs.unlinkSync(temp_file_path);
    }

    await Timer(5000); // wait 5 seconds before deleting the channel

    await support_channel.delete().catch(console.warn);

    return support_channel;
}

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
                            '**Hi there, how can we help you today?**',
                            '**Please choose the category that you need assistance for.**',
                            '*Picking the wrong category will result in longer wait times!*',
                        ].join('\n\n'),
                    }),
                ],
                components: [
                    {
                        type: 1,
                        components: [
                            {
                                type: 3,
                                custom_id: 'support_category_selection_menu',
                                placeholder: 'Select a support category!',
                                min_values: 1,
                                max_values: 1,
                                options: support_categories.map(({ id, name, description }) => ({
                                    label: name,
                                    description: description.slice(0, 50), // truncate for discord
                                    value: id,
                                })),
                            },
                        ],
                    },
                ],
            }).catch(console.warn);

            const category_selection_menu_interaction_collector = await category_selection_message.createMessageComponentCollector({
                filter: (interaction) => interaction.user.id === message.author.id,
                time: 5 * 60_000,
            });

            category_selection_menu_interaction_collector.on('collect', async (category_selection_menu_interaction) => {
                await category_selection_menu_interaction.deferUpdate();

                const category_selection_menu_value = category_selection_menu_interaction.values[0];

                const matching_support_category = support_categories.find((support_category) => support_category.id === category_selection_menu_value);

                if (!matching_support_category) {
                    console.trace('Support category selection menu supplied an invalid value:', { category_selection_menu_value });
                    return; // failed to find a matching support category
                }

                /* stop the collector since we have what we need */
                category_selection_menu_interaction_collector.stop();

                let support_channel;
                try {
                    support_channel = await createSupportTicketChannel(message.guild, message.member, matching_support_category);
                } catch {
                    return; // don't continue if we can't create a new support ticket channel
                }

                /* respond to the user with a mention for the support ticket channel */
                await category_selection_menu_interaction.followUp({
                    content: [
                        `You selected ${matching_support_category.name}!`,
                        `Go to ${support_channel} to continue.`,
                    ].join('\n'),
                }).catch(console.warn);

                /* send the category-specific instructions */
                const category_instructions_message = await support_channel.send({
                    ...matching_support_category.instructions_message_options,
                    content: `${message.author}, welcome to your support ticket!`,
                    components: [
                        {
                            type: 1,
                            components: [
                                cancel_support_ticket_button,
                            ],
                        },
                    ],
                });

                /* pin the category-specific instructions */
                support_channel.messages.pin(category_instructions_message.id).catch(console.warn);

                let notice_to_press_button_message; // declared here so we can access it later
                setTimeout(async () => {
                    if (category_instructions_message.deleted) return; // don't continue if the message was deleted

                    category_instructions_message.edit({
                        components: [
                            {
                                type: 1,
                                components: [
                                    ready_for_support_staff_button,
                                    cancel_support_ticket_button,
                                ],
                            },
                        ],
                    }).catch(() => null);

                    notice_to_press_button_message = await category_instructions_message.reply({
                        content: `${message.author}, if you have completed the instructions above; please press the green button above!`,
                    }).catch(() => null);
                }, 5 * 60_000); // 5 minutes

                const category_instructions_message_components_collector = category_instructions_message.createMessageComponentCollector({
                    filter: (interaction) => interaction.user.id === message.author.id,
                    time: 60 * 60_000, // 1 hour
                });

                category_instructions_message_components_collector.on('collect', async (interaction) => {
                    await interaction.deferUpdate();

                    switch (interaction.customId) {
                        case 'ready_for_support_staff': {
                            /* allow staff to interact in the support ticket */
                            await support_channel.permissionOverwrites.set([
                                ...support_channel.permissionOverwrites.cache.values(), // clone the channel's current permissions
                                {
                                    id: process.env.BOT_STAFF_ROLE_ID,
                                    allow: [ 'VIEW_CHANNEL', 'SEND_MESSAGES' ],
                                },
                            ]).catch(console.trace);

                            const qualified_support_role_mentions = matching_support_category.qualified_support_role_ids.map(role_id => `<@&${role_id}>`).join(', ');

                            await interaction.channel.send({
                                content: `${message.author}, Our ${qualified_support_role_mentions} staff will help you with your issue soon!`,
                            }).catch(console.warn);

                            break;
                        }

                        case 'cancel_support_ticket': {
                            await interaction.channel.send({
                                content: `${message.author}, Cancelling support ticket...`,
                            }).catch(console.warn);

                            await closeSupportTicketChannel(support_channel, false, message.member, false);

                            break;
                        }

                        default: {
                            return; // don't continue if we don't have a valid custom_id
                        }
                    }

                    notice_to_press_button_message?.delete()?.catch(() => null);
                    category_instructions_message_components_collector.stop();
                });

                category_instructions_message_components_collector.on('end', async (collected_interactions, reason) => {
                    /* remove all components from the message */
                    await category_instructions_message.edit({
                        components: [
                            {
                                type: 1,
                                components: [
                                    display_database_documents_button,
                                ],
                            },
                        ],
                    }).catch(console.warn);

                    /* check if the collector has exceeded the specified time */
                    if (reason === 'time') {
                        await closeSupportTicketChannel(support_channel, false, undefined, false);
                    }
                });
            });

            category_selection_menu_interaction_collector.on('end', () => {
                /* remove the selection menu as it is no longer needed */
                category_selection_message.delete().catch(console.warn);
            });

            /* automatically cancel the category selection collector */
            setTimeout(() => {
                category_selection_menu_interaction_collector.stop();
            }, 5 * 60_000); // 5 minutes
        }

        async function closeTicketCommand() {
            if (user_permission_level < command_permission_levels.STAFF) {
                message.reply({
                    content: 'Sorry, only staff may close active support tickets.',
                }).catch(console.warn);
                return;
            }

            const channel_exists_in_support_tickets_category = message.channel.parentId === support_tickets_category_id;
            const channel_is_not_transcripts_channel = message.channel.id !== support_tickets_transcripts_channel_id;
            if (!(channel_exists_in_support_tickets_category && channel_is_not_transcripts_channel)) {
                message.reply({
                    content: 'This channel is not an active support ticket.',
                }).catch(console.warn);
                return;
            }

            const support_channel = message.channel;
            const support_ticket_topic_name = support_channel.name.match(/([a-zA-Z\-\_])+(?![\-\_])\D/i)?.[0];
            const support_category = support_categories.find(support_category => support_category.id === support_ticket_topic_name.toUpperCase());

            if (support_category?.automatically_save_when_closed) {
                await closeSupportTicketChannel(support_channel, true, message.member, true);
                return;
            }

            /** @type {Discord.Message} */
            const save_transcript_message = await message.reply({
                content: 'Would you like to save the transcript for this support ticket before closing it?',
                components: [
                    {
                        type: 1,
                        components: [
                            {
                                type: 2,
                                style: 2,
                                custom_id: 'save_transcript',
                                label: 'Yes',
                            }, {
                                type: 2,
                                style: 2,
                                custom_id: 'discard_transcript',
                                label: 'No',
                            },
                        ],
                    },
                ],
            }).catch(console.warn);

            let save_transcript = false;

            const save_transcript_message_components_collector = save_transcript_message.createMessageComponentCollector({
                filter: (interaction) => interaction.user.id === message.author.id,
                max: 1,
            });

            save_transcript_message_components_collector.on('collect', async (interaction) => {
                await interaction.deferUpdate();

                switch (interaction.customId) {
                    case 'save_transcript': {
                        save_transcript = true;
                        break;
                    }

                    case 'discard_transcript': {
                        save_transcript = false;
                        break;
                    }

                    default: {
                        return; // don't continue if we don't have a valid custom_id
                    }
                }
            });

            save_transcript_message_components_collector.on('end', async () => {
                /* remove all components from the message */
                await save_transcript_message.edit({
                    components: [],
                }).catch(console.warn);

                /* close the support ticket */
                await closeSupportTicketChannel(support_channel, save_transcript, message.member, true);
            });
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
