import * as Discord from 'discord.js'

import { CustomEmbed } from '@/common/message.js';
import prisma from '@/lib/prisma_client.js';

export async function removeModerationAction(
    interaction: Discord.ChatInputCommandInteraction,
) {
    if (!interaction.inCachedGuild()) return;
    if (!interaction.isChatInputCommand()) return;

    const punishment_id = interaction.options.getString('moderation_action_id', true);

    /* remove the member's moderation actions from the database */
    let db_delete_operation_count = 0;
    try {
        // const db_deletion_result = await go_mongo_db.remove(db_database_name, db_moderation_action_records_collection_name, {
        //     'record.id': moderation_action_id,
        // });

        // db_delete_operation_count = db_deletion_result.deletedCount ?? 0;
        const delete_records = await prisma.punishments.deleteMany({
            where: {
                id: punishment_id
            },
        })
        db_delete_operation_count = delete_records.count
    } catch {
        await interaction.editReply({
            embeds: [
                CustomEmbed.from({
                    color: CustomEmbed.Color.Red,
                    author: {
                        icon_url: `${interaction.client.user.displayAvatarURL({ forceStatic: false })}`,
                        name: 'Inertia Lighting | Moderation Actions',
                    },
                    title: 'Something went wrong!',
                    description: 'Please inform my developers that an error occurred while clearing moderation actions from the database!',
                }),
            ],
        }).catch(console.warn);

        return;
    }

    if (db_delete_operation_count === 0) {
        await interaction.editReply({
            embeds: [
                CustomEmbed.from({
                    color: CustomEmbed.Color.Red,
                    author: {
                        icon_url: `${interaction.client.user.displayAvatarURL({ forceStatic: false })}`,
                        name: 'Inertia Lighting | Moderation Actions',
                    },
                    description: 'No moderation actions were removed for the specified query.',
                }),
            ],
        }).catch(console.warn);

        return;
    }

    await interaction.editReply({
        embeds: [
            CustomEmbed.from({
                color: 0x00FF00,
                author: {
                    icon_url: `${interaction.client.user.displayAvatarURL({ forceStatic: false })}`,
                    name: 'Inertia Lighting | Moderation Actions',
                },
                description: `Successfully cleared ${db_delete_operation_count} moderation action(s)!`,
            }),
        ],
    }).catch(console.warn);
}