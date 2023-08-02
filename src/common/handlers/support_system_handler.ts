//------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
//------------------------------------------------------------//

import * as Discord from 'discord.js';

import * as DiscordTranscripts from 'discord-html-transcripts';

import { CustomEmbed } from '@root/common/message';

import { delay, getMarkdownFriendlyTimestamp } from '@root/utilities';

//------------------------------------------------------------//

const support_tickets_category_id = `${process.env.BOT_SUPPORT_TICKETS_CATEGORY_ID ?? ''}`;
if (support_tickets_category_id.length < 1) throw new Error('Environment variable: BOT_SUPPORT_TICKETS_CATEGORY_ID; is not set correctly.');

const support_tickets_transcripts_channel_id = `${process.env.BOT_SUPPORT_TICKETS_TRANSCRIPTS_CHANNEL_ID ?? ''}`;
if (support_tickets_transcripts_channel_id.length < 1) throw new Error('Environment variable: BOT_SUPPORT_TICKETS_TRANSCRIPTS_CHANNEL_ID; is not set correctly.');

//------------------------------------------------------------//

const bot_database_support_staff_role_id = `${process.env.BOT_SUPPORT_STAFF_DATABASE_ROLE_ID ?? ''}`;
if (bot_database_support_staff_role_id.length < 1) throw new Error('Environment variable: BOT_SUPPORT_STAFF_DATABASE_ROLE_ID; is not set correctly.');

const bot_other_support_staff_role_id = `${process.env.BOT_SUPPORT_STAFF_OTHER_ROLE_ID ?? ''}`;
if (bot_other_support_staff_role_id.length < 1) throw new Error('Environment variable: BOT_SUPPORT_STAFF_OTHER_ROLE_ID; is not set correctly.');

const bot_product_issues_support_staff_role_id = `${process.env.BOT_SUPPORT_STAFF_PRODUCT_ISSUES_ROLE_ID ?? ''}`;
if (bot_product_issues_support_staff_role_id.length < 1) throw new Error('Environment variable: BOT_SUPPORT_STAFF_PRODUCT_ISSUES_ROLE_ID; is not set correctly.');

const bot_product_purchases_support_staff_role_id = `${process.env.BOT_SUPPORT_STAFF_PRODUCT_PURCHASES_ROLE_ID ?? ''}`;
if (bot_product_purchases_support_staff_role_id.length < 1) throw new Error('Environment variable: BOT_SUPPORT_STAFF_PRODUCT_PURCHASES_ROLE_ID; is not set correctly.');

const bot_partnership_requests_support_staff_role_id = `${process.env.BOT_SUPPORT_STAFF_PARTNERSHIP_REQUESTS_ROLE_ID ?? ''}`;
if (bot_partnership_requests_support_staff_role_id.length < 1) throw new Error('Environment variable: BOT_SUPPORT_STAFF_PARTNERSHIP_REQUESTS_ROLE_ID; is not set correctly.');

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

/**
 * Do not modify the values of this enum.
 */
export enum SupportCategoryId {
    Issues = 'ISSUES',
    Recovery = 'RECOVERY',
    Transfers = 'TRANSFERS',
    Transactions = 'TRANSACTIONS',
    PartnershipRequests = 'PARTNERS',
    Other = 'OTHER',
}

export type SupportCategory = {
    id: SupportCategoryId,
    name: string,
    description: string,
    staff_role_ids: string[],
    modal_data: Discord.ModalComponentData,
    modal_handler: (
        interaction: Discord.ModalSubmitInteraction<'cached'>,
        support_category: SupportCategory,
        support_ticket_channel: Discord.TextChannel,
        support_ticket_owner: Discord.GuildMember,
    ) => Promise<void>,
};

