//------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
//------------------------------------------------------------//

//---------------------------------------------------------------------------------------------------------------//

import { Discord } from '../../discord_client';

import { command_permission_levels, getUserPermissionLevel } from '@root/bot/common/bot';

import { closeSupportTicketChannel } from '@root/bot/handlers/support_system_handler';

const support_tickets_category_id = process.env.BOT_SUPPORT_TICKETS_CATEGORY_ID as string;
const support_tickets_transcripts_channel_id = process.env.BOT_SUPPORT_TICKETS_TRANSCRIPTS_CHANNEL_ID as string;

//---------------------------------------------------------------------------------------------------------------//

export default {
    identifier: 'close_ticket',
    async execute(interaction: Discord.AutocompleteInteraction | Discord.ChatInputCommandInteraction) {
        if (!interaction.isChatInputCommand()) return;
        if (!interaction.inCachedGuild()) return;
        const user_permission_level = getUserPermissionLevel(interaction.member);

        if (user_permission_level < command_permission_levels.STAFF) {
            interaction.reply({
                content: 'Sorry, only staff may close active support tickets.',
            }).catch(console.warn);
            return;
        }

        const channel_exists_in_support_tickets_category = interaction.channelId === support_tickets_category_id;
        const channel_is_not_transcripts_channel = interaction.channelId !== support_tickets_transcripts_channel_id;
        if (!(channel_exists_in_support_tickets_category && channel_is_not_transcripts_channel)) {
            interaction.reply({
                content: 'This channel is not an active support ticket.',
            }).catch(console.warn);
            return;
        }

        const support_channel = interaction.channel;
        if (!(support_channel instanceof Discord.TextChannel)) throw new Error('Expected support_channel to be a text channel');

        const support_ticket_topic_name = support_channel.name.match(/([a-zA-Z\-\_])+(?![\-\_])\D/i)?.[0];
        if (!support_ticket_topic_name) throw new Error('Expected support_ticket_topic_name to be a string');

        closeSupportTicketChannel(interaction.channel as Discord.TextChannel, true, interaction.member, true);

    },
};
