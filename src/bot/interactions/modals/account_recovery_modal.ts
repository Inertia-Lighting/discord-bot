//------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
//------------------------------------------------------------//

//---------------------------------------------------------------------------------------------------------------//

import { Discord, client } from '../../discord_client';

import { CustomEmbed } from '@root/bot/common/message';

import { createSupportTicketChannel } from '@root/bot/handlers/support_system_handler';

//---------------------------------------------------------------------------------------------------------------//

export default {
    identifier: 'account_recovery_modal',
    async execute(interaction: Discord.ModalSubmitInteraction) {
        if (!interaction.inCachedGuild()) return;

        await interaction.deferReply({ ephemeral: true });

        const modal_fields = interaction.fields;

        const support_channel = await createSupportTicketChannel(interaction.guild, interaction.member!, 'RECOVERY');

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
                        '**What is your old Roblox account ID?**',
                        `${modal_fields.getTextInputValue('old_roblox')}`,
                        '',
                        '**What is your new Roblox account ID?**',
                        `${modal_fields.getTextInputValue('new_roblox')}`,
                        '',
                        '**What is your old Discord user ID?**',
                        `${modal_fields.getTextInputValue('old_discord')}`,
                        '',
                        '**What is your new Discord user ID?**',
                        `${modal_fields.getTextInputValue('new_discord')}`,
                        '',
                        '**Why do you need to recover your account?**',
                        `${modal_fields.getTextInputValue('recovery_reason')}`,
                    ].join('\n'),
                }),
            ],
        });
    },
};
