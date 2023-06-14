//------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
//------------------------------------------------------------//

import * as Discord from 'discord.js';

import { CustomInteraction, CustomInteractionAccessLevel, CustomInteractionRunContext } from '@root/common/managers/custom_interactions_manager';

import { closeSupportTicketChannel } from '@root/common/handlers';

//------------------------------------------------------------//

const support_tickets_category_id = `${process.env.BOT_SUPPORT_TICKETS_CATEGORY_ID ?? ''}`;
if (support_tickets_category_id.length < 1) throw new Error('Environment variable: BOT_SUPPORT_TICKETS_CATEGORY_ID; is not set correctly.');

const support_tickets_transcripts_channel_id = `${process.env.BOT_SUPPORT_TICKETS_TRANSCRIPTS_CHANNEL_ID ?? ''}`;
if (support_tickets_transcripts_channel_id.length < 1) throw new Error('Environment variable: BOT_SUPPORT_TICKETS_TRANSCRIPTS_CHANNEL_ID; is not set correctly.');

//------------------------------------------------------------//

export default new CustomInteraction({
    identifier: 'close_ticket',
    type: Discord.InteractionType.ApplicationCommand,
    data: {
        type: Discord.ApplicationCommandType.ChatInput,
        description: 'Used by staff to close support tickets.',
        options: [],
    },
    metadata: {
        required_run_context: CustomInteractionRunContext.Guild,
        required_access_level: CustomInteractionAccessLevel.CustomerService,
    },
    handler: async (discord_client, interaction) => {
        if (!interaction.isChatInputCommand()) return;
        if (!interaction.inCachedGuild()) return;
        if (!interaction.channel) return;

        await interaction.deferReply({ ephemeral: false });

        const channel_exists_in_support_tickets_category = interaction.channel?.parentId === support_tickets_category_id;
        const channel_is_not_transcripts_channel = interaction.channel?.id !== support_tickets_transcripts_channel_id;
        if (!(channel_exists_in_support_tickets_category && channel_is_not_transcripts_channel)) {
            interaction.editReply({
                content: 'This channel is not an active support ticket.',
            }).catch(console.warn);
            return;
        }

        const support_channel = interaction.channel;
        if (!(support_channel instanceof Discord.TextChannel)) throw new Error('Expected support_channel to be a text channel');

        const support_ticket_topic_name = support_channel.name.match(/([a-zA-Z\-\_])+(?![\-\_])\D/i)?.[0];
        if (!support_ticket_topic_name) throw new Error('Expected support_ticket_topic_name to be a string');

        await interaction.editReply({
            content: `${interaction.user}, closing support ticket in 10 seconds...`,
        }).catch(console.warn);

        await closeSupportTicketChannel(interaction.channel, true, interaction.member, true);
    },
});
