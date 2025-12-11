// ------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
// ------------------------------------------------------------//

import * as Discord from 'discord.js';

import { BaseSupportCategoryHandler } from '../core/base-handler.js'
;
import { SupportCategoryId } from '../types/index.js'
;

/**
 * Handler for product transfers support category
 */
export class ProductTransfersHandler extends BaseSupportCategoryHandler {
    readonly categoryId = SupportCategoryId.Transfers;

    /**
     * Extracts responses from the modal interaction
     */
    protected extractResponses(interaction: Discord.ModalSubmitInteraction<'cached'>): Array<{
        question: string;
        answer: string;
    }> {
        return [
            {
                question: 'What product(s) do you want to transfer?',
                answer: interaction.fields.getTextInputValue('products'),
            },
            {
                question: 'Discord user id that you\'re transferring to?',
                answer: interaction.fields.getTextInputValue('discord_transfer_to'),
            },
            {
                question: 'Roblox user id that you\'re transferring to?',
                answer: interaction.fields.getTextInputValue('roblox_transfer_to'),
            },
            {
                question: 'Why are you transferring your product(s)?',
                answer: interaction.fields.getTextInputValue('transfer_reason'),
            },
        ];
    }

    /**
     * Validates the modal input for product transfers
     */
    async validateInput(interaction: Discord.ModalSubmitInteraction<'cached'>): Promise<boolean> {
        const products = interaction.fields.getTextInputValue('products');
        const discordTransferTo = interaction.fields.getTextInputValue('discord_transfer_to');
        const robloxTransferTo = interaction.fields.getTextInputValue('roblox_transfer_to');
        const reason = interaction.fields.getTextInputValue('transfer_reason');

        // Basic validation
        if (!products || products.length < 3) return false;
        if (!discordTransferTo || discordTransferTo.length < 10 || !/^\d+$/.test(discordTransferTo)) return false;
        if (!robloxTransferTo || robloxTransferTo.length < 5 || !/^\d+$/.test(robloxTransferTo)) return false;
        if (!reason || reason.length < 1) return false;

        return true;
    }
}

/**
 * Configuration for the product transfers support category
 */
export const ProductTransfersConfig = {
    id: SupportCategoryId.Transfers,
    name: 'Transfer Products',
    description: 'Transfer or gift products to a different account.',
    staffRoleIds: [], // Will be populated by the configuration service
    isEnabled: true,
    modalConfig: {
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
            },
            {
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
            },
            {
                type: Discord.ComponentType.ActionRow,
                components: [
                    {
                        type: Discord.ComponentType.TextInput,
                        customId: 'roblox_transfer_to',
                        style: Discord.TextInputStyle.Short,
                        label: 'Roblox user id that you\'re transferring to?',
                        placeholder: '998796',
                        minLength: 5,
                        maxLength: 20,
                        required: true,
                    },
                ],
            },
            {
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
    } as Discord.ModalComponentData,
};