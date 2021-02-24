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

const support_tickets_category_id = process.env.BOT_SUPPORT_TICKETS_CATEGORY_ID;
const support_tickets_transcripts_channel_id = process.env.BOT_SUPPORT_TICKETS_TRANSCRIPTS_CHANNEL_ID;

//---------------------------------------------------------------------------------------------------------------//

const support_categories = new Discord.Collection([
    {
        id: 'PRODUCT_PURCHASES',
        name: 'Product Purchases',
        description: 'Come here if you are having issues with purchasing our products.',
        qualified_support_role_ids: [
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
    }, {
        id: 'PARTNER_REQUESTS',
        name: 'Partner Requests',
        description: 'Come here if you want to request a partnership with Inertia Lighting.',
        qualified_support_role_ids: [
            process.env.BOT_SUPPORT_STAFF_PARTNER_REQUESTS_ROLE_ID,
        ],
    }, {
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

async function createSupportTicketChannel(guild, guild_member, support_category) {
    const support_tickets_category = guild.channels.resolve(support_tickets_category_id);

    const support_channel_name = `${support_category.id}-${guild_member.id}`.toLowerCase();
    const potential_open_ticket_channel = guild.channels.cache.find(ch => ch.parent?.id === support_tickets_category.id && ch.name === support_channel_name);
    const support_ticket_channel = potential_open_ticket_channel ?? await guild.channels.create(support_channel_name, {
        type: 'text',
        topic: `${guild_member} | ${support_category.name} | Opened on ${moment().format('ddd MMM DD YYYY [at] HH:mm:ss [GMT]ZZ')} | Close using \`close_ticket\``,
        parent: support_tickets_category,
    });

    return support_ticket_channel;
}

//---------------------------------------------------------------------------------------------------------------//

const active_message_collectors_1 = new Discord.Collection();

//---------------------------------------------------------------------------------------------------------------//

module.exports = {
    name: 'support',
    description: 'support tickets and stuff',
    aliases: ['support', 'close_ticket'],
    permission_level: 'admin',
    async execute(message, args) {
        const { user_command_access_levels, command_name } = args;

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
                    '**Type the number of the category that you need or \`cancel\`.**',
                ].join('\n\n'),
            })).catch(console.warn);

            const message_collector_1 = bot_message.channel.createMessageCollector((msg) => msg.author.id === message.author.id);
            message_collector_1.on('collect', async (collected_message) => {
                const matching_support_category = support_categories.find((support_category) => `${support_category.human_index}` === collected_message.content);
                if (matching_support_category) {
                    message_collector_1.stop();
                    bot_message.delete({ timeout: 500 }).catch(console.warn);

                    const support_channel = await createSupportTicketChannel(message.guild, message.member, matching_support_category);

                    /* respond to the user with a mention to the support ticket channel */
                    collected_message.reply([
                        `You selected ${matching_support_category.name}!`,
                        `Go to ${support_channel} to continue.`,
                    ].join('\n')).catch(console.warn);

                    /* ping the user so they know where to go */
                    support_channel.send(`${message.author}, welcome to your support ticket!`).catch(console.warn);

                    /* send the user document */
                    const [ db_user_data ] = await go_mongo_db.find(process.env.MONGO_DATABASE_NAME, process.env.MONGO_USERS_COLLECTION_NAME, {
                        'discord_user_id': message.author.id,
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
                        'discord_user_id': message.author.id,
                    }, {
                        projection: {
                            '_id': false,
                        },
                    });
                    if (blacklisted_user_db_data) { // only send it if they are blacklisted
                        await support_channel.send(new Discord.MessageEmbed({
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
                    }

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
                                    '- **Purchase Date(s):** ( 1970-1-1 )',
                                    '- **Proof Of Purchase(s):** ( https://www.roblox.com/transactions )',
                                    '- **Issue:** ( describe your issue )',
                                    '\n',
                                    'Type \`done\` when you are finished typing.',
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
                                    '- **Roblox Studio Output:** ( how to enable output: https://prnt.sc/y6hnau )',
                                    '- **Issue:** ( describe your issue )',
                                    '\n',
                                    'Type \`done\` when you are finished typing.',
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
                                    '- **New Roblox Account:** ( copy the URL of the profile page for the account )',
                                    '- **Issue:** ( describe your issue )',
                                    '\n',
                                    'Type \`done\` when you are finished typing.',
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
                                description: 'https://inertia-lighting.xyz/partner-requests-form',
                            })).catch(console.warn);
                            await support_channel.send('Automatically closing support ticket in 2 minutes...').catch(console.warn);
                            setTimeout(() => {
                                support_channel.delete();
                            }, 2 * 60_000); // 2 minutes
                            return;
                        case 'OTHER':
                            await support_channel.send(new Discord.MessageEmbed({
                                color: 0x60A0FF,
                                author: {
                                    iconURL: `${client.user.displayAvatarURL({ dynamic: true })}`,
                                    name: `Inertia Lighting | ${matching_support_category.name}`,
                                },
                                title: 'Please tell us about your issue.',
                                description: 'Type \`done\` when you are finished typing.',
                            })).catch(console.warn);
                            break;
                    }

                    const message_collector_2_filter = (msg) => msg.author.id === message.author.id && msg.content === 'done';
                    const message_collector_2 = support_channel.createMessageCollector(message_collector_2_filter, { max: 1 });
                    message_collector_2.on('collect', async (msg) => {
                        await msg.delete({ timeout: 500 }).catch(console.warn);
                        const qualified_support_role_mentions = matching_support_category.qualified_support_role_ids.map(role_id => `<@&${role_id}>`).join(', ');
                        support_channel.send(`${message.author}, Our ${qualified_support_role_mentions} staff will help you with your issue soon!`).catch(console.warn);
                    });
                } else if (collected_message.content === 'cancel') {
                    message_collector_1.stop();
                    bot_message.delete({ timeout: 500 }).catch(console.warn);
                    collected_message.reply('Canceled!').catch(console.warn);
                } else {
                    collected_message.reply('Please type the category number or \`cancel\`.').catch(console.warn);
                }
            });
            message_collector_1.on('end', () => {
                active_message_collectors_1.delete(message.author.id);
            });
            active_message_collectors_1.set(message.author.id, message_collector_1);
        } else if (command_name === 'close_ticket') {
            if (user_command_access_levels.includes('staff')) {
                if (message.channel.parent?.id === support_tickets_category_id) {
                    await message.reply('Would you like to save the transcript for this support ticket before closing it?\n**( yes | no )**').catch(console.warn);

                    const collection_filter = (msg) => msg.author.id === message.author.id && ['yes', 'no'].includes(msg.content);
                    const collected_messages = await message.channel.awaitMessages(collection_filter, { max: 1 }).catch((collected_messages) => collected_messages);
                    const first_collected_message = collected_messages.first();
                    if (first_collected_message?.content === 'yes') {
                        const all_messages_in_channel = await message.channel.messages.fetch({ limit: 100 }); // 100 is the max
                        const all_messages_in_channel_processed = Array.from(all_messages_in_channel.values()).reverse();

                        const temp_file_path = path.join(process.cwd(), 'temporary', `transcript_${message.channel.name}.json`);
                        fs.writeFileSync(temp_file_path, JSON.stringify(all_messages_in_channel_processed, null, 2), { flag: 'w' });

                        const temp_file_read_stream = fs.createReadStream(temp_file_path);
                        const message_attachment = new Discord.MessageAttachment(temp_file_read_stream);

                        const support_ticket_transcripts_channel = client.channels.resolve(support_tickets_transcripts_channel_id);
                        await support_ticket_transcripts_channel.send(`${message.channel.name}`, message_attachment).catch(console.warn);

                        fs.unlinkSync(temp_file_path);
                    }

                    await message.reply('Closing support ticket in 5 seconds...').catch(console.warn);
                    await Timer(5000);
                    message.channel.delete().catch(console.warn);
                } else {
                    message.reply('This channel is not a support ticket.').catch(console.warn);
                }
            } else {
                message.reply('Sorry, only staff can close support tickets.').catch(console.warn);
            }
        }
    },
};
