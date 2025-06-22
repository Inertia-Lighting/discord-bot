// ------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
// ------------------------------------------------------------//

import { CustomInteraction, CustomInteractionAccessLevel, CustomInteractionRunContext } from '@root/common/managers/custom_interactions_manager';
import { CustomEmbed } from '@root/common/message';
import prisma from '@root/lib/prisma_client';
import * as Discord from 'discord.js';

// ------------------------------------------------------------//

export default new CustomInteraction({
    identifier: 'i_fd_up_confirm',
    type: Discord.InteractionType.MessageComponent,
    data: undefined,
    metadata: {
        required_run_context: CustomInteractionRunContext.Guild,
        required_access_level: CustomInteractionAccessLevel.Public,
    },
    handler: async (discord_client, interaction) => {
        if (!interaction.isButton()) return;
        if (!interaction.inCachedGuild()) return;
        if (!interaction.channel) return;
        interaction.deferReply()
        /* send the support category selection menu */
        await interaction.editReply({
            components: [{
                type: Discord.ComponentType.Container,
                accent_color: CustomEmbed.Color.Blue,
                components: [
                    {
                        type: Discord.ComponentType.TextDisplay,
                        content: '# Account Reset'
                    },
                    {
                        type: Discord.ComponentType.TextDisplay,
                        content: 'Clearing account from database...'
                    }]
            }]
        });

        await prisma.$transaction([
            prisma.transactions.deleteMany({
                where: {
                    User: {
                        discordId: interaction.user.id
                    }
                }
            }),
            prisma.user.delete({
                where: {
                    discordId: interaction.user.id
                }
            })
        ]).catch(async (err) => {
            // throw new Error('Failed to delete user data', {cause: err})
            console.trace(err)
            await interaction.editReply({
                components: [{
                    type: Discord.ComponentType.Container,
                    accent_color: CustomEmbed.Color.Red,
                    components: [{
                        type: Discord.ComponentType.TextDisplay,
                        content: '# Account Reset'
                    },
                    {
                        type: Discord.ComponentType.TextDisplay,
                        content: 'Failed to reset account'
                    }
                    ]
                }]
            });
        })
        await interaction.editReply({
            flags: 'IsComponentsV2',
            components: [{
                type: Discord.ComponentType.Container,
                accent_color: CustomEmbed.Color.Green,
                components: [{
                    type: Discord.ComponentType.TextDisplay,
                    content: '# Account Reset'
                },
                {
                    type: Discord.ComponentType.TextDisplay,
                    content: 'Account reset successfully'
                }
                ]
            }]
        });

    },
});
