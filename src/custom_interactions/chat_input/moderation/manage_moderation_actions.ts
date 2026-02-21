// ------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
// ------------------------------------------------------------//

import * as Discord from 'discord.js';

import { CustomInteraction, CustomInteractionAccessLevel, CustomInteractionRunContext } from '@/common/managers/custom_interactions_manager.js'

import { listModerationActions, purgeModerationActions,removeModerationAction, updateModerationAction } from '../../../lib/moderation/index.js';

// ------------------------------------------------------------//

const db_database_name = `${process.env.MONGO_DATABASE_NAME ?? ''}`;
if (db_database_name.length < 1) throw new Error('Environment variable: MONGO_DATABASE_NAME; is not set correctly.');

const db_moderation_action_records_collection_name = `${process.env.MONGO_MODERATION_ACTION_RECORDS_COLLECTION_NAME ?? ''}`;
if (db_moderation_action_records_collection_name.length < 1) throw new Error('Environment variable: MONGO_MODERATION_ACTION_RECORDS_COLLECTION_NAME; is not set correctly.');

// ------------------------------------------------------------//


export default new CustomInteraction({
    identifier: 'manage_moderation_actions',
    type: Discord.InteractionType.ApplicationCommand,
    data: {
        type: Discord.ApplicationCommandType.ChatInput,
        description: 'Used by staff to manage moderation actions.',
        options: [
            {
                name: 'list',
                type: Discord.ApplicationCommandOptionType.Subcommand,
                description: 'Used by staff to list all moderation actions.',
                options: [],
            }, {
                name: 'lookup',
                type: Discord.ApplicationCommandOptionType.Subcommand,
                description: 'Lookup a moderation action id.',
                options: [
                    {
                        name: 'moderation_action_id',
                        type: Discord.ApplicationCommandOptionType.String,
                        description: 'The moderation action id you want to lookup.',
                        minLength: 1,
                        maxLength: 64,
                        required: true,
                    },
                ],
            }, {
                name: 'for',
                type: Discord.ApplicationCommandOptionType.Subcommand,
                description: 'Find all moderation actions for a user.',
                options: [
                    {
                        name: 'user',
                        type: Discord.ApplicationCommandOptionType.User,
                        description: 'The user you want to lookup.',
                        required: true,
                    },
                ],
            }, {
                name: 'from',
                type: Discord.ApplicationCommandOptionType.Subcommand,
                description: 'Show all moderation actions performed by a staff member.',
                options: [
                    {
                        name: 'staff_member',
                        type: Discord.ApplicationCommandOptionType.User,
                        description: 'The staff member to lookup.',
                        required: true,
                    },
                ],
            }, {
                name: 'update',
                type: Discord.ApplicationCommandOptionType.Subcommand,
                description: 'Update the reason for a moderation action.',
                options: [
                    {
                        name: 'moderation_action_id',
                        type: Discord.ApplicationCommandOptionType.String,
                        description: 'The moderation action id to update.',
                        minLength: 1,
                        maxLength: 64,
                        required: true,
                    }, {
                        name: 'reason',
                        type: Discord.ApplicationCommandOptionType.String,
                        description: 'The new reason for the moderation action.',
                        minLength: 1,
                        maxLength: 256,
                        required: true,
                    },
                ],
            }, {
                name: 'remove',
                type: Discord.ApplicationCommandOptionType.Subcommand,
                description: 'Removes a moderation action from the database.',
                options: [
                    {
                        name: 'moderation_action_id',
                        type: Discord.ApplicationCommandOptionType.String,
                        description: 'The moderation action id to remove from the database.',
                        minLength: 1,
                        maxLength: 64,
                        required: true,
                    },
                ],
            }, {
                name: 'purge',
                type: Discord.ApplicationCommandOptionType.Subcommand,
                description: 'Removes all moderation actions for a specified user.',
                options: [
                    {
                        name: 'user',
                        type: Discord.ApplicationCommandOptionType.User,
                        description: 'The user to remove all moderation actions for.',
                        required: true,
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

        await interaction.deferReply({ flags: ['Ephemeral'] });

        const subcommand_name = interaction.options.getSubcommand(true);

        switch (subcommand_name) {
            case 'list': {
                await listModerationActions(interaction, {
                    lookup_mode: ModerationActionLookupMode.All,
                    lookup_query: 'all',
                });

                break;
            }

            case 'lookup': {
                const moderation_action_id = interaction.options.getString('moderation_action_id', true);

                await listModerationActions(interaction, {
                    lookup_mode: ModerationActionLookupMode.Id,
                    lookup_query: moderation_action_id,
                });

                break;
            }

            case 'for': {
                const user = interaction.options.getUser('user', true);

                await listModerationActions(interaction, {
                    lookup_mode: ModerationActionLookupMode.DiscordUser,
                    lookup_query: user.id,
                });

                break;
            }

            case 'from': {
                const staff_member = interaction.options.getUser('staff_member', true);

                await listModerationActions(interaction, {
                    lookup_mode: ModerationActionLookupMode.StaffMember,
                    lookup_query: staff_member.id,
                });

                break;
            }

            case 'update': {
                await updateModerationAction(interaction);

                break;
            }

            case 'remove': {
                await removeModerationAction(interaction);

                break;
            }

            case 'purge': {
                await purgeModerationActions(interaction);

                break;
            }

            default: {
                throw new Error(`Unknown subcommand name: ${subcommand_name}`);
            }
        }
    },
});
