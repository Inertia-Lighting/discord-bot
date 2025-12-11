// ------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
// ------------------------------------------------------------//

import * as Discord from 'discord.js';

import { BaseSupportCategoryHandler } from '../core/base-handler.js'
;
import { SupportCategoryId } from '../types/index.js'
;

/**
 * Handler for account recovery support category
 */
export class AccountRecoveryHandler extends BaseSupportCategoryHandler {
    readonly categoryId = SupportCategoryId.Recovery;

    /**
     * Extracts responses from the modal interaction
     */
    protected extractResponses(interaction: Discord.ModalSubmitInteraction<'cached'>): Array<{
        question: string;
        answer: string;
    }> {
        return [
            {
                question: 'What is your old Roblox user id?',
                answer: interaction.fields.getTextInputValue('old_roblox'),
            },
            {
                question: 'What is your new Roblox user id?',
                answer: interaction.fields.getTextInputValue('new_roblox'),
            },
            {
                question: 'What is your old Discord user id?',
                answer: interaction.fields.getTextInputValue('old_discord'),
            },
            {
                question: 'What is your new Discord user id?',
                answer: interaction.fields.getTextInputValue('new_discord'),
            },
            {
                question: 'Why do you need to recover your account?',
                answer: interaction.fields.getTextInputValue('recovery_reason'),
            },
        ];
    }

    /**
     * Validates the modal input for account recovery
     */
    async validateInput(interaction: Discord.ModalSubmitInteraction<'cached'>): Promise<boolean> {
        try {
            const oldRoblox = interaction.fields.getTextInputValue('old_roblox');
            const newRoblox = interaction.fields.getTextInputValue('new_roblox');
            const oldDiscord = interaction.fields.getTextInputValue('old_discord');
            const newDiscord = interaction.fields.getTextInputValue('new_discord');
            const reason = interaction.fields.getTextInputValue('recovery_reason');

            // Basic validation with better error reporting
            if (!oldRoblox || oldRoblox.trim().length < 5 || !/^\d+$/.test(oldRoblox.trim())) {
                console.error(`Old Roblox ID validation failed: "${oldRoblox}"`);
                return false;
            }
            
            if (!newRoblox || newRoblox.trim().length < 5 || !/^\d+$/.test(newRoblox.trim())) {
                console.error(`New Roblox ID validation failed: "${newRoblox}"`);
                return false;
            }
            
            if (!oldDiscord || oldDiscord.trim().length < 10 || !/^\d+$/.test(oldDiscord.trim())) {
                console.error(`Old Discord ID validation failed: "${oldDiscord}"`);
                return false;
            }
            
            if (!newDiscord || newDiscord.trim().length < 10 || !/^\d+$/.test(newDiscord.trim())) {
                console.error(`New Discord ID validation failed: "${newDiscord}"`);
                return false;
            }
            
            if (!reason || reason.trim().length < 1) {
                console.error(`Recovery reason validation failed: "${reason}"`);
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
 * Configuration for the account recovery support category
 */
export const AccountRecoveryConfig = {
    id: SupportCategoryId.Recovery,
    name: 'Account Recovery',
    description: 'Recover products from an inaccessible account.',
    staffRoleIds: [], // Will be populated by the configuration service
    isEnabled: true,
    modalConfig: {
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
                        label: 'What is your old Roblox user id?',
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
                        customId: 'new_roblox',
                        style: Discord.TextInputStyle.Short,
                        label: 'What is your new Roblox user id?',
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
                        customId: 'old_discord',
                        style: Discord.TextInputStyle.Short,
                        label: 'What is your old Discord user id?',
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
                        customId: 'new_discord',
                        style: Discord.TextInputStyle.Short,
                        label: 'What is your new Discord user id?',
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
    } as Discord.ModalComponentData,
};