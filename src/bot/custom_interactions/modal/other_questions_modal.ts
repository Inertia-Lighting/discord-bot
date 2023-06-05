//------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
//------------------------------------------------------------//

//---------------------------------------------------------------------------------------------------------------//

import { Discord, client } from '../../discord_client';

import { CustomEmbed } from '@root/bot/common/message';

import { CustomInteraction, CustomInteractionAccessLevel } from '@root/bot/common/managers/custom_interactions_manager';

import { createSupportTicketChannel } from '@root/bot/handlers/support_system_handler';

//---------------------------------------------------------------------------------------------------------------//

export default new CustomInteraction({
    identifier: 'other_questions_modal',
    type: Discord.InteractionType.ModalSubmit,
    data: undefined,
    metadata: {
        required_access_level: CustomInteractionAccessLevel.Public,
    },
    handler: async (discord_client, interaction) => {
        if (!interaction.isModalSubmit()) return;
        if (!interaction.inCachedGuild()) return;

        await interaction.deferReply({ ephemeral: true });

        const modal_fields = interaction.fields;

        const support_channel = await createSupportTicketChannel(interaction.guild, interaction.member!, 'OTHER');

        interaction.editReply({
            content: [
                'You selected Other & Questions!',
                `Go to ${support_channel} to continue.`,
            ].join('\n'),
        });

        support_channel.send({
            content: [
                `${interaction.member}, welcome to your support ticket,`,
                '',
                `Our <@&${process.env.BOT_SUPPORT_STAFF_OTHER_ROLE_ID as string}> support staff are unscheduled volunteers, so please be patient.`,
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
                        '**What can we help you with?**',
                        `${modal_fields.getTextInputValue('question')}`,
                    ].join('\n'),
                }),
            ],
        });
    },
});
