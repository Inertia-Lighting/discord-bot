//------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
//------------------------------------------------------------//

import * as Discord from 'discord.js';

import { userProfileHandler } from '@root/bot/handlers/user_profile_handler';

import { CustomInteraction, CustomInteractionAccessLevel } from '@root/bot/common/managers/custom_interactions_manager';

//------------------------------------------------------------//

const db_database_name = `${process.env.MONGO_DATABASE_NAME ?? ''}`;
if (db_database_name.length < 1) throw new Error('Environment variable: MONGO_DATABASE_NAME; is not set correctly.');

const db_users_collection_name = `${process.env.MONGO_USERS_COLLECTION_NAME ?? ''}`;
if (db_users_collection_name.length < 1) throw new Error('Environment variable: MONGO_USERS_COLLECTION_NAME; is not set correctly.');

//------------------------------------------------------------//

export default new CustomInteraction({
    identifier: 'User Profile',
    type: Discord.InteractionType.ApplicationCommand,
    data: undefined,
    metadata: {
        required_access_level: CustomInteractionAccessLevel.TeamLeaders,
    },
    handler: async (discord_client, interaction) => {
        if (!interaction.inCachedGuild()) return;
        if (!interaction.isUserContextMenuCommand()) return;

        await interaction.deferReply({ ephemeral: true });

        userProfileHandler(interaction, interaction.targetUser.id);
    },
});
