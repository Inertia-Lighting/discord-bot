'use strict';

//---------------------------------------------------------------------------------------------------------------//

const fs = require('fs');
const path = require('path');
const moment = require('moment-timezone');

//---------------------------------------------------------------------------------------------------------------//

const { go_mongo_db } = require('../../mongo/mongo.js');
const { Timer } = require('../../utilities.js');

const { Discord, client } = require('../discord_client.js');

//---------------------------------------------------------------------------------------------------------------//

const bot_command_prefix = process.env.BOT_COMMAND_PREFIX;
const support_tickets_category_id = process.env.BOT_SUPPORT_TICKETS_CATEGORY_ID;
const support_tickets_transcripts_channel_id = process.env.BOT_SUPPORT_TICKETS_TRANSCRIPTS_CHANNEL_ID;

//---------------------------------------------------------------------------------------------------------------//

/**
 * @typedef {'PRODUCT_PURCHASES'|'PAYPAL_PURCHASES'|'PRODUCT_ISSUES'|'PRODUCT_TRANSFERS'|'PARTNER_REQUESTS'|'OTHER'} SupportCategoryId
 * @typedef {{
 *  id: SupportCategoryId,
 *  human_index: Number,
 *  name: String,
 *  description: String,
 *  qualified_support_role_ids: Discord.Snowflake[],
 * }} SupportCategory
 * @typedef {Discord.Collection<SupportCategoryId, SupportCategory>} SupportCategories
 */

