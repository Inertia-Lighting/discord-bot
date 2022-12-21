//------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
//------------------------------------------------------------//

//---------------------------------------------------------------------------------------------------------------//

import { Discord, client } from '../discord_client';

import { CustomEmbed } from '@root/bot/common/message';

import { Timer } from '@root/utilities';

import discordTranscripts from 'discord-html-transcripts';

const support_tickets_category_id = process.env.BOT_SUPPORT_TICKETS_CATEGORY_ID as string;
const support_tickets_transcripts_channel_id = process.env.BOT_SUPPORT_TICKETS_TRANSCRIPTS_CHANNEL_ID as string;

//---------------------------------------------------------------------------------------------------------------//

const support_ticket_cleanup_timeout_in_ms = 10_000; // 10 seconds
const user_feedback_survey_collector_timeout_in_ms = 30 * 60_000; // 30 minutes

//---------------------------------------------------------------------------------------------------------------//

const satisfaction_levels = {
    highest_satisfaction: {
        label: 'Excellent',
        description: 'Support went above and beyond expectations!',
        color: CustomEmbed.colors.GREEN,
    },
    high_satisfaction: {
        label: 'Good',
        description: 'Support was able to help me without issues!',
        color: 0x77ff00,
    },
    medium_satisfaction: {
        label: 'Decent',
        description: 'Support was able to help me with little issues!',
        color: CustomEmbed.colors.YELLOW,
    },
    low_satisfaction: {
        label: 'Bad',
        description: 'Support wasn\'t able to help me properly!',
        color: 0xff7700,
    },
    lowest_satisfaction: {
        label: 'Horrible',
        description: 'Support staff need better training!',
        color: CustomEmbed.colors.RED,
    },
};

const support_categories = new Discord.Collection([
    {
        id: 'ISSUES',
        name: 'Product Tech Support',
        description: 'Product technical support can be found here.',
    }, {
        id: 'RECOVERY',
        name: 'Account Recovery',
        description: 'Recover products from an inaccessible account.',
    }, {
        id: 'TRANSFERS',
        name: 'Transfer Products',
        description: 'Transfer or gift products to a different account.',
    }, {
        id: 'TRANSACTIONS',
        name: 'Transactions',
        description: 'Failed transactions or monetary issues with purchases.',
    }, {
        id: 'OTHER',
        name: 'Other & Quick Questions',
        description: 'For all other forms of support.',
    },
].map((item) => [ item.id, item ]));

//---------------------------------------------------------------------------------------------------------------//

/**
 * Creates a support ticket channel
 */
async function createSupportTicketChannel(
    guild: Discord.Guild,
    guild_member: Discord.GuildMember,
    support_category: string
): Promise<Discord.TextChannel> {
    const support_tickets_category = guild.channels.resolve(support_tickets_category_id);

    if (!support_tickets_category) throw new Error('Can\'t find the support ticket category!');
    if (!(support_tickets_category instanceof Discord.CategoryChannel)) throw new Error('Support ticket category is not a category!');

    const support_channel_name = `${support_category}-${guild_member.id}`.toLowerCase();

    const potential_open_ticket_channel = guild.channels.cache.find(channel => channel.parentId === support_tickets_category.id && channel.name === support_channel_name);
    if (potential_open_ticket_channel) throw new Error('A support ticket channel is already open!');

    const support_ticket_channel = await guild.channels.create({
        name: support_channel_name,
        type: Discord.ChannelType.GuildText,
        topic: `${guild_member} | ${support_category} | Opened on <t:${Math.floor(Date.now() / 1000)}:F> | Staff may close this ticket using the \`close_ticket\` command.`,
        parent: support_tickets_category,
        permissionOverwrites: [
            ...support_tickets_category.permissionOverwrites.cache.values(), // clone the parent channel permissions
            {
                id: process.env.BOT_STAFF_ROLE_ID as string,
                allow: [ Discord.PermissionFlagsBits.ViewChannel, Discord.PermissionFlagsBits.SendMessages ],
            }, {
                id: guild_member.id,
                allow: [ Discord.PermissionFlagsBits.ViewChannel, Discord.PermissionFlagsBits.SendMessages ],
            },
        ],
    });

    return support_ticket_channel;
}