export const support_categories: SupportCategory[] = [
    {
        id: SupportCategoryId.Issues,
        name: 'Product Tech Support',
        description: 'Product technical support can be found here.',
        staff_role_ids: [
            bot_product_issues_support_staff_role_id,
        ],
        modal_data: {
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
                            label: 'Did you read the README? (yes, no)',
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
                            label: 'Did you enable HTTP Requests (yes, no, idk)',
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
                            placeholder: 'https://pastebin.com/...',
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
        modal_handler: async (
            interaction,
            support_category,
            support_ticket_channel,
            support_ticket_owner,
        ) => {
            const answer_for_product = interaction.fields.getTextInputValue('product');
            const answer_for_read_me = interaction.fields.getTextInputValue('read_me');
            const answer_for_http = interaction.fields.getTextInputValue('http');
            const answer_for_output = interaction.fields.getTextInputValue('output');
            const answer_for_issue = interaction.fields.getTextInputValue('issue');

            await support_ticket_channel.send({
                embeds: [
                    CustomEmbed.from({
                        author: {
                            icon_url: interaction.client.user.displayAvatarURL({ forceStatic: false }),
                            name: 'Inertia Lighting | Support System',
                        },
                        description: [
                            '**What product(s) are you having issue(s) with?**',
                            `${answer_for_product}`,
                            '',
                            '**Did you read the README? (yes, no)**',
                            `${answer_for_read_me}`,
                            '',
                            '**Did you enable HTTP Request (yes, no, idk)**',
                            `${answer_for_http}`,
                            '',
                            '**Please provide us with a link to your output.**',
                            `${answer_for_output}`,
                            '',
                            '**What are you having issues with?**',
                            `${answer_for_issue}`,
                        ].join('\n'),
                    }),
                ],
            });
            await support_ticket_channel.send({
                content: [
                    `${Discord.userMention(support_ticket_owner.id)}, As an initial troubleshooting step, please follow the instructions below while you wait for a response from our support staff.`,
                    '',
                    '`StreamingEnabled` is not compatible with most of our products.',
                    '',
                    'Please follow the steps in this [guide](https://youtu.be/xApLkcuXwVk) to disable `game.Workspace.StreamingEnabled`.',
                ].join('\n'),
            });
        },
    }, {
        id: SupportCategoryId.Recovery,
        name: 'Account Recovery',
        description: 'Recover products from an inaccessible account.',
        staff_role_ids: [
            bot_database_support_staff_role_id,
        ],
        modal_data: {
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
                            label: 'What is your old Roblox account id?',
                            placeholder: '998796',
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
                            label: 'What is your new Roblox account id?',
                            placeholder: '998796',
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
                            label: 'What is your old Discord user id?',
                            placeholder: '735556164749885450',
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
                            label: 'What is your new Discord user id?',
                            placeholder: '735556164749885450',
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
        modal_handler: async (
            interaction,
            support_category,
            support_ticket_channel,
            support_ticket_owner,
        ) => {
            const old_roblox_account_id = interaction.fields.getTextInputValue('old_roblox');
            const new_roblox_account_id = interaction.fields.getTextInputValue('new_roblox');
            const old_discord_user_id = interaction.fields.getTextInputValue('old_discord');
            const new_discord_user_id = interaction.fields.getTextInputValue('new_discord');
            const recovery_reason = interaction.fields.getTextInputValue('recovery_reason');

            await support_ticket_channel.send({
                embeds: [
                    CustomEmbed.from({
                        author: {
                            icon_url: interaction.client.user.displayAvatarURL({ forceStatic: false }),
                            name: 'Inertia Lighting | Support System',
                        },
                        description: [
                            '**What is your old Roblox account id?**',
                            `${old_roblox_account_id}`,
                            '',
                            '**What is your new Roblox account id?**',
                            `${new_roblox_account_id}`,
                            '',
                            '**What is your old Discord user id?**',
                            `${old_discord_user_id}`,
                            '',
                            '**What is your new Discord user id?**',
                            `${new_discord_user_id}`,
                            '',
                            '**Why do you need to recover your account?**',
                            `${recovery_reason}`,
                        ].join('\n'),
                    }),
                ],
            });
        },
    }, {
        id: SupportCategoryId.Transfers,
        name: 'Transfer Products',
        description: 'Transfer or gift products to a different account.',
        staff_role_ids: [
            bot_database_support_staff_role_id,
        ],
        modal_data: {
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
                            label: 'Discord user id that you\'re transferring to?',
                            placeholder: '735556164749885450',
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
                            placeholder: '998796',
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
        modal_handler: async (
            interaction,
            support_category,
            support_ticket_channel,
            support_ticket_owner,
        ) => {
            const products = interaction.fields.getTextInputValue('products');
            const discord_transfer_to = interaction.fields.getTextInputValue('discord_transfer_to');
            const roblox_transfer_to = interaction.fields.getTextInputValue('roblox_transfer_to');
            const transfer_reason = interaction.fields.getTextInputValue('transfer_reason');

            await support_ticket_channel.send({
                embeds: [
                    CustomEmbed.from({
                        author: {
                            icon_url: interaction.client.user.displayAvatarURL({ forceStatic: false }),
                            name: 'Inertia Lighting | Support System',
                        },
                        description: [
                            '**What product(s) do you want to transfer?**',
                            `${products}`,
                            '',
                            '**Discord user id that you\'re transferring to?**',
                            `${discord_transfer_to}`,
                            '',
                            '**Roblox account that you\'re transferring to?**',
                            `${roblox_transfer_to}`,
                            '',
                            '**Why are you transferring your product(s)?**',
                            `${transfer_reason}`,
                        ].join('\n'),
                    }),
                ],
            });
        },
    }, {
        id: SupportCategoryId.Transactions,
        name: 'Transactions',
        description: 'Failed transactions or monetary issues with purchases.',
        staff_role_ids: [
            bot_product_purchases_support_staff_role_id,
        ],
        modal_data: {
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
        modal_handler: async (
            interaction,
            support_category,
            support_ticket_channel,
            support_ticket_owner,
        ) => {
            const answer_for_products = interaction.fields.getTextInputValue('products');
            const answer_for_time = interaction.fields.getTextInputValue('time');
            const answer_for_issue = interaction.fields.getTextInputValue('issue');

            await support_ticket_channel.send({
                embeds: [
                    CustomEmbed.from({
                        author: {
                            icon_url: interaction.client.user.displayAvatarURL({ forceStatic: false }),
                            name: 'Inertia Lighting | Support System',
                        },
                        description: [
                            '**What product(s) are involved?**',
                            `${answer_for_products}`,
                            '',
                            '**When did you attempt your purchase?**',
                            `${answer_for_time}`,
                            '',
                            '**Fully describe the issue you\'re encountering.**',
                            `${answer_for_issue}`,
                        ].join('\n'),
                    }),
                ],
            });
        },
    }, {
        id: SupportCategoryId.PartnershipRequests,
        name: 'Partnership Requests',
        description: 'Interested in partnering with us?',
        staff_role_ids: [
            bot_partnership_requests_support_staff_role_id,
        ],
        modal_data: {
            title: 'Partnership Request Questions',
            customId: 'support_system_partnership_request_modal',
            components: [
                {
                    type: Discord.ComponentType.ActionRow,
                    components: [
                        {
                            type: Discord.ComponentType.TextInput,
                            customId: 'group_name',
                            style: Discord.TextInputStyle.Short,
                            label: 'What is the name of your group?',
                            minLength: 1,
                            maxLength: 64,
                            required: true,
                        },
                    ],
                }, {
                    type: Discord.ComponentType.ActionRow,
                    components: [
                        {
                            type: Discord.ComponentType.TextInput,
                            customId: 'group_owner_age',
                            style: Discord.TextInputStyle.Short,
                            label: 'How old are you?',
                            minLength: 1,
                            maxLength: 4,
                            required: true,
                        },
                    ],
                }, {
                    type: Discord.ComponentType.ActionRow,
                    components: [
                        {
                            type: Discord.ComponentType.TextInput,
                            customId: 'group_description',
                            style: Discord.TextInputStyle.Paragraph,
                            label: 'Describe your group, be detailed.',
                            minLength: 128,
                            maxLength: 1024,
                            required: true,
                        },
                    ],
                }, {
                    type: Discord.ComponentType.ActionRow,
                    components: [
                        {
                            type: Discord.ComponentType.TextInput,
                            customId: 'group_reason',
                            style: Discord.TextInputStyle.Paragraph,
                            label: 'Why do you want to partner with us?',
                            minLength: 128,
                            maxLength: 1024,
                            required: true,
                        },
                    ],
                }, {
                    type: Discord.ComponentType.ActionRow,
                    components: [
                        {
                            type: Discord.ComponentType.TextInput,
                            customId: 'group_social_links',
                            style: Discord.TextInputStyle.Paragraph,
                            label: 'Link your socials: Discord, Roblox, etc.',
                            minLength: 32,
                            maxLength: 1024,
                            required: true,
                        },
                    ],
                },
            ],
        },
        modal_handler: async (
            interaction,
            support_category,
            support_ticket_channel,
            support_ticket_owner,
        ) => {
            const group_name = interaction.fields.getTextInputValue('group_name');
            const group_owner_age = interaction.fields.getTextInputValue('group_owner_age');
            const group_description = interaction.fields.getTextInputValue('group_description');
            const group_reason = interaction.fields.getTextInputValue('group_reason');
            const group_social_links = interaction.fields.getTextInputValue('group_social_links');

            await support_ticket_channel.send({
                embeds: [
                    CustomEmbed.from({
                        author: {
                            icon_url: interaction.client.user.displayAvatarURL({ forceStatic: false }),
                            name: 'Inertia Lighting | Support System',
                        },
                        description: [
                            '**What is the name of your group?**',
                            `${group_name}`,
                            '',
                            '**How old are you?**',
                            `${group_owner_age}`,
                            '',
                            '**Describe your group.**',
                            `${group_description}`,
                            '',
                            '**Why do you want to partner with us?**',
                            `${group_reason}`,
                            '',
                            '**What are your group\'s social links?**',
                            `${group_social_links}`,
                        ].join('\n'),
                    }),
                ],
            });
        },
    }, {
        id: SupportCategoryId.Other,
        name: 'Other & Quick Questions',
        description: 'For all other forms of support.',
        staff_role_ids: [
            bot_other_support_staff_role_id,
        ],
        modal_data: {
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
                            label: 'How can we help? (be detailed)',
                            minLength: 32,
                            maxLength: 1024,
                            required: true,
                        },
                    ],
                },
            ],
        },
        modal_handler: async (
            interaction,
            support_category,
            support_ticket_channel,
            support_ticket_owner,
        ) => {
            const question = interaction.fields.getTextInputValue('question');

            await support_ticket_channel.send({
                embeds: [
                    CustomEmbed.from({
                        author: {
                            icon_url: interaction.client.user.displayAvatarURL({ forceStatic: false }),
                            name: 'Inertia Lighting | Support System',
                        },
                        description: [
                            '**What can we help you with?**',
                            `${question}`,
                        ].join('\n'),
                    }),
                ],
            });
        },
    },
];