const support_categories = new Discord.Collection([
    {
        id: 'PRODUCT_PURCHASES',
        name: 'Product Purchases',
        description: 'Come here if you are having issues with purchasing our products.',
        qualified_support_role_ids: [
            process.env.BOT_SUPPORT_STAFF_PRODUCT_PURCHASES_ROLE_ID,
        ],
    }, {
        id: 'PAYPAL_PURCHASES',
        name: 'PayPal Purchases',
        description: 'Come here if you want to purchase our products using PayPal.',
        qualified_support_role_ids: [
            process.env.BOT_SUPPORT_STAFF_PAYPAL_ROLE_ID,
            process.env.BOT_SUPPORT_STAFF_PRODUCT_PURCHASES_ROLE_ID,
        ],
    }, {
        id: 'PRODUCT_ISSUES',
        name: 'Product Issues',
        description: 'Come here if you are having issues with a product that was successfully purchased.',
        qualified_support_role_ids: [
            process.env.BOT_SUPPORT_STAFF_PRODUCT_ISSUES_ROLE_ID,
        ],
    }, {
        id: 'PRODUCT_TRANSFERS',
        name: 'Product Transfers',
        description: 'Come here if you want to transfer any of your products to another account.',
        qualified_support_role_ids: [
            process.env.BOT_SUPPORT_STAFF_PRODUCT_TRANSFERS_ROLE_ID,
        ],
    },
    // {
    //     id: 'PARTNER_REQUESTS',
    //     name: 'Partner Requests',
    //     description: 'Come here if you want to request a partnership with Inertia Lighting.',
    //     qualified_support_role_ids: [
    //         process.env.BOT_SUPPORT_STAFF_PARTNER_REQUESTS_ROLE_ID,
    //     ],
    // },
    {
        id: 'OTHER',
        name: 'Other Issues',
        description: 'Come here if none of the other categories match your issue.',
        qualified_support_role_ids: [
            process.env.BOT_SUPPORT_STAFF_OTHER_ROLE_ID,
        ],
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
    const potential_open_ticket_channel = guild.channels.cache.find(ch => ch.parent?.id === support_tickets_category.id && ch.name === support_channel_name);
    const support_ticket_channel = potential_open_ticket_channel ?? await guild.channels.create(support_channel_name, {
        type: 'text',
        topic: `${guild_member} | ${support_category.name} | Opened on ${moment().format('ddd MMM DD YYYY [at] HH:mm:ss [GMT]ZZ')} | Close using \`${bot_command_prefix}close_ticket\``,
        parent: support_tickets_category,
        permissionOverwrites: [
            ...support_tickets_category.permissionOverwrites.values(), // clone the parent channel permissions
            {
                id: guild_member.id,
                allow: [ 'VIEW_CHANNEL' ],
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
            embed: {
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
            },
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

//---------------------------------------------------------------------------------------------------------------//

const active_message_collectors_1 = new Discord.Collection();

//---------------------------------------------------------------------------------------------------------------//

module.exports = {
    name: 'support',
    description: 'support tickets and stuff',
    aliases: ['support', 'close_ticket'],
    permission_level: 'public',
    cooldown: 10_000,
    async execute(message, args) {
        const { user_permission_levels, command_name } = args;

        if (command_name === 'support') {
            if (active_message_collectors_1.has(message.author.id)) {
                return; // don't allow multiple message_collector_1 to exist
            }

            const bot_message = await message.channel.send(`${message.author}`, new Discord.MessageEmbed({
                color: 0x60A0FF,
                author: {
                    iconURL: `${client.user.displayAvatarURL({ dynamic: true })}`,
                    name: 'Inertia Lighting | Support System',
                },
                description: [
                    '**How can I help you today?**',
                    support_categories.map(({ human_index, name, description }) => `**${human_index} | ${name}**\n${description}`).join('\n\n'),
                    '**Please type the category number that you need or \`cancel\`.**',
                    '*Picking the wrong category will result in longer wait times!*',
                ].join('\n\n'),
            })).catch(console.warn);

            const message_collector_1 = bot_message.channel.createMessageCollector((msg) => msg.author.id === message.author.id);
            message_collector_1.on('collect', async (collected_message_1) => {
                const matching_support_category = support_categories.find((support_category) => `${support_category.human_index}` === collected_message_1.content);
                if (matching_support_category) {
                    message_collector_1.stop();

                    await Timer(250); // delay the message deletion
                    await bot_message.delete().catch(console.warn);

                    const support_channel = await createSupportTicketChannel(message.guild, message.member, matching_support_category);

                    /* respond to the user with a mention to the support ticket channel */
                    await collected_message_1.reply([
                        `You selected ${matching_support_category.name}!`,
                        `Go to ${support_channel} to continue.`,
                    ].join('\n')).catch(console.warn);

                    /* ping the user so they know where to go */
                    await support_channel.send(`${message.author}, welcome to your support ticket!`).catch(console.warn);

                    /* send the user document */
                    const [ db_user_data ] = await go_mongo_db.find(process.env.MONGO_DATABASE_NAME, process.env.MONGO_USERS_COLLECTION_NAME, {
                        'identity.discord_user_id': message.author.id,
                    }, {
                        projection: {
                            '_id': false,
                        },
                    });
                    await support_channel.send(new Discord.MessageEmbed({
                        color: 0x60A0FF,
                        author: {
                            iconURL: `${client.user.displayAvatarURL({ dynamic: true })}`,
                            name: 'Inertia Lighting | User Document',
                        },
                        description: `${'```'}json\n${JSON.stringify(db_user_data ?? 'user not found in database', null, 2)}\n${'```'}`,
                    })).catch(console.warn);

                    /* send the blacklisted user document */
                    const [ blacklisted_user_db_data ] = await go_mongo_db.find(process.env.MONGO_DATABASE_NAME, process.env.MONGO_BLACKLISTED_USERS_COLLECTION_NAME, {
                        'identity.discord_user_id': message.author.id,
                    }, {
                        projection: {
                            '_id': false,
                        },
                    });
                    await support_channel.send(new Discord.MessageEmbed({
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

                    switch (matching_support_category.id) {
                        case 'PRODUCT_PURCHASES':
                            await support_channel.send(new Discord.MessageEmbed({
                                color: 0x60A0FF,
                                author: {
                                    iconURL: `${client.user.displayAvatarURL({ dynamic: true })}`,
                                    name: `Inertia Lighting | ${matching_support_category.name}`,
                                },
                                description: [
                                    '**Please fill out this template so that our staff can assist you.**',
                                    '- **Product(s):** ( C-Lights, Magic Panels, etc )',
                                    '- **Purchase Date(s):** ( 1970-01-01 )',
                                    '- **Proof Of Purchase(s):** ( screenshot [your transactions](https://www.roblox.com/transactions) )',
                                    '- **Issue:** ( describe your issue )',
                                    '**If you don\'t fill out the template properly, your ticket will be ignored!**',
                                ].join('\n'),
                            })).catch(console.warn);
                            break;
                        case 'PAYPAL_PURCHASES':
                            await support_channel.send(new Discord.MessageEmbed({
                                color: 0x60A0FF,
                                author: {
                                    iconURL: `${client.user.displayAvatarURL({ dynamic: true })}`,
                                    name: `Inertia Lighting | ${matching_support_category.name}`,
                                },
                                description: [
                                    '**Please fill out this template so that our staff can assist you.**',
                                    '- **Product(s):** ( C-Lights, Magic Panels, etc )',
                                    '',
                                    '**After filling out the template, please wait for <@!331938622733549590> to provide you with a payment destination.**',
                                    '',
                                    '**Once you have payed, please provide the following information.**',
                                    '- **Transaction Email:** ( you@your.email )',
                                    '- **Transaction Id:** ( 000000000000000000 )',
                                    '- **Transaction Amount:** ( $1.69 )',
                                    '- **Transaction Date:** ( 1970-01-01 )',
                                    '- **Transaction Time:** ( 12:00 AM )',
                                    '',
                                    '**Please follow the above instructions properly!**',
                                ].join('\n'),
                            })).catch(console.warn);
                            break;
                        case 'PRODUCT_ISSUES':
                            await support_channel.send(new Discord.MessageEmbed({
                                color: 0x60A0FF,
                                author: {
                                    iconURL: `${client.user.displayAvatarURL({ dynamic: true })}`,
                                    name: `Inertia Lighting | ${matching_support_category.name}`,
                                },
                                description: [
                                    '**Please fill out this template so that our staff can assist you.**',
                                    '- **Product(s):** ( C-Lights, Magic Panels, etc )',
                                    '- **Read Setup Guide:** ( yes | maybe | no )',
                                    '- **Game Is Published:** ( yes | idk |  no )',
                                    '- **HTTPS Enabled In Game:** ( yes | idk | no )',
                                    '- **Roblox Studio Output:** ( [how to enable output](https://prnt.sc/y6hnau) )',
                                    '- **Issue:** ( describe your issue )',
                                    '**If you don\'t fill out the template properly, your ticket will be ignored!**',
                                ].join('\n'),
                            })).catch(console.warn);
                            break;
                        case 'PRODUCT_TRANSFERS':
                            await support_channel.send(new Discord.MessageEmbed({
                                color: 0x60A0FF,
                                author: {
                                    iconURL: `${client.user.displayAvatarURL({ dynamic: true })}`,
                                    name: `Inertia Lighting | ${matching_support_category.name}`,
                                },
                                description: [
                                    '**Please fill out this template so that our staff can assist you.**',
                                    '- **Product(s):** ( C-Lights, Magic Panels, etc )',
                                    '- **Reason:** ( new account | gift for someone | other )',
                                    '- **New Roblox Account:** ( copy the URL of the profile page for the account | n/a )',
                                    '- **New Discord Account:** ( @mention the account | n/a )',
                                    '**If you don\'t fill out the template properly, your ticket will be ignored!**',
                                ].join('\n'),
                            })).catch(console.warn);
                            break;
                        case 'PARTNER_REQUESTS':
                            await support_channel.send(new Discord.MessageEmbed({
                                color: 0x60A0FF,
                                author: {
                                    iconURL: `${client.user.displayAvatarURL({ dynamic: true })}`,
                                    name: `Inertia Lighting | ${matching_support_category.name}`,
                                },
                                title: 'Please fill out our partner request form.',
                                description: 'https://inertia.lighting/partner-requests-form',
                            })).catch(console.warn);
                            break;
                        case 'OTHER':
                            await support_channel.send(new Discord.MessageEmbed({
                                color: 0x60A0FF,
                                author: {
                                    iconURL: `${client.user.displayAvatarURL({ dynamic: true })}`,
                                    name: `Inertia Lighting | ${matching_support_category.name}`,
                                },
                                title: 'Please tell us about your issue.',
                            })).catch(console.warn);
                            break;
                    }

                    const choices_embed = await support_channel.send(new Discord.MessageEmbed({
                        color: 0x60A0FF,
                        description: [
                            '**Type \`done\` when you are ready for our support staff.**',
                            '**Type \`cancel\` if you wish to close this ticket.**',
                        ].join('\n'),
                    })).catch(console.warn);

                    const message_collector_2_filter = (msg) => msg.author.id === message.author.id;
                    const message_collector_2 = support_channel.createMessageCollector(message_collector_2_filter);
                    message_collector_2.on('collect', async (collected_message_2) => {
                        async function cleanupMessageCollector() {
                            message_collector_2.stop();
                            await Timer(500); // delay the message deletion
                            await choices_embed.delete().catch(console.warn);
                            await Timer(500); // delay the message deletion
                            await collected_message_2.delete().catch(console.warn);
                        }
                        switch (collected_message_2.content.toLowerCase()) {
                            case 'done':
                                await cleanupMessageCollector();
                                const qualified_support_role_mentions = matching_support_category.qualified_support_role_ids.map(role_id => `<@&${role_id}>`).join(', ');
                                await support_channel.send(`${message.author}, Our ${qualified_support_role_mentions} staff will help you with your issue soon!`).catch(console.warn);
                                break;
                            case 'cancel':
                                await cleanupMessageCollector();
                                await support_channel.send(`${message.author}, Cancelling support ticket...`).catch(console.warn);
                                await closeSupportTicketChannel(support_channel, false);
                                break;
                        }
                    });
                } else if (['cancel'].includes(collected_message_1.content.toLowerCase())) {
                    message_collector_1.stop();
                    await Timer(500); // delay the message deletion
                    await bot_message.delete().catch(console.warn);
                    await collected_message_1.reply('Canceled!').catch(console.warn);
                } else {
                    await collected_message_1.reply('Please type the category number or \`cancel\`.').catch(console.warn);
                }
            });
            message_collector_1.on('end', () => {
                active_message_collectors_1.delete(message.author.id);
            });
            active_message_collectors_1.set(message.author.id, message_collector_1);

            /* automatically cancels a support-ticket selection screen */
            setTimeout(async () => {
                await Timer(500); // delay the message deletion
                await bot_message.delete().catch(console.warn);
                message_collector_1.stop();
            }, 5 * 60_000); // 5 minutes
        } else if (command_name === 'close_ticket') {
            if (user_permission_levels.includes('staff')) {
                const channel_exists_in_support_tickets_category = message.channel.parent?.id === support_tickets_category_id;
                const channel_is_not_transcripts_channel = message.channel.id !== support_tickets_transcripts_channel_id;
                if (channel_exists_in_support_tickets_category && channel_is_not_transcripts_channel) {
                    const support_channel = message.channel;

                    await message.reply('Would you like to save the transcript for this support ticket before closing it?\n**( yes | no )**').catch(console.warn);

                    const collection_filter = (msg) => msg.author.id === message.author.id && ['yes', 'no'].includes(msg.content.toLowerCase());
                    const collected_messages = await support_channel.awaitMessages(collection_filter, { max: 1 }).catch((collected_messages) => collected_messages);

                    const save_transcript = ['yes'].includes(collected_messages.first()?.content?.toLowerCase());

                    await support_channel.send(`${message.author}, Closing support ticket in 5 seconds...`).catch(console.warn);

                    await closeSupportTicketChannel(support_channel, save_transcript);
                } else {
                    message.reply('This channel is not a support ticket.').catch(console.warn);
                }
            } else {
                message.reply('Sorry, only staff can close active support tickets.').catch(console.warn);
            }
        }
    },
};
