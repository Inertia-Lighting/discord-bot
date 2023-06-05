//------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
//------------------------------------------------------------//

import { CustomInteraction, CustomInteractionAccessLevel } from '@root/bot/common/managers/custom_interactions_manager';

//------------------------------------------------------------//

import { Discord } from '../../discord_client';

//------------------------------------------------------------//

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

//------------------------------------------------------------//

export default new CustomInteraction({
    identifier: 'support_category_selection_menu',
    type: Discord.InteractionType.MessageComponent,
    data: undefined,
    metadata: {
        required_access_level: CustomInteractionAccessLevel.Public,
    },
    handler: async (discord_client, interaction) => {
        if (!interaction.isStringSelectMenu()) return;
        if (!interaction.inCachedGuild()) return;
        if (!interaction.channel) return;

        await interaction.deferReply({ ephemeral: false });

        await interaction.deferReply({ ephemeral: true });

        /**
         * @todo Investigate why this is here, it shouldn't be necessary.
         */
        await interaction.message.edit({
            components: [
                {
                    type: Discord.ComponentType.ActionRow,
                    components: [
                        {
                            type: Discord.ComponentType.StringSelect,
                            customId: 'support_category_selection_menu',
                            placeholder: 'Select a support category!',
                            minValues: 1,
                            maxValues: 1,
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

        const support_category_id = interaction.values.at(0);

        switch (support_category_id) {
            case 'ISSUES': {
                await interaction.showModal({
                    title: 'Support Issue Information',
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
                                },
                            ],
                        },
                    ],
                });

                break;
            }

            case 'RECOVERY': {
                await interaction.showModal({
                    title: 'Account Recovery Information',
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
                                },
                            ],
                        },
                    ],
                });

                break;
            }

            case 'TRANSFERS': {
                await interaction.showModal({
                    title: 'Product Transfer Information',
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
                                },
                            ],
                        },
                    ],
                });

                break;
            }

            case 'TRANSACTIONS': {
                await interaction.showModal({
                    title: 'Transactions Information',
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
                                },
                            ],
                        }, {
                            type: Discord.ComponentType.ActionRow,
                            components: [
                                {
                                    type: Discord.ComponentType.TextInput,
                                    customId: 'time',
                                    style: Discord.TextInputStyle.Short,
                                    label: 'When did you attempt your purchase? (DATE)',
                                    minLength: 3,
                                    maxLength: 1024,
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
                                },
                            ],
                        },
                    ],
                });

                break;
            }

            case 'OTHER': {
                await interaction.showModal({
                    title: 'Other & Questions Information',
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
                                },
                            ],
                        },
                    ],
                });

                break;
            }

            default: {
                await interaction.followUp('We\'re sorry that support topic is not open!');

                break;
            }
        }
    },
});
