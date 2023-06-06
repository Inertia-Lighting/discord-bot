//------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
//------------------------------------------------------------//

import * as Discord from 'discord.js';

import { CustomInteraction, CustomInteractionAccessLevel, CustomInteractionRunContext } from '@root/bot/common/managers/custom_interactions_manager';

import { support_categories } from '@root/bot/handlers/support_system_handler';

//------------------------------------------------------------//

const support_tickets_category_id = `${process.env.BOT_SUPPORT_TICKETS_CATEGORY_ID ?? ''}`;
if (support_tickets_category_id.length < 1) throw new Error('Environment variable: BOT_SUPPORT_TICKETS_CATEGORY_ID; is not set correctly.');

const support_tickets_transcripts_channel_id = `${process.env.BOT_SUPPORT_TICKETS_TRANSCRIPTS_CHANNEL_ID ?? ''}`;
if (support_tickets_transcripts_channel_id.length < 1) throw new Error('Environment variable: BOT_SUPPORT_TICKETS_TRANSCRIPTS_CHANNEL_ID; is not set correctly.');

//------------------------------------------------------------//

export default new CustomInteraction({
    identifier: 'open_ticket',
    type: Discord.InteractionType.ApplicationCommand,
    data: {
        type: Discord.ApplicationCommandType.ChatInput,
        description: 'Opens a support ticket.',
        options: [],
    },
    metadata: {
        required_run_context: CustomInteractionRunContext.Guild,
        required_access_level: CustomInteractionAccessLevel.Public,
    },
    handler: async (discord_client, interaction) => {
        if (!interaction.isChatInputCommand()) return;
        if (!interaction.inCachedGuild()) return;
        if (!interaction.channel) return;

        await interaction.deferReply({ ephemeral: false });

        const channel_exists_in_support_tickets_category = interaction.channel?.parentId === support_tickets_category_id;
        if (channel_exists_in_support_tickets_category) {
            await interaction.editReply({
                content: 'You can not open a support ticket in a support ticket channel.',
            }).catch(console.warn);

            return;
        }

        await interaction.editReply({
            content: `${interaction.member} opening a support ticket...`,
            components: [
                {
                    type: Discord.ComponentType.ActionRow,
                    components: [
                        {
                            type: Discord.ComponentType.StringSelect,
                            customId: 'support_category_selection_menu',
                            placeholder: 'Select a support category!',
                            minValues: 1,
                            maxValues: 1,
                            options: support_categories.map(({ id, name, description }) => ({
                                label: name,
                                description: description.slice(0, 100),
                                value: id,
                            })),
                        },
                    ],
                },
            ],
        }).catch(console.warn);
    },
});
