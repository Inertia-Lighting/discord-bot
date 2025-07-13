// ------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
// ------------------------------------------------------------//

import { CustomInteraction, CustomInteractionAccessLevel, CustomInteractionRunContext } from '@root/common/managers/custom_interactions_manager';
import { fetchHighestAccessLevelForUser } from '@root/common/permissions';
import { supportSystemManager } from '@root/support_system';
import { loadSupportSystemConfig } from '@root/support_system/config';
import * as Discord from 'discord.js';

// ------------------------------------------------------------//

const config = loadSupportSystemConfig();

// ------------------------------------------------------------//

export default new CustomInteraction({
    identifier: 'close_ticket',
    type: Discord.InteractionType.ApplicationCommand,
    data: {
        type: Discord.ApplicationCommandType.ChatInput,
        description: 'Used by staff to close a support ticket.',
        options: [
            {
                name: 'reason',
                type: Discord.ApplicationCommandOptionType.String,
                description: 'Why is this ticket being closed?',
                minLength: 1,
                maxLength: 1024,
                required: true,
            }, {
                name: 'request_feedback',
                type: Discord.ApplicationCommandOptionType.Boolean,
                description: 'Request user feedback? (only for team leaders and above)',
                required: false,
            },
        ],
    },
    metadata: {
        required_run_context: CustomInteractionRunContext.Guild,
        required_access_level: CustomInteractionAccessLevel.CustomerService,
    },
    handler: async (discord_client, interaction) => {
        if (!interaction.isChatInputCommand()) return;
        if (!interaction.inCachedGuild()) return;
        if (!interaction.channel) return;

        await interaction.deferReply({ flags: ['Ephemeral'] });

        const reason = interaction.options.getString('reason', true);
        const request_feedback = interaction.options.getBoolean('request_feedback', false) ?? true; // ask for feedback by default

        // Ensure that only Team Leaders and above can close tickets without asking for feedback.
        const highest_permission = await fetchHighestAccessLevelForUser(discord_client, interaction.user);
        if (
            request_feedback === false &&
            highest_permission < CustomInteractionAccessLevel.TeamLeaders
        ) {
            await interaction.editReply({
                content: 'You lack permission to close tickets without asking for feedback.',
            }).catch(console.warn);

            return;
        }

        const channel_exists_in_support_tickets_category = interaction.channel?.parentId === config.channels.ticketsCategoryId;
        const channel_is_not_transcripts_channel = interaction.channel?.id !== config.channels.transcriptsChannelId;
        if (!(channel_exists_in_support_tickets_category && channel_is_not_transcripts_channel)) {
            interaction.editReply({
                content: 'This channel is not an active support ticket.',
            }).catch(console.warn);
            return;
        }

        const support_channel = interaction.channel;
        if (!(support_channel instanceof Discord.TextChannel)) throw new Error('Expected support_channel to be a text channel');

        const filtered_support_channel_name = support_channel.name.slice(3);
        const support_ticket_topic_name = filtered_support_channel_name.match(/([a-zA-Z\-_])+(?![-_])\D/i)?.[0];
        if (!support_ticket_topic_name) throw new Error('Expected support_ticket_topic_name to be a string');

        await interaction.editReply({
            content: [
                `${interaction.user}, closed this ticket for:`,
                '```',
                Discord.escapeCodeBlock(reason),
                '```',
            ].join('\n'),
        }).catch(console.warn);

        await supportSystemManager.closeTicket(
            interaction.channel, 
            interaction.member, 
            reason, 
            {
                saveTranscript: true,
                sendFeedback: request_feedback,
            }
        );
    },
});