//------------------------------------------------------------//

async function sendInitialInformationToSupportTicketChannel(
    support_ticket_channel: Discord.TextChannel,
    support_ticket_category: SupportCategory,
    support_ticket_owner: Discord.GuildMember,
): Promise<void> {
    const support_ticket_staff_role_mentions = support_ticket_category.staff_role_ids.map(
        (role_id) => Discord.roleMention(role_id)
    ).join(', ');

    const initial_message = await support_ticket_channel.send({
        content: [
            `${support_ticket_owner}, welcome to your ${support_ticket_category.name} support ticket,`,
            '',
            `Our ${support_ticket_staff_role_mentions} support staff are volunteers, so please be patient.`,
            '',
            'If you have an urgent issue, like someone making death threats;',
            'please @mention one of our high-ranking staff members!',
        ].join('\n'),
    });

    await initial_message.pin();
}

export async function createSupportTicketChannel(
    guild: Discord.Guild,
    support_ticket_owner: Discord.GuildMember,
    support_ticket_category: SupportCategory
): Promise<Discord.TextChannel> {
    const support_tickets_category = await guild.channels.fetch(support_tickets_category_id);
    if (!support_tickets_category) throw new Error('Can\'t find the support ticket category!');
    if (support_tickets_category.type !== Discord.ChannelType.GuildCategory) throw new Error('Support ticket category is not a category!');

    const support_channel_name = `${support_ticket_category.id}-${support_ticket_owner.id}`.toLowerCase();

    const potential_open_ticket_channel = guild.channels.cache.find(
        (channel) =>
            channel.parentId === support_tickets_category.id &&
            channel.name === support_channel_name
    );
    if (potential_open_ticket_channel) return potential_open_ticket_channel as Discord.TextChannel;

    const support_ticket_channel = await guild.channels.create({
        name: support_channel_name,
        type: Discord.ChannelType.GuildText,
        topic: `${support_ticket_owner} | ${support_ticket_category.id} | Opened on <t:${Math.floor(Date.now() / 1000)}:F> | Staff may close this ticket using the \`close_ticket\` command.`,
        parent: support_tickets_category,
        permissionOverwrites: [
            ...support_tickets_category.permissionOverwrites.cache.values(), // clone the parent channel permissions
            {
                id: process.env.BOT_STAFF_ROLE_ID as string,
                allow: [ Discord.PermissionFlagsBits.ViewChannel, Discord.PermissionFlagsBits.SendMessages ],
            }, {
                id: support_ticket_owner.id,
                allow: [ Discord.PermissionFlagsBits.ViewChannel, Discord.PermissionFlagsBits.SendMessages ],
            },
        ],
    });

    await sendInitialInformationToSupportTicketChannel(support_ticket_channel, support_ticket_category, support_ticket_owner);

    return support_ticket_channel;
}

