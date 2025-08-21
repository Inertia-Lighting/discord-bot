// ------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
// ------------------------------------------------------------//

import { CustomInteraction, CustomInteractionAccessLevel, CustomInteractionRunContext } from '@root/common/managers/custom_interactions_manager';
import { CustomEmbed } from '@root/common/message';
import axios from 'axios';
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

enum IdentityType {
    Roblox = 'robloxId',
    // eslint-disable-next-line no-shadow
    Discord = 'discordId',
}

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
                type: Discord.ApplicationCommandOptionType.String,
                choices: [
                    {
                        name: 'Discord',
                        value: IdentityType.Discord,
                    },
                    {
                        name: 'Roblox',
                        value: IdentityType.Roblox,
                    },
                ],
                required: true,
            },
            {
                name: 'user_b',
                description: 'Target user',
                type: Discord.ApplicationCommandOptionType.String,
                choices: [
                    {
                        name: 'Discord',
                        value: IdentityType.Discord,
                    },
                    {
                        name: 'Roblox',
                        value: IdentityType.Roblox,
                    },
                ],
                required: true,
            },
            {
                name: 'product',
                description: 'Product code',
                type: Discord.ApplicationCommandOptionType.String,
                required: true,
            },
            {
                name: 'reason',
                description: 'Transfer reason',
                type: Discord.ApplicationCommandOptionType.String,
                required: false,
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

        await interaction.deferReply()
        await interaction.editReply({
            embeds: [
                CustomEmbed.from({
                    title: 'Migration',
                    description: 'Checking if account exists in V3'
                })
            ]
        })
        const alreadyMigratedResponse = await axios.post<v3Identity>(`https://${api_server}/v3/user/identity/fetch`, {
            discordId: interaction.user.id,
        }).catch(() => {
            // Blank
        });
        try {
            if (alreadyMigratedResponse) {
                await interaction.editReply({
                    embeds: [
                        CustomEmbed.from({
                            color: CustomEmbed.Color.Red,
                            title: 'Already Migrated',
                            description: 'Your account is already migrated to V3'
                        })
                    ]
                })
                return;
            }
            console.log('Starting migration for ' + interaction.user.username)
            await interaction.editReply({
                embeds: [
                    CustomEmbed.from({
                        color: CustomEmbed.Color.Yellow,
                        title: 'Migration',
                        description: 'Migrating account'
                    })
                ]
            })
            const migration = await axios.post(`https://${api_server}/v2/user/identity/fetch`, {
                discord_user_id: interaction.user.id
            }, {
                validateStatus: (status) => [200, 404].includes(status)
            });
            if (migration.status === 200) {
                await interaction.editReply({
                    embeds: [
                        CustomEmbed.from({
                            color: CustomEmbed.Color.Green,
                            title: 'Migration',
                            description: 'Migration Successful'
                        })
                    ]
                })
            } else {
                console.log(migration.status)
                console.log(JSON.stringify(migration.data))
                await interaction.editReply({
                    embeds: [
                        CustomEmbed.from({
                            color: CustomEmbed.Color.Red,
                            title: 'Migration',
                            description: 'Failed to migrate account'
                        })
                    ]
                })
            }
        } catch (err) {
            console.trace(err)
            await interaction.editReply({
                embeds: [
                    CustomEmbed.from({
                        color: CustomEmbed.Color.Red,
                        title: 'Migration',
                        description: 'Failed to migrate account'
                    })
                ]
            })
        }
    },
});
