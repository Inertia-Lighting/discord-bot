// ------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
// ------------------------------------------------------------//

import * as Discord from 'discord.js';

import { CustomInteraction, CustomInteractionAccessLevel, CustomInteractionRunContext } from '@/common/managers/custom_interactions_manager.js'
import { CustomEmbed } from '@/common/message.js'
import prisma from '@/lib/prisma_client.js';

// ------------------------------------------------------------//

enum ManageLumensAction {
    Add = 'add',
    Remove = 'remove',
    Set = 'set',
}

// ------------------------------------------------------------//

export default new CustomInteraction({
    identifier: 'manage_user_lumens',
    type: Discord.InteractionType.ApplicationCommand,
    data: {
        type: Discord.ApplicationCommandType.ChatInput,
        description: 'Used by staff to manage user lumens.',
        options: [
            {
                name: 'for',
                type: Discord.ApplicationCommandOptionType.User,
                description: 'The member who you want to manage lumens for.',
                required: true,
            }, {
                name: 'action',
                type: Discord.ApplicationCommandOptionType.String,
                description: 'The action you want to perform.',
                choices: [
                    {
                        name: 'Add',
                        value: ManageLumensAction.Add,
                    }, {
                        name: 'Remove',
                        value: ManageLumensAction.Remove,
                    }, {
                        name: 'Set',
                        value: ManageLumensAction.Set,
                    },
                ],
                required: true,
            }, {
                name: 'amount',
                type: Discord.ApplicationCommandOptionType.Integer,
                description: 'The amount of lumens to add, remove, or set.',
                minValue: 0,
                maxValue: 1_000_000,
                required: true,
            }, {
                name: 'reason',
                type: Discord.ApplicationCommandOptionType.String,
                description: 'The reason why you want to manage lumens.',
                minLength: 1,
                maxLength: 256,
                required: true,
            },
        ],
    },
    metadata: {
        required_run_context: CustomInteractionRunContext.Guild,
        required_access_level: CustomInteractionAccessLevel.TeamLeaders, /** @todo make this available to admins once ready */
    },
    handler: async (discord_client, interaction) => {
        if (!interaction.isChatInputCommand()) return;
        if (!interaction.inCachedGuild()) return;

        await interaction.deferReply({ flags: ['Ephemeral'] });

        const user_to_modify = interaction.options.getUser('for', true);
        const action_to_perform = interaction.options.getString('action', true) as ManageLumensAction;
        const amount_to_modify_by = interaction.options.getInteger('amount', true);
        const reason = interaction.options.getString('reason', true);

        /* ensure the action to perform is valid */
        if (!Object.values(ManageLumensAction).includes(action_to_perform)) {
            await interaction.editReply({
                embeds: [
                    CustomEmbed.from({
                        color: CustomEmbed.Color.Yellow,
                        description: `Invalid action: \`${action_to_perform}\``,
                    }),
                ],
            }).catch(console.warn);

            return;
        }

        const db_user = await prisma.user.findFirst({
            where: {
                discordId: user_to_modify.id
            }
        })

        /* check if the user exists */
        if (!db_user) {
            await interaction.editReply({
                embeds: [
                    CustomEmbed.from({
                        color: CustomEmbed.Color.Yellow,
                        description: `${user_to_modify} does not exist in the database!`,
                    }),
                ],
            }).catch(console.warn);

            return;
        }


        let updated_user;
        try {
            switch (action_to_perform) {
                case 'add': {
                    updated_user = await prisma.user.update({
                        where: {
                            id: db_user.id
                        },
                        data: {
                            lumens: {
                                increment: amount_to_modify_by
                            }
                        }
                    })
                    break;
                }

                case 'remove': {
                    updated_user = await prisma.user.update({
                        where: {
                            id: db_user.id
                        },
                        data: {
                            lumens: {
                                decrement: amount_to_modify_by
                            }
                        }
                    })
                    break;
                }

                case 'set': {
                    updated_user = await prisma.user.update({
                        where: {
                            id: db_user.id
                        },
                        data: {
                            lumens: {
                                set: amount_to_modify_by
                            }
                        }
                    })
                    break;
                }

                default: {
                    await interaction.editReply({
                        embeds: [
                            CustomEmbed.from({
                                color: CustomEmbed.Color.Red,
                                description: `Invalid action: \`${action_to_perform}\``,
                            }),
                        ],
                    }).catch(console.warn);

                    return;
                }
            }
        } catch (err) {
            console.trace(err)
            await interaction.editReply({
                embeds: [
                    CustomEmbed.from({
                        color: CustomEmbed.Color.Red,
                        title: 'Error',
                        description: `Could not ${action_to_perform} lumens on user.`,
                    }),
                ],
            }).catch(console.warn);
            return;
        }

        await interaction.editReply({
            embeds: [
                CustomEmbed.from({
                    color: action_to_perform === ManageLumensAction.Add ? (
                        CustomEmbed.Color.Green
                    ) : action_to_perform === ManageLumensAction.Remove ? (
                        CustomEmbed.Color.Red
                    ) : (
                        CustomEmbed.Color.Brand
                    ),
                    author: {
                        icon_url: `${discord_client.user.displayAvatarURL({ forceStatic: false })}`,
                        name: 'Inertia Lighting | Lumens System',
                    },
                    description: [
                        action_to_perform === ManageLumensAction.Add ? (
                            `Added \`${amount_to_modify_by}\` lumens to ${user_to_modify}.`
                        ) : action_to_perform === ManageLumensAction.Remove ? (
                            `Removed \`${amount_to_modify_by}\` lumens from ${user_to_modify}.`
                        ) : (
                            `Set ${user_to_modify}'s lumens to a new amount.`
                        ),
                        `New amount of lumens: \`${updated_user.lumens}\``,
                    ].join('\n'),
                    fields: [
                        {
                            name: 'Reason',
                            value: Discord.escapeMarkdown(reason),
                            inline: false,
                        },
                    ],
                }),
            ],
        }).catch(console.warn);
    },
});
