// ------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
// ------------------------------------------------------------//

import * as Discord from 'discord.js';

import { BaseSupportCategoryHandler } from '../core/base-handler.js'
;
import { SupportCategoryId } from '../types/index.js'
;

/**
 * Handler for other questions support category
 */
export class OtherQuestionsHandler extends BaseSupportCategoryHandler {
    readonly categoryId = SupportCategoryId.Other;

    /**
     * Extracts responses from the modal interaction
     */
    protected extractResponses(interaction: Discord.ModalSubmitInteraction<'cached'>): Array<{
        question: string;
        answer: string;
    }> {
        return [
            {
                question: 'What can we help you with?',
                answer: interaction.fields.getTextInputValue('question'),
            },
        ];
    }

    /**
     * Validates the modal input for other questions
     */
    async validateInput(interaction: Discord.ModalSubmitInteraction<'cached'>): Promise<boolean> {
        try {
            const question = interaction.fields.getTextInputValue('question');
            if (!question || question.trim().length < 32) {
                console.error(`Question validation failed: length ${question?.length || 0} (required: 32+)`);
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
 * Configuration for the other questions support category
 */
export const OtherQuestionsConfig = {
    id: SupportCategoryId.Other,
    name: 'Other & Quick Questions',
    description: 'For all other forms of support.',
    staffRoleIds: [], // Will be populated by the configuration service
    isEnabled: true,
    modalConfig: {
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
    } as Discord.ModalComponentData,
};