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

const support_tickets_category_id = '805191315947913236';
const support_ticket_transcripts_channel_id = '806602125610057729';

//---------------------------------------------------------------------------------------------------------------//

const support_categories = new Discord.Collection([
    {
        id: 'PRODUCT_PURCHASES',
        name: 'Product Purchases',
        description: 'Come here if you are having issues with purchasing our products.',
        qualified_support_role_ids: ['809151858253103186'],
    }, {
        id: 'PRODUCT_ISSUES',
        name: 'Product Issues',
        description: 'Come here if you are having issues with a product that was successfully purchased.',
        qualified_support_role_ids: ['807385031051575306'],
    }, {
        id: 'PRODUCT_TRANSFERS',
        name: 'Product Transfers',
        description: 'Come here if you want to transfer any of your products to another account.',
        qualified_support_role_ids: ['807385028568154113'],
    }, {
        id: 'PARTNER_REQUESTS',
        name: 'Partner Requests',
        description: 'Come here if you want to request a partnership with Inertia Lighting.',
        qualified_support_role_ids: ['807385032754462761'],
    }, {
        id: 'OTHER',
        name: 'Other Issues',
        description: 'Come here if none of the other categories match your issue.',
        qualified_support_role_ids: ['809151496490057728'],
    },
].map((item, index) => ([ item.id, { ...{ human_index: index + 1 }, ...item } ])));

//---------------------------------------------------------------------------------------------------------------//

async function createSupportTicketChannel(guild, guild_member, support_category) {
    const support_tickets_category = guild.channels.resolve(support_tickets_category_id);

    const support_channel_name = `${support_category.id}-${guild_member.id}`.toLowerCase();
    const potential_open_ticket_channel = guild.channels.cache.find(ch => ch.parent?.id === support_tickets_category.id && ch.name === support_channel_name);
    const support_ticket_channel = potential_open_ticket_channel ?? await guild.channels.create(support_channel_name, {
        type: 'text',
        topic: `${guild_member} | ${support_category.name} | Opened on ${moment().format('ddd MMM DD YYYY [at] HH:mm:ss [GMT]ZZ')}`,
        parent: support_tickets_category,
    });

    return support_ticket_channel;
}

//---------------------------------------------------------------------------------------------------------------//

