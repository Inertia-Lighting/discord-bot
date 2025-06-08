//------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
//------------------------------------------------------------//

import * as Discord from 'discord.js';

import { DbBlacklistedUserRecord, DbUserData } from '@root/types';

import { go_mongo_db } from '@root/common/mongo/mongo';

import { CustomEmbed } from '@root/common/message';

import { CustomInteraction, CustomInteractionAccessLevel, CustomInteractionRunContext } from '@root/common/managers/custom_interactions_manager';
import { Prisma } from '../../lib/prisma';
import prisma from '../../lib/prisma_client';

//------------------------------------------------------------//

const db_database_name = `${process.env.MONGO_DATABASE_NAME ?? ''}`;
if (db_database_name.length < 1) throw new Error('Environment variable: MONGO_DATABASE_NAME; is not set correctly.');

const db_users_collection_name = `${process.env.MONGO_USERS_COLLECTION_NAME ?? ''}`;
if (db_users_collection_name.length < 1) throw new Error('Environment variable: MONGO_USERS_COLLECTION_NAME; is not set correctly.');

const db_blacklisted_users_collection_name = `${process.env.MONGO_BLACKLISTED_USERS_COLLECTION_NAME ?? ''}`;
if (db_blacklisted_users_collection_name.length < 1) throw new Error('Environment variable: MONGO_BLACKLISTED_USERS_COLLECTION_NAME; is not set correctly.');

//------------------------------------------------------------//

export default new CustomInteraction({
    identifier: 'lookup',
    type: Discord.InteractionType.ApplicationCommand,
    data: {
        type: Discord.ApplicationCommandType.ChatInput,
        description: 'Used by staff to lookup a user\'s database record.',
        options: [
            {
                name: 'discord',
                type: Discord.ApplicationCommandOptionType.Subcommand,
                description: 'Uses discord ids to lookup a user.',
                options: [
                    {
                        name: 'user',
                        type: Discord.ApplicationCommandOptionType.User,
                        description: 'The discord user to lookup.',
                        required: true,
                    }, {
                        name: 'ephemeral',
                        type: Discord.ApplicationCommandOptionType.Boolean,
                        description: 'Whether or not to respond with an ephemeral message.',
                        required: false,
                    },
                ],
            }, {
                name: 'roblox',
                type: Discord.ApplicationCommandOptionType.Subcommand,
                description: 'Uses roblox ids to lookup a user.',
                options: [
                    {
                        name: 'user',
                        type: Discord.ApplicationCommandOptionType.String,
                        description: 'The roblox user id to lookup.',
                        required: true,
                    }, {
                        name: 'ephemeral',
                        type: Discord.ApplicationCommandOptionType.Boolean,
                        description: 'Whether or not to respond with an ephemeral message.',
                        required: false,
                    },
                ],
            },
        ],
    },
    metadata: {
        required_run_context: CustomInteractionRunContext.Guild,
        required_access_level: CustomInteractionAccessLevel.Staff,
    },
    handler: async (discord_client, interaction) => {
        if (!interaction.isChatInputCommand()) return;
        if (!interaction.inCachedGuild()) return;
        if (!interaction.channel) return;

        const subcommand_name = interaction.options.getSubcommand(true);

        const respond_as_ephemeral: boolean = interaction.options.getBoolean('ephemeral', false) ?? false; // default to false

        await interaction.deferReply({ ephemeral: respond_as_ephemeral });

        let user_id_type: 'discord' | 'roblox';
        let user_id: string;
        switch (subcommand_name) {
            case 'discord': {
                user_id_type = 'discord';
                user_id = interaction.options.getUser('user', true).id;

                break;
            }

            case 'roblox': {
                user_id_type = 'roblox';
                user_id = interaction.options.getString('user', true);

                break;
            }

            default: {
                throw new Error(`Unknown subcommand name: ${subcommand_name}`);
            }
        }

        const user_id_regex = /^\d+$/;
        if (!user_id_regex.test(user_id)) {
            await interaction.editReply({
                content: 'You supplied an invalid user id.',
            });

            return;
        }

        /* fetch blacklisted user data */
        const userData = await prisma.user.findFirst({
            where:  {
                OR: [
                    {
                        discordId: user_id
                    },
                    {
                        robloxId: user_id
                    }
                ]
            },
            include: {
                transactions: true,
                receivedPunishments: true,
                issuedPunishments: true,
                Transfers: true,
            }
        }) 
        const blacklistData = await userData?.receivedPunishments.find((data) => data.punishmentType === 'blacklist')

        /* send the user document */
        await interaction.editReply({
            embeds: [
                ...(blacklistData? [
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
                            `${Discord.cleanCodeBlockContent(JSON.stringify(blacklistData, null, 2))}`,
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
                        `${Discord.cleanCodeBlockContent(JSON.stringify(userData ?? 'user not found in database', null, 2))}`,
                        '\`\`\`',
                    ].join('\n'),
                }),
            ],
        }).catch(console.warn);
    },
});
