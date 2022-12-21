//------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
//------------------------------------------------------------//

//---------------------------------------------------------------------------------------------------------------//

import { Discord, client } from '../../discord_client';

import { CustomEmbed } from '@root/bot/common/message';

import { createSupportTicketChannel } from '@root/bot/handlers/support_system_handler';

//---------------------------------------------------------------------------------------------------------------//

export default {
    identifier: 'support_issues_modal',
    async execute(interaction: Discord.ModalSubmitInteraction) {
        if (!interaction.inCachedGuild()) return;

        await interaction.deferReply({ ephemeral: true });

        const modal_fields = interaction.fields;

        const support_channel = await createSupportTicketChannel(interaction.guild, interaction.member!, 'ISSUES');

        interaction.editReply({
            content: [
                'You selected Product Tech Support!',
                `Go to ${support_channel} to continue.`,
            ].join('\n'),
        });

        support_channel.send({
            content: [
                `${interaction.member}, welcome to your support ticket,`,
                '',
                `Our <@&${process.env.BOT_SUPPORT_STAFF_PRODUCT_ISSUES_ROLE_ID as string}> support staff are unscheduled volunteers, so please be patient.`,
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
                        '**What product(s) are you having issue(s) with?**',
                        `${modal_fields.getTextInputValue('product')}`,
                        '',
                        '**Did you read the README? (Yes or No)**',
                        `${modal_fields.getTextInputValue('read_me')}`,
                        '',
                        '**Did you enable HTTP Request (Yes, No, or Idk)**',
                        `${modal_fields.getTextInputValue('http')}`,
                        '',
                        '**Please provide us with a link to your output.**',
                        `${modal_fields.getTextInputValue('output')}`,
                        '',
                        '**What are you having issues with?**',
                        `${modal_fields.getTextInputValue('issue')}`,
                    ].join('\n'),
                }),
            ],
        });

    },
};
