// ------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
// ------------------------------------------------------------//

import { CustomInteraction, CustomInteractionAccessLevel, CustomInteractionRunContext } from '@root/common/managers/custom_interactions_manager';
import { CustomEmbed } from '@root/common/message';
import prisma from '@root/lib/prisma_client'; 
import * as Discord from 'discord.js';

// ------------------------------------------------------------//

const db_database_name = `${process.env.MONGO_DATABASE_NAME ?? ''}`;
if (db_database_name.length < 1) throw new Error('Environment variable: MONGO_DATABASE_NAME; is not set correctly.');

const db_users_collection_name = `${process.env.MONGO_USERS_COLLECTION_NAME ?? ''}`;
if (db_users_collection_name.length < 1) throw new Error('Environment variable: MONGO_USERS_COLLECTION_NAME; is not set correctly.');

const db_blacklisted_users_collection_name = `${process.env.MONGO_BLACKLISTED_USERS_COLLECTION_NAME ?? ''}`;
if (db_blacklisted_users_collection_name.length < 1) throw new Error('Environment variable: MONGO_BLACKLISTED_USERS_COLLECTION_NAME; is not set correctly.');

const api_server = `${process.env.API_SERVER ?? ''}`;
if (api_server.length < 1) throw new Error('Environment variable: API_SERVER; is not set correctly.');

// ------------------------------------------------------------//

export default new CustomInteraction({
    identifier: 'transfer',
    type: Discord.InteractionType.ApplicationCommand,
    data: {
        type: Discord.ApplicationCommandType.ChatInput,
        description: 'Transfer products to another user',
        options: [
            {
                name: 'user_a',
                description: 'Source user',
                type: Discord.ApplicationCommandOptionType.User,
                required: true,
            },
            {
                name: 'user_b',
                description: 'Target user',
                type: Discord.ApplicationCommandOptionType.User,
                required: true,
            },
            {
                name: 'product_code',
                description: 'Product code',
                type: Discord.ApplicationCommandOptionType.String,
                required: true,
            },
            {
                name: 'reason',
                description: 'Reason',
                type: Discord.ApplicationCommandOptionType.String,
                required: true,
            }
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

        const user_a = interaction.options.getUser('user_a', true);
        const user_b = interaction.options.getUser('user_b', true);
        const product_code = interaction.options.getString('product_code', true);
        const reason = interaction.options.getString('reason', true);

        if (user_a.id === user_b.id) {
            await interaction.reply({
                ephemeral: true,
                embeds: [
                    CustomEmbed.from({
                        color: CustomEmbed.Color.Red,
                        title: 'Transfer',
                        description: 'USER_A and USER_B cannot be the same user.',
                    }),
                ],
            });
            return;
        }

        await interaction.deferReply()
        await interaction.editReply({
            embeds: [
                CustomEmbed.from({
                    title: 'Transfer',
                    description: 'Checking if users exists'
                })
            ]
        })

        const user_a_db = await prisma.user.findUnique({ 
            where: { 
                discordId: user_a.id 
            },
            select: {
                id: true
            }
        });

        const user_b_db = await prisma.user.findUnique({ 
            where: { 
                discordId: user_b.id 
            },
            select: {
                id: true
            }
        });

        if (!user_a_db) {
            await interaction.editReply({
                embeds: [
                    CustomEmbed.from({
                        color: CustomEmbed.Color.Red,
                        title: 'Transfer',
                        description: `<@${user_a.id}> was not found in the database.`,
                    }),
                ],
            });
            return;
        }
        if (!user_b_db) {
            await interaction.editReply({
                embeds: [
                    CustomEmbed.from({
                        color: CustomEmbed.Color.Red,
                        title: 'Transfer',
                        description: `<@${user_b.id}> was not found in the database.`,
                    }),
                ],
            });
            return;
        }

        const user_a_transaction = await prisma.transactions.findFirst({
            where: {
                UserId: user_a_db.id,
                productCode: product_code,
            },
            select: {
                id: true,
                productCode: true,
                UserId: true,
                oneTimeTransferUsed: true,
            },
        });

        if (!user_a_transaction) { 
            await interaction.editReply({
                embeds: [
                    CustomEmbed.from({
                        color: CustomEmbed.Color.Red,
                        title: 'Transfer',
                        description: `No valid transaction for <@${user_a.id}>, transaction not exists.`,
                    }),
                ],
            });
            return;
        }

        if (user_a_transaction.oneTimeTransferUsed) {
            await interaction.editReply({
                embeds: [
                    CustomEmbed.from({
                        color: CustomEmbed.Color.Red,
                        title: 'Transfer',
                        description: `No valid transaction for <@${user_a.id}>, product it was already transferred.`,
                    }),
                ],
            });
            return;
        }

        const confirm_row = new Discord.ActionRowBuilder<Discord.ButtonBuilder>().addComponents(
            new Discord.ButtonBuilder().setCustomId('transfer_confirm').setLabel('Confirm').setStyle(Discord.ButtonStyle.Success),
            new Discord.ButtonBuilder().setCustomId('transfer_cancel').setLabel('Cancel').setStyle(Discord.ButtonStyle.Secondary),
        );

        const confirm_msg = await interaction.editReply({
            embeds: [
                CustomEmbed.from({
                    color: CustomEmbed.Color.Blue,
                    title: 'Transfer',
                    description: `Confirm transfer for product: **${product_code}** from <@${user_a.id}> to <@${user_b.id}>`,
                }),
            ],
            components: [confirm_row]
        });

        const clicked = await (confirm_msg as Discord.Message).awaitMessageComponent<Discord.ComponentType.Button>({
            time: 60_000,
            filter: (i: Discord.MessageComponentInteraction<Discord.CacheType>) => i.user.id === interaction.user.id && ['transfer_confirm', 'transfer_cancel'].includes(i.customId),
        });

        if (clicked.customId === 'transfer_cancel') {
            await clicked.update({ 
                components: [], 
                embeds: [
                    CustomEmbed.from({ 
                        color: CustomEmbed.Color.Red, 
                        title: 'Transfer',
                        description: 'Transfer cancelled.',
                    })
                ] 
            });
            return;
        }

        try {
            await prisma.$transaction(async (tx) => {
                await tx.transactions.update({
                    where: { 
                        id: user_a_transaction.id 
                    },
                    data: {
                        oneTimeTransferUsed: true,
                        UserId: user_b_db.id,
                    },
                });

                await tx.transfers.create({
                    data: {
                        transferReason: reason,
                        TransactionId: user_a_transaction.id,
                        NewUserId: user_b_db.id,
                    },
                });
            });

            await clicked.update({
                components: [],
                embeds: [
                    CustomEmbed.from({
                        color: CustomEmbed.Color.Green,
                        title: 'Transfer',
                        description: `Transaction: \`${user_a_transaction.id}\`, Product: \`${product_code}\` transferred from <@${user_a.id}> to <@${user_b.id}>.`,
                    }),
                ],
            });
        } catch {
            await clicked.update({
                components: [],
                embeds: [
                    CustomEmbed.from({
                        color: CustomEmbed.Color.Red,
                        title: 'Transfer',
                        description: 'Could not complete the transfer.',
                    }),
                ],
            });
        }
    },
});