module.exports = {
    name: 'support',
    description: 'support tickets and stuff',
    aliases: ['support', 'close_ticket'],
    permission_level: 'admin',
    async execute(message, args) {
        const { user_command_access_levels, command_name } = args;

        if (command_name === 'support') {
            const bot_message = await message.channel.send(`${message.author}`, new Discord.MessageEmbed({
                color: 0x959595,
                author: {
                    iconURL: `${client.user.displayAvatarURL({ dynamic: true })}`,
                    name: 'Inertia Lighting | Support System',
                },
                description: [
                    '**How can I help you today?**',
                    support_categories.map(({ human_index, name, description }) => `**${human_index} | ${name}**\n${description}`).join('\n\n'),
                    '**Type the number of the category that you need or \`cancel\`.**',
                ].join('\n\n'),
            }));

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
                    support_channel.send(`${message.author}, welcome to your support ticket!`);

                    /* send the user document */
                    const [ user_db_data ] = await go_mongo_db.find(process.env.MONGO_DATABASE_NAME, process.env.MONGO_USERS_COLLECTION_NAME, {
                        'discord_user_id': message.author.id,
                    }, {
                        projection: {
                            '_id': false,
                        },
                    });
                    await support_channel.send(new Discord.MessageEmbed({
                        color: 0x959595,
                        author: {
                            iconURL: `${client.user.displayAvatarURL({ dynamic: true })}`,
                            name: 'Inertia Lighting | User Document',
                        },
                        description: `${'```'}json\n${JSON.stringify(user_db_data ?? 'user not found in database', null, 2)}\n${'```'}`,
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
                            color: 0x959595,
                            author: {
                                iconURL: `${client.user.displayAvatarURL({ dynamic: true })}`,
                                name: 'Inertia Lighting | Blacklisted User Document',
                            },
                            description: `${'```'}json\n${JSON.stringify(blacklisted_user_db_data, null, 2)}\n${'```'}`,
                        })).catch(console.warn);
                    }

                    switch (matching_support_category.id) {
                        case 'PRODUCT_PURCHASES':
                            await support_channel.send(new Discord.MessageEmbed({
                                color: 0x959595,
                                author: {
                                    iconURL: `${client.user.displayAvatarURL({ dynamic: true })}`,
                                    name: `Inertia Lighting | ${matching_support_category.name}`,
                                },
                                title: 'Please fill out this template so that our staff can assist you.',
                                description: [
                                    '- **Product(s):** ( C-Lights, Magic Panels, etc )',
                                    '- **Purchase Date(s):** ( 1970-1-1 )',
                                    '- **Proof Of Purchase(s):** ( https://www.roblox.com/transactions )',
                                    '- **Issue:** ( describe your issue )',
                                ].join('\n'),
                            })).catch(console.log);
                            break;
                        case 'PRODUCT_ISSUES':
                            await support_channel.send(new Discord.MessageEmbed({
                                color: 0x959595,
                                author: {
                                    iconURL: `${client.user.displayAvatarURL({ dynamic: true })}`,
                                    name: `Inertia Lighting | ${matching_support_category.name}`,
                                },
                                title: 'Please fill out this template so that our staff can assist you.',
                                description: [
                                    '- **Product(s):** ( C-Lights, Magic Panels, etc )',
                                    '- **Read Setup Guide:** ( yes | maybe | no )',
                                    '- **Game Is Published:** ( yes | idk |  no )',
                                    '- **HTTPS Enabled In Game:** ( yes | idk | no )',
                                    '- **Roblox Studio Output:** ( how to enable output: https://prnt.sc/y6hnau )',
                                    '- **Issue:** ( describe your issue )',
                                ].join('\n'),
                            })).catch(console.log);
                            break;
                        case 'PRODUCT_TRANSFERS':
                            await support_channel.send(new Discord.MessageEmbed({
                                color: 0x959595,
                                author: {
                                    iconURL: `${client.user.displayAvatarURL({ dynamic: true })}`,
                                    name: `Inertia Lighting | ${matching_support_category.name}`,
                                },
                                title: 'Please fill out this template so that our staff can assist you.',
                                description: [
                                    '- **Product(s):** ( C-Lights, Magic Panels, etc )',
                                    '- **Reason:** ( new account | gift for someone | other )',
                                    '- **New Roblox Account:** ( copy the URL of the profile page for the account )',
                                    '- **Issue:** ( describe your issue )',
                                ].join('\n'),
                            })).catch(console.log);
                            break;
                        case 'PARTNER_REQUESTS':
                            await support_channel.send(new Discord.MessageEmbed({
                                color: 0x959595,
                                author: {
                                    iconURL: `${client.user.displayAvatarURL({ dynamic: true })}`,
                                    name: `Inertia Lighting | ${matching_support_category.name}`,
                                },
                                title: 'Please fill out our partner request form.',
                                description: 'https://inertia-lighting.xyz/partner-requests-form',
                            })).catch(console.log);
                            await support_channel.send('Automatically closing support ticket in 2 minutes...');
                            setTimeout(() => {
                                support_channel.delete();
                            }, 2 * 60_000); // 2 minutes
                            return;
                        case 'OTHER':
                            await support_channel.send(new Discord.MessageEmbed({
                                color: 0x959595,
                                author: {
                                    iconURL: `${client.user.displayAvatarURL({ dynamic: true })}`,
                                    name: `Inertia Lighting | ${matching_support_category.name}`,
                                },
                                title: 'Please tell us about your issue.',
                            })).catch(console.log);
                            break;
                    }

                    const message_collector_2 = support_channel.createMessageCollector((msg) => msg.author.id === message.author.id, { max: 1 });
                    message_collector_2.on('collect', async () => {
                        await Timer(1000); // provide a noticeable delay for the user to type
                        const qualified_support_role_mentions = matching_support_category.qualified_support_role_ids.map(role_id => `<@&${role_id}>`).join(', ');
                        support_channel.send(`${message.author}, Our ${qualified_support_role_mentions} staff will help you with your issue soon!`);
                    });
                } else if (collected_message.content === 'cancel') {
                    message_collector_1.stop();
                    bot_message.delete({ timeout: 500 }).catch(console.warn);
                    collected_message.reply('Canceled!').catch(console.warn);
                } else {
                    collected_message.reply('Please type the category number or \`cancel\`.').catch(console.warn);
                }
            });
        } else if (command_name === 'close_ticket') {
            if (user_command_access_levels.includes('staff')) {
                if (message.channel.parent?.id === support_tickets_category_id) {
                    await message.reply('Would you like to save the transcript for this support ticket before closing it?\n**( yes | no )**');

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

                        const support_ticket_transcripts_channel = client.channels.resolve(support_ticket_transcripts_channel_id);
                        await support_ticket_transcripts_channel.send(`${message.channel.name}`, message_attachment).catch(console.warn);

                        fs.unlinkSync(temp_file_path);
                    }

                    await message.reply('Closing support ticket in 5 seconds...');
                    await Timer(5000);
                    message.channel.delete().catch(console.warn);
                } else {
                    message.reply('This channel is not a support ticket.');
                }
            } else {
                message.reply('Sorry, only staff can close support tickets.');
            }
        }
    },
};
