// ------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
// ------------------------------------------------------------//

import { CustomInteraction, CustomInteractionAccessLevel, CustomInteractionRunContext } from '@root/common/managers/custom_interactions_manager';
import { CustomEmbed } from '@root/common/message';
import * as Discord from 'discord.js';

import { generateVerificationCode } from '../../common/handlers';

// ------------------------------------------------------------//

const bot_customer_service_role_id = `${process.env.BOT_CUSTOMER_SERVICE_ROLE_ID ?? ''}`;
if (bot_customer_service_role_id.length < 1) throw new Error('Environment variable: BOT_CUSTOMER_SERVICE_ROLE_ID; is not set correctly.');

// ------------------------------------------------------------//

export default new CustomInteraction({
    identifier: 'begin_recovery_process',
    type: Discord.InteractionType.ApplicationCommand,
    data: {
        type: Discord.ApplicationCommandType.ChatInput,
        description: 'Begin the process for account recovery.',
        options: [
            {
                name: 'user_id',
                type: Discord.ApplicationCommandOptionType.Number,
                description: 'The Roblox Id of the member you would like to recover.',
                required: true,
            },
        ],
    },
    metadata: {
        required_run_context: CustomInteractionRunContext.Guild,
        required_access_level: CustomInteractionAccessLevel.CustomerService,
    },
    handler: async (discord_client, interaction) => {
        if (!interaction.isChatInputCommand()) return;
        if (!interaction.inCachedGuild()) return;
        if (!interaction.channel) return;

        await interaction.deferReply();
        const staff_member = interaction.member;
        const staff_member_is_permitted = staff_member.roles.cache.has(bot_customer_service_role_id);
        if (!staff_member_is_permitted) {
            await interaction.editReply({
                embeds: [
                    CustomEmbed.from({
                        color: CustomEmbed.Color.Violet,
                        title: 'Inertia Lighting | Identity Manager',
                        description: 'You aren\'t allowed to use this command!',
                    }),
                ],
            });

            return;
        }
        const user_id = interaction.options.getNumber('user_id', true);
        generateVerificationCode(user_id.toString(), interaction);
    },
});
