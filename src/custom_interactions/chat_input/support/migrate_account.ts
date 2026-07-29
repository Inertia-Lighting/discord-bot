/* -------------------------------------------------------------------------- */
/*            Copyright (c) Inertia Lighting, Some Rights Reserved            */
/* -------------------------------------------------------------------------- */

/* ------------------------------ Dependencies ------------------------------ */

import * as Discord from 'discord.js'
import got from 'got';

import { CustomInteraction, CustomInteractionAccessLevel, CustomInteractionRunContext } from '@/common/managers/custom_interactions_manager.js'
import { CustomEmbed } from '@/common/message.js'

/* -------------------------- Environment Variables ------------------------- */


const api_server = `${process.env.API_SERVER ?? ''}`;
if (api_server.length < 1) throw new Error('Environment variable: API_SERVER; is not set correctly.');

/* -------------------------------- Constants ------------------------------- */


interface v3Identity {
    blacklisted: boolean | object
    lumens: number;
    discordId: string;
    robloxId: string;
}

/* ------------------------------- Definition ------------------------------- */

export default new CustomInteraction({
    identifier: 'migrate_account',
    type: Discord.InteractionType.ApplicationCommand,
    data: {
        type: Discord.ApplicationCommandType.ChatInput,
        description: 'Migrate your account to the new V3 system',
    },
    metadata: {
        required_run_context: CustomInteractionRunContext.Guild,
        required_access_level: CustomInteractionAccessLevel.Public,
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
        const alreadyMigratedResponse = await got.post<v3Identity>(`https://${api_server}/v3/user/identity/fetch`, {
            json: {
                discordId: interaction.user.id,
            }
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
            const migration = await got.post(`https://${api_server}/v2/user/identity/fetch`, {
                json: {
                    discord_user_id: interaction.user.id
                },
            },);
            if (migration.statusCode === 200) {
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
                console.log(migration.statusCode)
                console.log(JSON.stringify(migration.body))
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
