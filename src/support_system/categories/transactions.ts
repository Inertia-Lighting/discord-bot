// ------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
// ------------------------------------------------------------//

import * as Discord from 'discord.js';

import { BaseSupportCategoryHandler } from '../core/base-handler.js'
;
import { SupportCategoryId } from '../types/index.js'
;

/**
 * Handler for product transactions support category
 */
export class ProductTransactionsHandler extends BaseSupportCategoryHandler {
    readonly categoryId = SupportCategoryId.Transactions;

    /**
     * Extracts responses from the modal interaction
     */
    protected extractResponses(interaction: Discord.ModalSubmitInteraction<'cached'>): Array<{
        question: string;
        answer: string;
    }> {
        return [
            {
                question: 'What product(s) are involved?',
                answer: interaction.fields.getTextInputValue('products'),
            },
            {
                question: 'When did you attempt your purchase?',
                answer: interaction.fields.getTextInputValue('time'),
            },
            {
                question: 'Fully describe the issue you\'re encountering.',
                answer: interaction.fields.getTextInputValue('issue'),
            },
        ];
    }

    /**
     * Validates the modal input for product transactions
     */
    async validateInput(interaction: Discord.ModalSubmitInteraction<'cached'>): Promise<boolean> {
        const products = interaction.fields.getTextInputValue('products');
        const time = interaction.fields.getTextInputValue('time');
        const issue = interaction.fields.getTextInputValue('issue');

        // Basic validation
        if (!products || products.length < 3) return false;
        if (!time || time.length < 3) return false;
        if (!issue || issue.length < 1) return false;

        return true;
    }
}

/**
 * Configuration for the product transactions support category
 */
export const ProductTransactionsConfig = {
    id: SupportCategoryId.Transactions,
    name: 'Transactions',
    description: 'Failed transactions or monetary issues with purchases.',
    staffRoleIds: [], // Will be populated by the configuration service
    isEnabled: true,
    modalConfig: {
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
            },
            {
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
            },
            {
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
    } as Discord.ModalComponentData,
};