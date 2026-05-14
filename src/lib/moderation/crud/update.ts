import * as Discord from 'discord.js'

import { CustomEmbed } from '@/common/message.js';
import prisma from '@/lib/prisma_client.js';

export async function updateModerationAction(
    interaction: Discord.ChatInputCommandInteraction,
) {
    if (!interaction.inCachedGuild()) return;
    if (!interaction.isChatInputCommand()) return;

    const punishment_id = interaction.options.getString('moderation_action_id', true);
    const new_punishment_reason = interaction.options.getString('reason', true);

    const punishment = prisma.punishments.findUnique({
        where: {
            id: punishment_id
        }
    })

    if (!punishment) {
        await interaction.editReply({
            embeds: [
                CustomEmbed.from({
                    color: CustomEmbed.Color.Yellow,
                    author: {
                        icon_url: `${interaction.client.user.displayAvatarURL({ forceStatic: false })}`,
                        name: 'Inertia Lighting | Moderation Actions',
                    },
                    description: 'Unable to find a moderation action with the specified id!',
                }),
            ],
        }).catch(console.warn);

        return;
    }

    try {
        await prisma.punishments.update({
            where: {
                id: punishment_id
            },
            data: {
                punishmentReason: new_punishment_reason
            }
        })
    } catch {
        interaction.editReply({
            embeds: [
                CustomEmbed.from({
                    color: CustomEmbed.Color.Yellow,
                    author: {
                        icon_url: `${interaction.client.user.displayAvatarURL({ forceStatic: false })}`,
                        name: 'Inertia Lighting | Moderation Actions',
                    },
                    description: 'Unable to update the moderation action with the specified id!',
                }),
            ],
        }).catch(console.warn);

        return;
    }

    await interaction.editReply({
        embeds: [
            CustomEmbed.from({
                color: CustomEmbed.Color.Green,
                author: {
                    icon_url: `${interaction.client.user.displayAvatarURL({ forceStatic: false })}`,
                    name: 'Inertia Lighting | Moderation Actions',
                },
                description: 'Successfully updated the specified moderation action!',
            }),
        ],
    }).catch(console.warn);

    return; // complete async
}