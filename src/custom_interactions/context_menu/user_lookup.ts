//------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
//------------------------------------------------------------//

import * as Discord from 'discord.js';

import { CustomInteraction, CustomInteractionAccessLevel, CustomInteractionRunContext } from '@root/common/managers/custom_interactions_manager';
import { DbBlacklistedUserRecord, DbUserData } from '../../types';
import { CustomEmbed } from '../../common/message';
import { go_mongo_db } from '../../common/mongo/mongo';


//------------------------------------------------------------//

const db_database_name = `${process.env.MONGO_DATABASE_NAME ?? ''}`;
if (db_database_name.length < 1) throw new Error('Environment variable: MONGO_DATABASE_NAME; is not set correctly.');

const db_users_collection_name = `${process.env.MONGO_USERS_COLLECTION_NAME ?? ''}`;
if (db_users_collection_name.length < 1) throw new Error('Environment variable: MONGO_USERS_COLLECTION_NAME; is not set correctly.');

const db_blacklisted_users_collection_name = `${process.env.MONGO_BLACKLISTED_USERS_COLLECTION_NAME ?? ''}`;
if (db_blacklisted_users_collection_name.length < 1) throw new Error('Environment variable: MONGO_BLACKLISTED_USERS_COLLECTION_NAME; is not set correctly.');
//------------------------------------------------------------//

export default new CustomInteraction({
    identifier: 'User Profile',
    type: Discord.InteractionType.ApplicationCommand,
    data: {
        type: Discord.ApplicationCommandType.User,
    },
    metadata: {
        required_run_context: CustomInteractionRunContext.Guild,
        required_access_level: CustomInteractionAccessLevel.Staff,
    },
    handler: async (discord_client, interaction) => {
        if (!interaction.inCachedGuild()) return;
        if (!interaction.isUserContextMenuCommand()) return;

        await interaction.deferReply({ ephemeral: true });

        const db_user_data_find_cursor = await go_mongo_db.find(db_database_name, db_users_collection_name, {
            'identity.discord_user_id': interaction.targetUser.id,
        }, {
            projection: {
                '_id': false,
            },
        });

        const db_user_data = await db_user_data_find_cursor.next() as unknown as DbUserData | null;

        if (!db_user_data) {
            await interaction.editReply({
                embeds: [
                    CustomEmbed.from({
                        color: CustomEmbed.Color.Yellow,
                        author: {
                            icon_url: `${discord_client.user.displayAvatarURL({ forceStatic: false })}`,
                            name: 'Inertia Lighting | User Profile System',
                        },
                        title: 'Unknown User',
                        description: [
                            'That user doesn\'t exist in our database!',
                        ].join('\n'),
                    }),
                ],
            }).catch(console.warn);

            return;
        }
        const db_blacklisted_user_data_find_cursor = await go_mongo_db.find(db_database_name, db_blacklisted_users_collection_name, {
            $or: [
                { 'identity.discord_user_id': db_user_data.identity.discord_user_id },
                { 'identity.roblox_user_id': db_user_data.identity.roblox_user_id },
            ],
        }, {
            projection: {
                '_id': false,
            },
        });

        const db_blacklisted_user_data = await db_blacklisted_user_data_find_cursor.next() as unknown as DbBlacklistedUserRecord | null;

        await interaction.editReply({
            embeds: [
                ...(db_blacklisted_user_data ? [
                    CustomEmbed.from({
                        color: CustomEmbed.Color.Red,
                        author: {
                            icon_url: `${discord_client.user.displayAvatarURL({ forceStatic: false })}`,
                            name: 'Inertia Lighting | User Blacklist System',
                        },
                        description: [
                            '\`\`\`',
                            'User is blacklisted from using products!',
                            '\`\`\`',
                            '\`\`\`json',
                            `${Discord.cleanCodeBlockContent(JSON.stringify(db_blacklisted_user_data, null, 2))}`,
                            '\`\`\`',
                        ].join('\n'),
                    }),
                ] : []),
                CustomEmbed.from({
                    author: {
                        icon_url: `${discord_client.user.displayAvatarURL({ forceStatic: false })}`,
                        name: 'Inertia Lighting | User Lookup System',
                    },
                    description: [
                        '\`\`\`json',
                        `${Discord.cleanCodeBlockContent(JSON.stringify(db_user_data ?? 'user not found in database', null, 2))}`,
                        '\`\`\`',
                    ].join('\n'),
                }),
            ],
        }).catch(console.warn);
    },
});
