// ------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
// ------------------------------------------------------------//

import axios from 'axios';
import * as Discord from 'discord.js';

import { CustomInteraction, CustomInteractionAccessLevel, CustomInteractionRunContext } from '@/common/managers/custom_interactions_manager.js'
;
import { CustomEmbed } from '@/common/message.js'
;

// ------------------------------------------------------------//

const api_server = `${process.env.API_SERVER ?? ''}`;
if (api_server.length < 1) throw new Error('Environment variable: API_SERVER; is not set correctly.');

// ------------------------------------------------------------//

interface v3Identity {
    blacklisted: boolean | object
    lumens: number;
    discordId: string;
    robloxId: string;
}
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
