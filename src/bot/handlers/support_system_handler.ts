//------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
//------------------------------------------------------------//

import * as DiscordTranscripts from 'discord-html-transcripts';

import { Discord, client } from '../discord_client';

import { CustomEmbed } from '@root/bot/common/message';

import { Timer, getMarkdownFriendlyTimestamp } from '@root/utilities';

//------------------------------------------------------------//

const support_tickets_category_id = `${process.env.BOT_SUPPORT_TICKETS_CATEGORY_ID ?? ''}`;
if (support_tickets_category_id.length < 1) throw new Error('Environment variable: BOT_SUPPORT_TICKETS_CATEGORY_ID; is not set correctly.');

const support_tickets_transcripts_channel_id = `${process.env.BOT_SUPPORT_TICKETS_TRANSCRIPTS_CHANNEL_ID ?? ''}`;
if (support_tickets_transcripts_channel_id.length < 1) throw new Error('Environment variable: BOT_SUPPORT_TICKETS_TRANSCRIPTS_CHANNEL_ID; is not set correctly.');

//------------------------------------------------------------//

const support_ticket_cleanup_timeout_in_ms = 10_000; // 10 seconds

const user_feedback_survey_collector_timeout_in_ms = 30 * 60_000; // 30 minutes

//------------------------------------------------------------//

export const satisfaction_levels = {
    highest_satisfaction: {
        label: 'Excellent',
        description: 'Support went above and beyond expectations!',
        color: 0x00FF00,
    },
    high_satisfaction: {
        label: 'Good',
        description: 'Support was able to help me without issues!',
        color: 0x77ff00,
    },
    medium_satisfaction: {
        label: 'Decent',
        description: 'Support was able to help me with little issues!',
        color: 0xFFFF00,
    },
    low_satisfaction: {
        label: 'Bad',
        description: 'Support wasn\'t able to help me properly!',
        color: 0xff7700,
    },
    lowest_satisfaction: {
        label: 'Horrible',
        description: 'Support staff need better training!',
        color: 0xFF0000,
    },
};

//------------------------------------------------------------//

export enum SupportTicketId {
    Issues = 'ISSUES',
    Recovery = 'RECOVERY',
    Transfers = 'TRANSFERS',
    Transactions = 'TRANSACTIONS',
    Other = 'OTHER',
}

export type SupportCategory = {
    id: SupportTicketId,
    name: string,
    description: string,
    modal: Discord.ModalComponentData,
};