async function closeSupportTicketChannel(
    support_channel: Discord.TextChannel,
    save_transcript: boolean,
    member_that_closed_ticket: Discord.GuildMember | undefined,
    send_feedback_survey: boolean = false
): Promise<Discord.TextChannel> {
    await support_channel.send({
        content: `${member_that_closed_ticket ? `${member_that_closed_ticket},` : 'automatically'} closing support ticket in 10 seconds...`,
    }).catch(console.warn);

    if (save_transcript && member_that_closed_ticket) {
        const support_ticket_topic_name = support_channel.name.match(/([a-zA-Z\-\_])+(?![\-\_])\D/i)?.[0];
        if (!support_ticket_topic_name) throw new Error('Unable to find the support ticket topic name!');

        const support_ticket_owner_id = support_channel.name.match(/(?!.*\-)?([0-9])+/i)?.[0];
        if (!support_ticket_owner_id) throw new Error('Unable to find the support ticket owner id!');

        const support_category = support_categories.find(support_category => support_category.id === support_ticket_topic_name?.toUpperCase());
        const support_ticket_owner = await client.users.fetch(support_ticket_owner_id);

        const transcript = await discordTranscripts.createTranscript(support_channel, {
            limit: -1,
            filename: `transcript_${support_channel.name}.html`,
            saveImages: false,
            poweredBy: false,
        });

        const transcript_embed = CustomEmbed.from({
            fields: [
                {
                    name: 'Ticket Id',
                    value: `${'```'}\n${support_channel.name}\n${'```'}`,
                    inline: false,
                }, {
                    name: 'Category',
                    value: `${'```'}\n${support_category?.name}\n${'```'}`,
                    inline: false,
                }, {
                    name: 'Creation Timestamp',
                    value: `<t:${Math.floor(support_channel.createdTimestamp / 1000)}:F>`,
                    inline: false,
                }, {
                    name: 'Closure Timestamp',
                    value: `<t:${Math.floor(Date.now() / 1000)}:F>`,
                    inline: false,
                }, {
                    name: 'Opened By',
                    value: `<@!${support_ticket_owner.id}>`,
                    inline: true,
                }, {
                    name: 'Closed By',
                    value: `<@!${member_that_closed_ticket.id}>`,
                    inline: true,
                },
            ],
        });

        /* send the transcript to transcripts channel */
        const support_ticket_transcripts_channel = await client.channels.fetch(support_tickets_transcripts_channel_id);
        if (!support_ticket_transcripts_channel) throw new Error('Unable to find the support ticket transcripts channel!');
        if (!support_ticket_transcripts_channel.isTextBased()) throw new Error('The support ticket transcripts channel is not a text channel!');

        const transcript_message = await support_ticket_transcripts_channel.send({
            embeds: [
                transcript_embed,
            ],
            files: [
                transcript,
            ],
        }).catch(console.warn);
        if (!transcript_message) throw new Error('Unable to send the support ticket transcript!');

        /* send the feedback survey to the user */
        if (send_feedback_survey) {
            try {
                const support_ticket_owner_dms = await support_ticket_owner.createDM();

                await support_ticket_owner_dms.send({
                    embeds: [
                        CustomEmbed.from({
                            description: 'Your support ticket transcript is attached to this message.',
                        }),
                    ],
                    files: [
                        transcript,
                    ],
                });

                const user_feedback_survey_message = await support_ticket_owner_dms.send({
                    embeds: [
                        CustomEmbed.from({
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
                                    placeholder: 'Please select a rating to give our support staff!',
                                    min_values: 1,
                                    max_values: 1,
                                    options: Object.entries(satisfaction_levels).map(([ key, value ]) => ({
                                        label: value.label,
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
                    time: user_feedback_survey_collector_timeout_in_ms,
                    max: 1,
                });

                user_feedback_survey_components_collector.on('collect', async (interaction) => {
                    await interaction.deferUpdate();

                    if (!interaction.isSelectMenu()) return;

                    switch (interaction.customId) {
                        case 'support_user_feedback_survey_color': {
                            const satisfaction_level = satisfaction_levels[interaction.values[0] as keyof typeof satisfaction_levels];

                            const customer_review_embed = CustomEmbed.from({
                                color: satisfaction_level.color ?? 0x60A0FF,
                                title: `User feedback: ${satisfaction_level.label}`,
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
                                    CustomEmbed.from({
                                        title: 'Thanks for the feedback!',
                                    }),
                                ],
                            }).catch(console.warn);

                            break;
                        }

                        default: {
                            return; // don't continue if a valid custom_id is missing
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
    }

    await Timer(support_ticket_cleanup_timeout_in_ms); // wait 10 seconds before deleting the channel

    await support_channel.delete().catch(console.warn);

    return support_channel;
}

export {
    createSupportTicketChannel,
    closeSupportTicketChannel,
};
