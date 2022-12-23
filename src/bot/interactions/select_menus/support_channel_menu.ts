//------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
//------------------------------------------------------------//

//---------------------------------------------------------------------------------------------------------------//

import { Discord } from '../../discord_client';

//---------------------------------------------------------------------------------------------------------------//

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

export default {
    identifier: 'support_category_selection_menu',
    async execute(interaction: Discord.StringSelectMenuInteraction) {
        if (!interaction.inCachedGuild()) return;

        await interaction.message.edit({
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
                                description: description.slice(0, 100),
                                value: id,
                            })),
                        },
                    ],
                },
            ],
        });

        const [ supplied_support_ids ] = interaction.values;

        switch (supplied_support_ids) {
            case 'ISSUES': {
                await interaction.showModal({
                    title: 'Support Issue Information',
                    custom_id: 'support_issues_modal',
                    components: [
                        {
                            type: Discord.ComponentType.ActionRow,
                            components: [
                                {
                                    type: Discord.ComponentType.TextInput,
                                    custom_id: 'product',
                                    style: Discord.TextInputStyle.Short,
                                    label: 'What product(s) are you having issue(s) with?',
                                    min_length: 3,
                                    max_length: 1024,
                                },
                            ],
                        }, {
                            type: Discord.ComponentType.ActionRow,
                            components: [
                                {
                                    type: Discord.ComponentType.TextInput,
                                    custom_id: 'read_me',
                                    style: Discord.TextInputStyle.Short,
                                    label: 'Did you read the README? (Yes or No)',
                                    min_length: 2,
                                    max_length: 3,
                                },
                            ],
                        }, {
                            type: Discord.ComponentType.ActionRow,
                            components: [
                                {
                                    type: Discord.ComponentType.TextInput,
                                    custom_id: 'http',
                                    style: Discord.TextInputStyle.Short,
                                    label: 'Did you enable HTTP Request (Yes, No, or Idk)',
                                    min_length: 2,
                                    max_length: 3,
                                },
                            ],
                        }, {
                            type: Discord.ComponentType.ActionRow,
                            components: [
                                {
                                    type: Discord.ComponentType.TextInput,
                                    custom_id: 'output',
                                    style: Discord.TextInputStyle.Short,
                                    label: 'Please provide us with a link to your output.',
                                    min_length: 5,
                                    max_length: 1024,
                                },
                            ],
                        }, {
                            type: Discord.ComponentType.ActionRow,
                            components: [
                                {
                                    type: Discord.ComponentType.TextInput,
                                    custom_id: 'issue',
                                    style: Discord.TextInputStyle.Paragraph,
                                    label: 'What are you having issues with?',
                                    min_length: 1,
                                    max_length: 1024,
                                },
                            ],
                        },
                    ],
                });
                break;
            } case 'RECOVERY': {
                await interaction.showModal({
                    title: 'Account Recovery Information',
                    custom_id: 'account_recovery_modal',
                    components: [
                        {
                            type: Discord.ComponentType.ActionRow,
                            components: [
                                {
                                    type: Discord.ComponentType.TextInput,
                                    custom_id: 'old_roblox',
                                    style: Discord.TextInputStyle.Short,
                                    label: 'What is your old Roblox account ID?',
                                    min_length: 5,
                                    max_length: 20,
                                },
                            ],
                        }, {
                            type: Discord.ComponentType.ActionRow,
                            components: [
                                {
                                    type: Discord.ComponentType.TextInput,
                                    custom_id: 'new_roblox',
                                    style: Discord.TextInputStyle.Short,
                                    label: 'What is your new Roblox account ID?',
                                    min_length: 5,
                                    max_length: 20,
                                },
                            ],
                        }, {
                            type: Discord.ComponentType.ActionRow,
                            components: [
                                {
                                    type: Discord.ComponentType.TextInput,
                                    custom_id: 'old_discord',
                                    style: Discord.TextInputStyle.Short,
                                    label: 'What is your old Discord user ID?',
                                    min_length: 10,
                                    max_length: 75,
                                },
                            ],
                        }, {
                            type: Discord.ComponentType.ActionRow,
                            components: [
                                {
                                    type: Discord.ComponentType.TextInput,
                                    custom_id: 'new_discord',
                                    style: Discord.TextInputStyle.Short,
                                    label: 'What is your new Discord user ID?',
                                    min_length: 10,
                                    max_length: 75,
                                },
                            ],
                        }, {
                            type: Discord.ComponentType.ActionRow,
                            components: [
                                {
                                    type: Discord.ComponentType.TextInput,
                                    custom_id: 'recovery_reason',
                                    style: Discord.TextInputStyle.Paragraph,
                                    label: 'Why do you need to recover your account?',
                                    min_length: 1,
                                    max_length: 1024,
                                },
                            ],
                        },
                    ],
                });
                break;
            } case 'TRANSFERS': {
                await interaction.showModal({
                    title: 'Product Transfer Information',
                    custom_id: 'product_transfer_modal',
                    components: [
                        {
                            type: Discord.ComponentType.ActionRow,
                            components: [
                                {
                                    type: Discord.ComponentType.TextInput,
                                    custom_id: 'products',
                                    style: Discord.TextInputStyle.Short,
                                    label: 'What product(s) do you want to transfer?',
                                    min_length: 3,
                                    max_length: 1024,
                                },
                            ],
                        }, {
                            type: Discord.ComponentType.ActionRow,
                            components: [
                                {
                                    type: Discord.ComponentType.TextInput,
                                    custom_id: 'discord_transfer_to',
                                    style: Discord.TextInputStyle.Short,
                                    label: 'Discord user ID that you\'re transferring to?',
                                    min_length: 10,
                                    max_length: 75,
                                },
                            ],
                        }, {
                            type: Discord.ComponentType.ActionRow,
                            components: [
                                {
                                    type: Discord.ComponentType.TextInput,
                                    custom_id: 'roblox_transfer_to',
                                    style: Discord.TextInputStyle.Short,
                                    label: 'Roblox account that you\'re transferring to?',
                                    min_length: 5,
                                    max_length: 20,
                                },
                            ],
                        }, {
                            type: Discord.ComponentType.ActionRow,
                            components: [
                                {
                                    type: Discord.ComponentType.TextInput,
                                    custom_id: 'transfer_reason',
                                    style: Discord.TextInputStyle.Paragraph,
                                    label: 'Why are you transferring your product(s)?',
                                    min_length: 1,
                                    max_length: 1024,
                                },
                            ],
                        },
                    ],
                });
                break;
            } case 'TRANSACTIONS': {
                await interaction.showModal({
                    title: 'Transactions Information',
                    custom_id: 'transaction_modal',
                    components: [
                        {
                            type: Discord.ComponentType.ActionRow,
                            components: [
                                {
                                    type: Discord.ComponentType.TextInput,
                                    custom_id: 'products',
                                    style: Discord.TextInputStyle.Short,
                                    label: 'What product(s) are involved?',
                                    min_length: 3,
                                    max_length: 1024,
                                },
                            ],
                        }, {
                            type: Discord.ComponentType.ActionRow,
                            components: [
                                {
                                    type: Discord.ComponentType.TextInput,
                                    custom_id: 'time',
                                    style: Discord.TextInputStyle.Short,
                                    label: 'When did you attempt your purchase? (DATE)',
                                    min_length: 3,
                                    max_length: 1024,
                                },
                            ],
                        }, {
                            type: Discord.ComponentType.ActionRow,
                            components: [
                                {
                                    type: Discord.ComponentType.TextInput,
                                    custom_id: 'issue',
                                    style: Discord.TextInputStyle.Paragraph,
                                    label: 'Fully describe the issue you\'re encountering.',
                                    min_length: 1,
                                    max_length: 1024,
                                },
                            ],
                        },
                    ],
                });
                break;
            } case 'OTHER': {
                await interaction.showModal({
                    title: 'Other & Questions Information',
                    custom_id: 'other_questions_modal',
                    components: [
                        {
                            type: Discord.ComponentType.ActionRow,
                            components: [
                                {
                                    type: Discord.ComponentType.TextInput,
                                    custom_id: 'question',
                                    style: Discord.TextInputStyle.Paragraph,
                                    label: 'What can we help you with?',
                                    min_length: 1,
                                    max_length: 1024,
                                },
                            ],
                        },
                    ],
                });
                break;
            }
            default: {
                interaction.reply('We\'re sorry that support topic is not open!');
                break;
            }
        }
    },
};