export const support_categories: SupportCategory[] = [
    {
        id: SupportTicketId.Issues,
        name: 'Product Tech Support',
        description: 'Product technical support can be found here.',
        modal: {
            title: 'Tech Support Questions',
            customId: 'support_issues_modal',
            components: [
                {
                    type: Discord.ComponentType.ActionRow,
                    components: [
                        {
                            type: Discord.ComponentType.TextInput,
                            customId: 'product',
                            style: Discord.TextInputStyle.Short,
                            label: 'What product(s) are you having issue(s) with?',
                            minLength: 3,
                            maxLength: 1024,
                            required: true,
                        },
                    ],
                }, {
                    type: Discord.ComponentType.ActionRow,
                    components: [
                        {
                            type: Discord.ComponentType.TextInput,
                            customId: 'read_me',
                            style: Discord.TextInputStyle.Short,
                            label: 'Did you read the README? (Yes or No)',
                            minLength: 2,
                            maxLength: 3,
                            required: true,
                        },
                    ],
                }, {
                    type: Discord.ComponentType.ActionRow,
                    components: [
                        {
                            type: Discord.ComponentType.TextInput,
                            customId: 'http',
                            style: Discord.TextInputStyle.Short,
                            label: 'Did you enable HTTP Request (Yes, No, or Idk)',
                            minLength: 2,
                            maxLength: 3,
                            required: true,
                        },
                    ],
                }, {
                    type: Discord.ComponentType.ActionRow,
                    components: [
                        {
                            type: Discord.ComponentType.TextInput,
                            customId: 'output',
                            style: Discord.TextInputStyle.Short,
                            label: 'Please provide us with a link to your output.',
                            minLength: 5,
                            maxLength: 1024,
                            required: true,
                        },
                    ],
                }, {
                    type: Discord.ComponentType.ActionRow,
                    components: [
                        {
                            type: Discord.ComponentType.TextInput,
                            customId: 'issue',
                            style: Discord.TextInputStyle.Paragraph,
                            label: 'What are you having issues with?',
                            minLength: 1,
                            maxLength: 1024,
                            required: true,
                        },
                    ],
                },
            ],
        },
    }, {
        id: SupportTicketId.Recovery,
        name: 'Account Recovery',
        description: 'Recover products from an inaccessible account.',
        modal: {
            title: 'Account Recovery Questions',
            customId: 'account_recovery_modal',
            components: [
                {
                    type: Discord.ComponentType.ActionRow,
                    components: [
                        {
                            type: Discord.ComponentType.TextInput,
                            customId: 'old_roblox',
                            style: Discord.TextInputStyle.Short,
                            label: 'What is your old Roblox account ID?',
                            minLength: 5,
                            maxLength: 20,
                            required: true,
                        },
                    ],
                }, {
                    type: Discord.ComponentType.ActionRow,
                    components: [
                        {
                            type: Discord.ComponentType.TextInput,
                            customId: 'new_roblox',
                            style: Discord.TextInputStyle.Short,
                            label: 'What is your new Roblox account ID?',
                            minLength: 5,
                            maxLength: 20,
                            required: true,
                        },
                    ],
                }, {
                    type: Discord.ComponentType.ActionRow,
                    components: [
                        {
                            type: Discord.ComponentType.TextInput,
                            customId: 'old_discord',
                            style: Discord.TextInputStyle.Short,
                            label: 'What is your old Discord user ID?',
                            minLength: 10,
                            maxLength: 75,
                            required: true,
                        },
                    ],
                }, {
                    type: Discord.ComponentType.ActionRow,
                    components: [
                        {
                            type: Discord.ComponentType.TextInput,
                            customId: 'new_discord',
                            style: Discord.TextInputStyle.Short,
                            label: 'What is your new Discord user ID?',
                            minLength: 10,
                            maxLength: 75,
                            required: true,
                        },
                    ],
                }, {
                    type: Discord.ComponentType.ActionRow,
                    components: [
                        {
                            type: Discord.ComponentType.TextInput,
                            customId: 'recovery_reason',
                            style: Discord.TextInputStyle.Paragraph,
                            label: 'Why do you need to recover your account?',
                            minLength: 1,
                            maxLength: 1024,
                            required: true,
                        },
                    ],
                },
            ],
        },
    }, {
        id: SupportTicketId.Transfers,
        name: 'Transfer Products',
        description: 'Transfer or gift products to a different account.',
        modal: {
            title: 'Product Transfer Questions',
            customId: 'product_transfer_modal',
            components: [
                {
                    type: Discord.ComponentType.ActionRow,
                    components: [
                        {
                            type: Discord.ComponentType.TextInput,
                            customId: 'products',
                            style: Discord.TextInputStyle.Short,
                            label: 'What product(s) do you want to transfer?',
                            minLength: 3,
                            maxLength: 1024,
                            required: true,
                        },
                    ],
                }, {
                    type: Discord.ComponentType.ActionRow,
                    components: [
                        {
                            type: Discord.ComponentType.TextInput,
                            customId: 'discord_transfer_to',
                            style: Discord.TextInputStyle.Short,
                            label: 'Discord user ID that you\'re transferring to?',
                            minLength: 10,
                            maxLength: 75,
                            required: true,
                        },
                    ],
                }, {
                    type: Discord.ComponentType.ActionRow,
                    components: [
                        {
                            type: Discord.ComponentType.TextInput,
                            customId: 'roblox_transfer_to',
                            style: Discord.TextInputStyle.Short,
                            label: 'Roblox account that you\'re transferring to?',
                            minLength: 5,
                            maxLength: 20,
                            required: true,
                        },
                    ],
                }, {
                    type: Discord.ComponentType.ActionRow,
                    components: [
                        {
                            type: Discord.ComponentType.TextInput,
                            customId: 'transfer_reason',
                            style: Discord.TextInputStyle.Paragraph,
                            label: 'Why are you transferring your product(s)?',
                            minLength: 1,
                            maxLength: 1024,
                            required: true,
                        },
                    ],
                },
            ],
        },
    }, {
        id: SupportTicketId.Transactions,
        name: 'Transactions',
        description: 'Failed transactions or monetary issues with purchases.',
        modal: {
            title: 'Transaction Questions',
            customId: 'transaction_modal',
            components: [
                {
                    type: Discord.ComponentType.ActionRow,
                    components: [
                        {
                            type: Discord.ComponentType.TextInput,
                            customId: 'products',
                            style: Discord.TextInputStyle.Short,
                            label: 'What product(s) are involved?',
                            minLength: 3,
                            maxLength: 1024,
                            required: true,
                        },
                    ],
                }, {
                    type: Discord.ComponentType.ActionRow,
                    components: [
                        {
                            type: Discord.ComponentType.TextInput,
                            customId: 'time',
                            style: Discord.TextInputStyle.Short,
                            label: 'When did you attempt your purchase?',
                            placeholder: 'YYYY-MM-DD HH:MM:SS',
                            minLength: 3,
                            maxLength: 1024,
                            required: true,
                        },
                    ],
                }, {
                    type: Discord.ComponentType.ActionRow,
                    components: [
                        {
                            type: Discord.ComponentType.TextInput,
                            customId: 'issue',
                            style: Discord.TextInputStyle.Paragraph,
                            label: 'Fully describe the issue you\'re encountering.',
                            minLength: 1,
                            maxLength: 1024,
                            required: true,
                        },
                    ],
                },
            ],
        },
    }, {
        id: SupportTicketId.Other,
        name: 'Other & Quick Questions',
        description: 'For all other forms of support.',
        modal: {
            title: 'Other Questions',
            customId: 'other_questions_modal',
            components: [
                {
                    type: Discord.ComponentType.ActionRow,
                    components: [
                        {
                            type: Discord.ComponentType.TextInput,
                            customId: 'question',
                            style: Discord.TextInputStyle.Paragraph,
                            label: 'What can we help you with?',
                            minLength: 1,
                            maxLength: 1024,
                            required: true,
                        },
                    ],
                },
            ],
        },
    },
];

