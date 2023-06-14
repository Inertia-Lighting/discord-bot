//------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
//------------------------------------------------------------//

import * as Discord from 'discord.js';

import { CustomEmbed } from '@root/bot/common/message';

import { CustomInteraction, CustomInteractionAccessLevel, CustomInteractionRunContext } from '@root/bot/common/managers/custom_interactions_manager';

import { SupportTicketId, createSupportTicketChannel, support_categories } from '@root/bot/handlers/support_system_handler';

//------------------------------------------------------------//

const bot_database_support_staff_role_id = `${process.env.BOT_SUPPORT_STAFF_DATABASE_ROLE_ID ?? ''}`;
if (bot_database_support_staff_role_id.length < 1) throw new Error('Environment variable: BOT_SUPPORT_STAFF_DATABASE_ROLE_ID; is not set correctly.');

//------------------------------------------------------------//

export default new CustomInteraction({
    identifier: 'product_transfer_modal',
    type: Discord.InteractionType.ModalSubmit,
    data: undefined,
    metadata: {
        required_run_context: CustomInteractionRunContext.Guild,
        required_access_level: CustomInteractionAccessLevel.Public,
    },
    handler: async (discord_client, interaction) => {
        if (!interaction.inCachedGuild()) return;
        if (!interaction.isModalSubmit()) return;

        await interaction.deferReply({ ephemeral: true });

        const products = interaction.fields.getTextInputValue('products');
        const discord_transfer_to = interaction.fields.getTextInputValue('discord_transfer_to');
        const roblox_transfer_to = interaction.fields.getTextInputValue('roblox_transfer_to');
        const transfer_reason = interaction.fields.getTextInputValue('transfer_reason');

        const support_ticket_category = support_categories.find(({ id }) => id === SupportTicketId.Transfers)!;

        const support_channel = await createSupportTicketChannel(interaction.guild, interaction.member, support_ticket_category);

        await interaction.editReply({
            content: [
                `You selected ${support_ticket_category.name}.`,
                `Go to ${support_channel} to continue.`,
            ].join('\n'),
        });

        await support_channel.send({
            content: [
                `${interaction.member}, welcome to your support ticket,`,
                '',
                `Our ${Discord.roleMention(bot_database_support_staff_role_id)} support staff are unscheduled volunteers, so please be patient.`,
                '',
                'If you have an urgent issue, like someone making death threats;',
                'please @mention one of our high-ranked staff members!',
            ].join('\n'),
            embeds: [
                CustomEmbed.from({
                    author: {
                        icon_url: `${discord_client.user.displayAvatarURL({ forceStatic: false })}`,
                        name: 'Inertia Lighting | Support System',
                    },
                    description: [
                        '**What product(s) do you want to transfer?**',
                        `${products}`,
                        '',
                        '**Discord user ID that you\'re transferring to?**',
                        `${discord_transfer_to}`,
                        '',
                        '**Roblox account that you\'re transferring to?**',
                        `${roblox_transfer_to}`,
                        '',
                        '**Why are you transferring your product(s)?**',
                        `${transfer_reason}`,
                    ].join('\n'),
                }),
            ],
        });
    },
});
