// ------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
// ------------------------------------------------------------//

import * as Discord from 'discord.js';

import { BaseSupportCategoryHandler } from '../core/base-handler.js'
;
import { SupportCategoryId } from '../types/index.js'
;

/**
 * Handler for partnership requests support category
 */
export class PartnershipRequestsHandler extends BaseSupportCategoryHandler {
    readonly categoryId = SupportCategoryId.PartnershipRequests;

    /**
     * Extracts responses from the modal interaction
     */
    protected extractResponses(interaction: Discord.ModalSubmitInteraction<'cached'>): Array<{
        question: string;
        answer: string;
    }> {
        return [
            {
                question: 'What is the name of your group?',
                answer: interaction.fields.getTextInputValue('group_name'),
            },
            {
                question: 'How old are you?',
                answer: interaction.fields.getTextInputValue('group_owner_age'),
            },
            {
                question: 'How many members are in your group?',
                answer: interaction.fields.getTextInputValue('group_member_count'),
            },
            {
                question: 'Describe your group.',
                answer: interaction.fields.getTextInputValue('group_description'),
            },
            {
                question: 'Why do you want to partner with us?',
                answer: interaction.fields.getTextInputValue('group_reason'),
            },
            {
                question: 'What are your group\'s social links?',
                answer: interaction.fields.getTextInputValue('group_social_links'),
            },
        ];
    }

    /**
     * Validates the modal input for partnership requests
     */
    async validateInput(interaction: Discord.ModalSubmitInteraction<'cached'>): Promise<boolean> {
        const groupName = interaction.fields.getTextInputValue('group_name');
        const groupOwnerAge = interaction.fields.getTextInputValue('group_owner_age');
        const groupMemberCount = interaction.fields.getTextInputValue('group_member_count');
        const groupDescription = interaction.fields.getTextInputValue('group_description');
        const groupReason = interaction.fields.getTextInputValue('group_reason');
        const groupSocialLinks = interaction.fields.getTextInputValue('group_social_links');

        // Basic validation
        if (!groupName || groupName.length < 1) return false;
        if (!groupOwnerAge || groupOwnerAge.length < 1) return false;
        if (!groupMemberCount || groupMemberCount.length < 1) return false;
        if (!groupDescription || groupDescription.length < 128) return false;
        if (!groupReason || groupReason.length < 128) return false;
        if (!groupSocialLinks || groupSocialLinks.length < 32) return false;

        return true;
    }
}

/**
 * Configuration for the partnership requests support category
 */
export const PartnershipRequestsConfig = {
    id: SupportCategoryId.PartnershipRequests,
    name: 'Partnership Requests',
    description: 'Interested in partnering with us?',
    staffRoleIds: [], // Will be populated by the configuration service
    isEnabled: true,
    modalConfig: {
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
            },
            {
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
            },
            {
                type: Discord.ComponentType.ActionRow,
                components: [
                    {
                        type: Discord.ComponentType.TextInput,
                        customId: 'group_member_count',
                        style: Discord.TextInputStyle.Short,
                        label: 'How many members are in your group?',
                        minLength: 1,
                        maxLength: 10,
                        required: true,
                    },
                ],
            },
            {
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
            },
            {
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
            },
            {
                type: Discord.ComponentType.ActionRow,
                components: [
                    {
                        type: Discord.ComponentType.TextInput,
                        customId: 'group_social_links',
                        style: Discord.TextInputStyle.Paragraph,
                        label: 'What are your group\'s social links?',
                        minLength: 1,
                        maxLength: 1024,
                        required: true,
                    },
                ],
            },
        ],
    } as Discord.ModalComponentData,
};