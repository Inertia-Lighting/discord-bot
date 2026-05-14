// ------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
// ------------------------------------------------------------//

import * as Discord from 'discord.js';

import { BlacklistModel, UserModel } from '@/common/lib/mongoose/models/index.js';
import { CustomInteraction, CustomInteractionAccessLevel, CustomInteractionRunContext } from '@/common/managers/custom_interactions_manager.js'
import { CustomEmbed } from '@/common/message.js'
import { DbBlacklistedUserRecord, DbUserData } from '@/types/index.js'


// ------------------------------------------------------------//

export default new CustomInteraction({
    identifier: 'User Lookup V2',
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

        await interaction.deferReply({ flags: ['Ephemeral'] });

        const findUser = await UserModel.findOne<DbUserData>({
            'identity.discord_user_id': interaction.targetUser.id,
        }, {
            '_id': false
        })


        if (!findUser) {
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
        const findBlacklistedUser = await BlacklistModel.findOne<DbBlacklistedUserRecord>({
            $or: [
                { 'identity.discord_user_id': findUser.identity.discord_user_id },
                { 'identity.roblox_user_id': findUser.identity.roblox_user_id },
            ],
        }, {
            '_id': false
        })


        await interaction.editReply({
            embeds: [
                ...(findBlacklistedUser ? [
                    CustomEmbed.from({
                        color: CustomEmbed.Color.Red,
                        author: {
                            icon_url: `${discord_client.user.displayAvatarURL({ forceStatic: false })}`,
                            name: 'Inertia Lighting | User Blacklist System',
                        },
                        description: [
                            '',
                            'User is blacklisted from using products!',
                            '',
                            '```json',
                            `${Discord.cleanCodeBlockContent(JSON.stringify(findBlacklistedUser, null, 2))}`,
                            '```',
                        ].join('\n'),
                    }),
                ] : []),
                CustomEmbed.from({
                    author: {
                        icon_url: `${discord_client.user.displayAvatarURL({ forceStatic: false })}`,
                        name: 'Inertia Lighting | User Lookup System',
                    },
                    description: [
                        '```json',
                        `${Discord.cleanCodeBlockContent(JSON.stringify(findUser ?? 'user not found in database', null, 2))}`,
                        '```',
                    ].join('\n'),
                }),
            ],
        }).catch(console.warn);
    },
});
