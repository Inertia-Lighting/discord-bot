import * as Discord from 'discord.js'
import moment from 'moment-timezone';

import { CustomEmbed } from '@/common/message.js';
import { Prisma } from '@/lib/prisma/client.js';
import prisma from '@/lib/prisma_client.js';
import { chunkArray, delay, ellipseString } from '@/utilities/index.js';

export async function listModerationActions(
    interaction: Discord.ChatInputCommandInteraction,
    { lookup_mode, lookup_query }: {
        lookup_mode: ModerationActionLookupMode,
        lookup_query: string,
    },
): Promise<void> {
    if (!interaction.inCachedGuild()) return;
    if (!interaction.isChatInputCommand()) return;

    /* send an initial message to the user */
    const bot_message = await interaction.editReply({
        embeds: [
            CustomEmbed.from({
                description: 'Loading moderation actions...',
            }),
        ],
    });

    /* create a small user-experience delay */
    await delay(500);

    /* fetch all moderation actions from the database */
    let db_moderation_actions_find_filter: Prisma.PunishmentsFindManyArgs;
    switch (lookup_mode) {
        case ModerationActionLookupMode.All: {
            db_moderation_actions_find_filter = {}; // empty filter

            break;
        }

        case ModerationActionLookupMode.DiscordUser: {
            db_moderation_actions_find_filter = {
                where: {
                    punishedUser: {
                        discordId: lookup_query
                    }
                }
            }

            break;
        }

        case ModerationActionLookupMode.StaffMember: {
            db_moderation_actions_find_filter = {
                where: {
                    staffUser: {
                        discordId: lookup_query
                    }
                }
            }

            break;
        }

        case ModerationActionLookupMode.Id: {
            db_moderation_actions_find_filter = {
                where: {
                    id: lookup_query
                }
            }

            break;
        }

        default: {
            throw new Error('Invalid lookup mode.');
        }
    }

    const punishments = await prisma.punishments.findMany({
        ...db_moderation_actions_find_filter,
        include: {
            punishedUser: true,
            staffUser: true
        }
    })

    /* check if the member has any records */
    if (punishments.length === 0) {
        await bot_message.edit({
            embeds: [
                CustomEmbed.from({
                    color: CustomEmbed.Color.Yellow,
                    author: {
                        icon_url: `${interaction.client.user.displayAvatarURL({ forceStatic: false })}`,
                        name: 'Inertia Lighting | Moderation Actions',
                    },
                    description: 'I wasn\'t able to find any moderation actions.',
                }),
            ],
        }).catch(console.warn);

        return;
    }

    await bot_message.edit({
        components: [
            {
                type: Discord.ComponentType.ActionRow,
                components: [
                    {
                        type: Discord.ComponentType.Button,
                        style: Discord.ButtonStyle.Secondary,
                        customId: 'previous',
                        label: 'Previous',
                    }, {
                        type: Discord.ComponentType.Button,
                        style: Discord.ButtonStyle.Secondary,
                        customId: 'next',
                        label: 'Next',
                    }, {
                        type: Discord.ComponentType.Button,
                        style: Discord.ButtonStyle.Danger,
                        customId: 'stop',
                        label: 'Stop',
                    },
                ],
            },
        ],
    });

    /* sort the moderation actions by epoch (newest -> oldest) */
    const sorted_moderation_actions = punishments.sort((a, b) => b.createdAt.getUTCMilliseconds() - a.createdAt.getUTCMilliseconds());

    /* split the moderation actions into a 2-dimensional array of chunks */
    const moderation_actions_chunks = chunkArray(sorted_moderation_actions, 5);

    /* send a carousel containing 10 moderation actions per page */
    let page_index = 0;

    async function editEmbedWithNextModerationActionsChunk() {
        const moderation_actions_chunk = moderation_actions_chunks[page_index];

        await bot_message.edit({
            embeds: [
                CustomEmbed.from({
                    author: {
                        icon_url: `${interaction.client.user.displayAvatarURL({ forceStatic: false })}`,
                        name: 'Inertia Lighting | Moderation Actions',
                    },
                    description: moderation_actions_chunk.map(moderation_action =>
                        [
                            `**Id** \`${moderation_action.id}\``,
                            `**Staff** ${Discord.userMention(moderation_action.staffUser.discordId)}`,
                            `**Member** ${Discord.userMention(moderation_action.punishedUser.discordId)}`,
                            `**Date** \`${moment(moderation_action.createdAt.getUTCMilliseconds()).tz(process.env.TZ ?? 'America/New_York').format('YYYY[-]MM[-]DD | hh:mm A | [GMT]ZZ')}\``,
                            `**Type** \`${moderation_action.punishmentType}\``,
                            '**Reason**',
                            '```',
                            `${ellipseString(Discord.escapeMarkdown(moderation_action.punishmentReason), 250)}`,
                            '```',
                        ].join('\n')
                    ).join('\n'),
                }),
            ],
        }).catch(console.warn);

        return; // complete async
    }

    await editEmbedWithNextModerationActionsChunk();

    const message_button_collector_filter = (button_interaction: Discord.MessageComponentInteraction) => button_interaction.user.id === interaction.user.id;
    const message_button_collector = bot_message.createMessageComponentCollector({
        filter: message_button_collector_filter,
        time: 5 * 60_000, // 5 minutes
    });

    message_button_collector.on('collect', async (button_interaction) => {
        message_button_collector.resetTimer();

        switch (button_interaction.customId) {
            case 'previous': {
                page_index = page_index < moderation_actions_chunks.length - 1 ? page_index + 1 : 0;
                break;
            }

            case 'next': {
                page_index = page_index > 0 ? page_index - 1 : moderation_actions_chunks.length - 1;
                break;
            }

            case 'stop': {
                message_button_collector.stop();
                break;
            }

            default: {
                break;
            }
        }

        await button_interaction.deferUpdate();

        if (message_button_collector.ended) return;

        await editEmbedWithNextModerationActionsChunk();
    });

    message_button_collector.on('end', async () => {
        await bot_message.delete().catch(console.warn);
    });

    return; // complete async
}