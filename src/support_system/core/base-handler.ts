// ------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
// ------------------------------------------------------------//

import { CustomEmbed } from '@root/common/message';
import * as Discord from 'discord.js';

import { 
    SupportCategoryHandler, 
    SupportCategoryId, 
    SupportTicketContext 
} from '../types';

/**
 * Base implementation for support category handlers
 */
export abstract class BaseSupportCategoryHandler implements SupportCategoryHandler {
    abstract readonly categoryId: SupportCategoryId;

    /**
     * Handles the modal submission for this support category
     */
    async handleModalSubmission(
        interaction: Discord.ModalSubmitInteraction<'cached'>,
        context: SupportTicketContext
    ): Promise<void> {
        try {
            // Validate input first
            const isValid = await this.validateInput(interaction);
            if (!isValid) {
                console.error(`Invalid input for ${this.categoryId} category from user ${interaction.user.id}`);
                throw new Error('Invalid input provided. Please check your responses and try again.');
            }

            // Get formatted responses
            const responses = this.extractResponses(interaction);
            
            // Send the responses to the channel
            await this.sendResponsesToChannel(context.channel!, responses, interaction);
            
            // Send any additional messages
            await this.sendAdditionalMessages(context, interaction);
        } catch (error) {
            console.error(`Error handling modal submission for ${this.categoryId}:`, error);
            throw error;
        }
    }

    /**
     * Validates the modal input for this support category
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async validateInput(interaction: Discord.ModalSubmitInteraction<'cached'>): Promise<boolean> {
        // Default validation - can be overridden by subclasses
        return true;
    }

    /**
     * Gets the initial message content for the support ticket
     */
     
    async getInitialMessage(_context: SupportTicketContext): Promise<Discord.MessageCreateOptions> {
        const staffRoleMentions = await this.getStaffRoleMentions(_context);
        
        return {
            content: [
                `${_context.owner}, welcome to your support ticket.`,
                '',
                `Our ${staffRoleMentions} support staff are volunteers.`,
                'Being a volunteer means they have lives outside of Inertia Lighting.',
                '',
                'Please do not \\@mention, harass, or otherwise annoy our support staff.',
                'They generously donate their time to answer support tickets.',
                '',
                'In the meantime, please provide us with as much information as possible.',
                'We are only as useful as the information you provide to us.',
            ].join('\n'),
        };
    }

    /**
     * Extracts responses from the modal interaction
     */
    protected abstract extractResponses(interaction: Discord.ModalSubmitInteraction<'cached'>): Array<{
        question: string;
        answer: string;
    }>;

    /**
     * Sends the responses to the support channel
     */
    protected async sendResponsesToChannel(
        channel: Discord.TextChannel,
        responses: Array<{ question: string; answer: string }>,
        interaction: Discord.ModalSubmitInteraction<'cached'>
    ): Promise<void> {
        const description = responses.map(({ question, answer }) => [
            `**${question}**`,
            answer,
            '',
        ].join('\n')).join('\n');

        await channel.send({
            embeds: [
                CustomEmbed.from({
                    author: {
                        icon_url: interaction.client.user.displayAvatarURL({ forceStatic: false }),
                        name: 'Inertia Lighting | Support System',
                    },
                    description,
                }),
            ],
        });
    }

    /**
     * Sends additional messages specific to this support category
     */
     
    protected async sendAdditionalMessages(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _context: SupportTicketContext,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _interaction: Discord.ModalSubmitInteraction<'cached'>
    ): Promise<void> {
        // Default implementation - can be overridden by subclasses
    }

    /**
     * Gets staff role mentions for this category
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected async getStaffRoleMentions(_context: SupportTicketContext): Promise<string> {
        // This will be implemented by subclasses or retrieved from config
        return 'support staff';
    }
}