//------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
//------------------------------------------------------------//

import * as Discord from 'discord.js';

import { CustomEmbed } from '@root/bot/common/message';

import { CustomInteraction, CustomInteractionAccessLevel, CustomInteractionRunContext } from '@root/bot/common/managers/custom_interactions_manager';

import { createSupportTicketChannel } from '@root/bot/handlers/support_system_handler';

//------------------------------------------------------------//

const bot_product_issues_support_staff_role_id = `${process.env.BOT_SUPPORT_STAFF_PRODUCT_ISSUES_ROLE_ID ?? ''}`;
if (bot_product_issues_support_staff_role_id.length < 1) throw new Error('Environment variable: BOT_SUPPORT_STAFF_PRODUCT_ISSUES_ROLE_ID; is not set correctly.');

//------------------------------------------------------------//

export default new CustomInteraction({
    identifier: 'support_issues_modal',
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

        const answer_for_product = interaction.fields.getTextInputValue('product');
        const answer_for_read_me = interaction.fields.getTextInputValue('read_me');
        const answer_for_http = interaction.fields.getTextInputValue('http');
        const answer_for_output = interaction.fields.getTextInputValue('output');
        const answer_for_issue = interaction.fields.getTextInputValue('issue');

        const support_channel = await createSupportTicketChannel(interaction.guild, interaction.member, 'TRANSFERS');

        await interaction.editReply({
            content: [
                'You selected Product Tech Support!',
                `Go to ${support_channel} to continue.`,
            ].join('\n'),
        });

        await support_channel.send({
            content: [
                `${interaction.member}, welcome to your support ticket,`,
                '',
                `Our <@&${bot_product_issues_support_staff_role_id}> support staff are unscheduled volunteers, so please be patient.`,
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
                        '**What product(s) are you having issue(s) with?**',
                        `${answer_for_product}`,
                        '',
                        '**Did you read the README? (Yes or No)**',
                        `${answer_for_read_me}`,
                        '',
                        '**Did you enable HTTP Request (Yes, No, or Idk)**',
                        `${answer_for_http}`,
                        '',
                        '**Please provide us with a link to your output.**',
                        `${answer_for_output}`,
                        '',
                        '**What are you having issues with?**',
                        `${answer_for_issue}`,
                    ].join('\n'),
                }),
            ],
        });
    },
});
