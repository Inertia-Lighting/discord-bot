//------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
//------------------------------------------------------------//

//---------------------------------------------------------------------------------------------------------------//

import { Discord, client } from '../../discord_client';

import { CustomEmbed } from '@root/bot/common/message';

import { createSupportTicketChannel } from '@root/bot/handlers/support_system_handler';

//---------------------------------------------------------------------------------------------------------------//

export default {
    identifier: 'transaction_modal',
    async execute(interaction: Discord.ModalSubmitInteraction) {
        if (!interaction.inCachedGuild()) return;

        await interaction.deferReply({ ephemeral: true });

        const modal_fields = interaction.fields;

        const support_channel = await createSupportTicketChannel(interaction.guild, interaction.member!, 'TRANSACTIONS');

        interaction.editReply({
            content: [
                'You selected Transactions!',
                `Go to ${support_channel} to continue.`,
            ].join('\n'),
        });

        support_channel.send({
            content: [
                `${interaction.member}, welcome to your support ticket,`,
                '',
                `Our <@&${process.env.BOT_SUPPORT_STAFF_PRODUCT_PURCHASES_ROLE_ID as string}> support staff are unscheduled volunteers, so please be patient.`,
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
                        '**What product(s) are involved?**',
                        `${modal_fields.getTextInputValue('products')}`,
                        '',
                        '**When did you attempt your purchase? (DATE)**',
                        `${modal_fields.getTextInputValue('time')}`,
                        '',
                        '**Fully describe the issue you\'re encountering.**',
                        `${modal_fields.getTextInputValue('issue')}`,
                    ].join('\n'),
                }),
            ],
        });
    },
};