export async function closeSupportTicketChannel(
    support_channel: Discord.GuildTextBasedChannel,
    save_transcript: boolean,
    member_that_closed_ticket: Discord.GuildMember,
    send_feedback_survey: boolean = false
): Promise<void> {
    const client = support_channel.client;

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
                    value: Discord.userMention(support_ticket_owner.id),
                    inline: true,
                }, {
                    name: 'Closed By',
                    value: Discord.userMention(member_that_closed_ticket.id),
                    inline: true,
                }, {
                    name: 'Participants',
                    value: `${Array.from(channel_participant_ids).map(user_id => Discord.userMention(user_id)).join(' - ')}`,
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
                    filter: (component_interaction) => component_interaction.user.id === support_ticket_owner.id,
                    time: user_feedback_survey_collector_timeout_in_ms,
                    max: 1,
                });

                user_feedback_survey_components_collector.on('collect', async (component_interaction) => {
                    await component_interaction.deferUpdate();

                    if (!component_interaction.isStringSelectMenu()) return;

                    switch (component_interaction.customId) {
                        case 'support_user_feedback_survey_color': {
                            const satisfaction_level_key = component_interaction.values.at(0) as keyof typeof satisfaction_levels;
                            const satisfaction_level = satisfaction_levels[satisfaction_level_key];

                            const customer_review_embed = CustomEmbed.from({
                                color: satisfaction_level.color ?? CustomEmbed.Color.Brand,
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
                                        title: 'Thank you!',
                                        description: 'Your feedback has been recorded.',
                                    }),
                                ],
                            }).catch(console.warn);

                            break;
                        }

                        default: {
                            return; // don't continue if the custom id is unknown
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

    await delay(support_ticket_cleanup_timeout_in_ms); // wait a bit before deleting the channel

    try {
        await support_channel.delete();
    } catch {
        // ignore any errors
    }
}

export async function handleSupportTicketCategoryModalSubmit(
    interaction: Discord.ModalSubmitInteraction<'cached'>,
    support_category_id: SupportCategoryId,
): Promise<void> {
    await interaction.deferReply({
        ephemeral: true,
        fetchReply: true,
    });

    const support_ticket_owner = interaction.member;

    const support_category = support_categories.find(({ id }) => id === support_category_id);
    if (!support_category) throw new Error('Unable to find the support ticket category!');

    const support_ticket_channel = await createSupportTicketChannel(interaction.guild, interaction.member, support_category);

    const modal_reply_message = await interaction.editReply({
        content: [
            `You selected ${support_category.name}.`,
            `Go to ${Discord.channelMention(support_ticket_channel.id)} to continue.`,
        ].join('\n'),
    });

    setTimeout(async () => {
        try {
            await interaction.deleteReply(modal_reply_message);
        } catch {
            // ignore any errors
        }
    }, 30_000); // wait a bit to delete the replies

    await support_category.modal_handler(
        interaction,
        support_category,
        support_ticket_channel,
        support_ticket_owner,
    );
}
