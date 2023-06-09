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
    identifier: 'account_recovery_modal',
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

        const old_roblox_account_id = interaction.fields.getTextInputValue('old_roblox');
        const new_roblox_account_id = interaction.fields.getTextInputValue('new_roblox');
        const old_discord_user_id = interaction.fields.getTextInputValue('old_discord');
        const new_discord_user_id = interaction.fields.getTextInputValue('new_discord');
        const recovery_reason = interaction.fields.getTextInputValue('recovery_reason');

        const support_ticket_category = support_categories.find(({ id }) => id === SupportTicketId.Recovery)!;

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
                `Our <@&${bot_database_support_staff_role_id}> support staff are unscheduled volunteers, so please be patient.`,
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
                        '**What is your old Roblox account ID?**',
                        `${old_roblox_account_id}`,
                        '',
                        '**What is your new Roblox account ID?**',
                        `${new_roblox_account_id}`,
                        '',
                        '**What is your old Discord user ID?**',
                        `${old_discord_user_id}`,
                        '',
                        '**What is your new Discord user ID?**',
                        `${new_discord_user_id}`,
                        '',
                        '**Why do you need to recover your account?**',
                        `${recovery_reason}`,
                    ].join('\n'),
                }),
            ],
        });
    },
});