//------------------------------------------------------------//

export async function createSupportTicketChannel(
    guild: Discord.Guild,
    guild_member: Discord.GuildMember,
    support_category: SupportCategory
): Promise<Discord.TextChannel> {
    const support_tickets_category = guild.channels.resolve(support_tickets_category_id);

    if (!support_tickets_category) throw new Error('Can\'t find the support ticket category!');
    if (!(support_tickets_category instanceof Discord.CategoryChannel)) throw new Error('Support ticket category is not a category!');

    const support_channel_name = `${support_category.id}-${guild_member.id}`.toLowerCase();

    const potential_open_ticket_channel = guild.channels.cache.find(
        (channel) => channel.parentId === support_tickets_category.id && channel.name === support_channel_name
    );
    if (potential_open_ticket_channel) throw new Error('A support ticket channel is already open!');

    const support_ticket_channel = await guild.channels.create({
        name: support_channel_name,
        type: Discord.ChannelType.GuildText,
        topic: `${guild_member} | ${support_category.id} | Opened on <t:${Math.floor(Date.now() / 1000)}:F> | Staff may close this ticket using the \`close_ticket\` command.`,
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

export async function closeSupportTicketChannel(
    support_channel: Discord.GuildTextBasedChannel,
    save_transcript: boolean,
    member_that_closed_ticket: Discord.GuildMember,
    send_feedback_survey: boolean = false
): Promise<void> {
    if (save_transcript) {
        const support_ticket_category_id = support_channel.name.match(/([a-zA-Z\-\_])+(?![\-\_])\D/i)?.[0];
        if (!support_ticket_category_id) throw new Error('Unable to find the support ticket topic name!');

        const support_ticket_owner_id = support_channel.name.match(/(?!.*\-)?([0-9])+/i)?.[0];
        if (!support_ticket_owner_id) throw new Error('Unable to find the support ticket owner id!');

        const support_category = support_categories.find(({ id }) => id === support_ticket_category_id?.toUpperCase());
        const support_ticket_owner = await client.users.fetch(support_ticket_owner_id);

        const support_ticket_creation_timestamp = support_channel.createdTimestamp ? (
            `<t:${getMarkdownFriendlyTimestamp(support_channel.createdTimestamp)}:F>`
        ) : 'unknown';

        const transcript = await DiscordTranscripts.createTranscript(support_channel, {
            limit: -1,
            filename: `transcript_${support_channel.name}.html`,
            saveImages: true,
            poweredBy: false,
        });

        const channel_participant_ids = new Set(
            (
                await support_channel.messages.fetch().then(
                    msgs => msgs.filter(
                        (member) => member.author.id
                    )
                )
            ).map(
                (member) => member.author.id
            )
        );

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
                    value: `${support_ticket_creation_timestamp}`,
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
                }, {
                    name: 'Participants',
                    value: `${Array.from(channel_participant_ids).map(user_id => `<@!${user_id}>`).join(' - ')}`,
                    inline: false,
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
                            type: Discord.ComponentType.ActionRow,
                            components: [
                                {
                                    type: Discord.ComponentType.StringSelect,
                                    customId: 'support_user_feedback_survey_color',
                                    placeholder: 'Please select a rating to give our support staff!',
                                    minValues: 1,
                                    maxValues: 1,
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

                    if (!interaction.isStringSelectMenu()) return;

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
            } catch {
                // ignore any errors since the user might have their DMs closed
            }
        }
    }

    await Timer(support_ticket_cleanup_timeout_in_ms); // wait 10 seconds before deleting the channel

    await support_channel.delete().catch(console.warn);
}
