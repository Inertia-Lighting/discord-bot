//------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
//------------------------------------------------------------//

//---------------------------------------------------------------------------------------------------------------//

import { Discord, client } from '../../discord_client';

import { CustomEmbed } from '@root/bot/common/message';

import { createSupportTicketChannel } from '@root/bot/handlers/support_system_handler';
//---------------------------------------------------------------------------------------------------------------//

export default {
    identifier: 'product_transfer_modal',
    async execute(interaction: Discord.ModalSubmitInteraction) {
        if (!interaction.inCachedGuild()) return;

        await interaction.deferReply({ ephemeral: true });

        const modal_fields = interaction.fields;

        const support_channel = await createSupportTicketChannel(interaction.guild, interaction.member!, 'TRANSFERS');

        interaction.editReply({
            content: [
                'You selected Transfer Products!',
                `Go to ${support_channel} to continue.`,
            ].join('\n'),
        });

        support_channel.send({
            content: [
                `${interaction.member}, welcome to your support ticket,`,
                '',
                `Our <@&${process.env.BOT_SUPPORT_STAFF_DATABASE_ROLE_ID as string}> support staff are unscheduled volunteers, so please be patient.`,
                '',
                'If you have an urgent issue, like someone making death threats;',
                'please @mention one of our high-ranked staff members!',
            ].join('\n'),
            embeds: [
                CustomEmbed.from({
                    author: {
                        icon_url: `${client.user!.displayAvatarURL({ forceStatic: false })}`,
                        name: 'Inertia Lighting | Support System',
                    },
                    description: [
                        '**What product(s) do you want to transfer?**',
                        `${modal_fields.getTextInputValue('products')}`,
                        '',
                        '**Discord user ID that you\'re transferring to?**',
                        `${modal_fields.getTextInputValue('discord_transfer_to')}`,
                        '',
                        '**Roblox account that you\'re transferring to?**',
                        `${modal_fields.getTextInputValue('roblox_transfer_to')}`,
                        '',
                        '**Why are you transferring your product(s)?**',
                        `${modal_fields.getTextInputValue('transfer_reason')}`,
                    ].join('\n'),
                }),
            ],
        });
    },
};
