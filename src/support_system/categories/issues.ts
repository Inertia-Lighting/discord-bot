// ------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
// ------------------------------------------------------------//

import { CustomEmbed } from '@root/common/message';
import * as Discord from 'discord.js';

import { BaseSupportCategoryHandler } from '../core/base-handler';
import { SupportCategoryId, SupportTicketContext } from '../types';

/**
 * Handler for product issues support category
 */
export class ProductIssuesHandler extends BaseSupportCategoryHandler {
    readonly categoryId = SupportCategoryId.Issues;

    /**
     * Extracts responses from the modal interaction
     */
    protected extractResponses(interaction: Discord.ModalSubmitInteraction<'cached'>): Array<{
        question: string;
        answer: string;
    }> {
        return [
            {
                question: 'What product(s) are you having issue(s) with?',
                answer: interaction.fields.getTextInputValue('product'),
            },
            {
                question: 'Did you read the README? (yes, no)',
                answer: interaction.fields.getTextInputValue('read_me'),
            },
            {
                question: 'Did you enable HTTP Request (yes, no, idk)',
                answer: interaction.fields.getTextInputValue('http'),
            },
            {
                question: 'Please provide us with a link to your output.',
                answer: interaction.fields.getTextInputValue('output'),
            },
            {
                question: 'What are you having issues with?',
                answer: interaction.fields.getTextInputValue('issue'),
            },
        ];
    }

    /**
     * Sends additional messages specific to product issues
     */
     
    protected async sendAdditionalMessages(
        context: SupportTicketContext,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _interaction: Discord.ModalSubmitInteraction<'cached'>
    ): Promise<void> {
        await context.channel!.send({
            content: `${Discord.userMention(context.owner.id)}`,
            embeds: [
                CustomEmbed.from({
                    description: [
                        'Please follow the instructions below.',
                        'This is a common issue that affects most of our users.',
                        '',
                        'game.Workspace.StreamingEnabled being enabled is not compatible with most of our products.',
                        '',
                        'Follow the steps in [this guide](https://youtu.be/xApLkcuXwVk) to disable game.Workspace.StreamingEnabled.',
                    ].join('\n'),
                }),
            ],
        });
    }

    /**
     * Validates the modal input for product issues
     */
    async validateInput(interaction: Discord.ModalSubmitInteraction<'cached'>): Promise<boolean> {
        try {
            const product = interaction.fields.getTextInputValue('product');
            const readMe = interaction.fields.getTextInputValue('read_me');
            const http = interaction.fields.getTextInputValue('http');
            const output = interaction.fields.getTextInputValue('output');
            const issue = interaction.fields.getTextInputValue('issue');

            // Basic validation with more detailed logging
            if (!product || product.trim().length < 3) {
                console.error(`Product validation failed: "${product}"`);
                return false;
            }
            
            if (!readMe || !['yes', 'no'].includes(readMe.trim().toLowerCase())) {
                console.error(`ReadMe validation failed: "${readMe}"`);
                return false;
            }
            
            if (!http || !['yes', 'no', 'idk'].includes(http.trim().toLowerCase())) {
                console.error(`HTTP validation failed: "${http}"`);
                return false;
            }
            
            if (!output || output.trim().length < 5) {
                console.error(`Output validation failed: "${output}"`);
                return false;
            }
            
            if (!issue || issue.trim().length < 1) {
                console.error(`Issue validation failed: "${issue}"`);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error during validation:', error);
            return false;
        }
    }
}

/**
 * Configuration for the product issues support category
 */
export const ProductIssuesConfig = {
    id: SupportCategoryId.Issues,
    name: 'Product Tech Support',
    description: 'Product technical support can be found here.',
    staffRoleIds: [], // Will be populated by the configuration service
    isEnabled: true,
    modalConfig: {
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
            },
            {
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
            },
            {
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
            },
            {
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
            },
            {
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
    } as Discord.ModalComponentData,
};