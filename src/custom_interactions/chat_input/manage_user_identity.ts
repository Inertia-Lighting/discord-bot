//------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
//------------------------------------------------------------//

import * as Discord from 'discord.js';

import { go_mongo_db } from '@root/common/mongo/mongo';

import { CustomEmbed } from '@root/common/message';

import { CustomInteraction, CustomInteractionAccessLevel, CustomInteractionRunContext } from '@root/common/managers/custom_interactions_manager';

//------------------------------------------------------------//

const db_database_name = `${process.env.MONGO_DATABASE_NAME ?? ''}`;
if (db_database_name.length < 1) throw new Error('Environment variable: MONGO_DATABASE_NAME; is not set correctly.');

const db_users_collection_name = `${process.env.MONGO_USERS_COLLECTION_NAME ?? ''}`;
if (db_users_collection_name.length < 1) throw new Error('Environment variable: MONGO_USERS_COLLECTION_NAME; is not set correctly.');


enum IdType {
    Roblox = 'roblox',
    Discord = 'discord'
}

//------------------------------------------------------------//

export default new CustomInteraction({
    identifier: 'manage_user_identity',
    type: Discord.InteractionType.ApplicationCommand,
    data: {
        type: Discord.ApplicationCommandType.ChatInput,
        description: 'Used by staff to manage a user\'s identity.',
        options: [
            {
                name: 'current_id_type',
                type: Discord.ApplicationCommandOptionType.String,
                description: 'Type of id that will be used currently identify the user',
                choices: [
                    {
                        name: 'Discord',
                        value: 'discord',
                    },
                    {
                        name: 'Roblox',
                        value: 'roblox',
                    },
                ],
                required: true,
            }, {
                name: 'current_id',
                type: Discord.ApplicationCommandOptionType.String,
                description: 'The current Id of the user you wish to modify',
                required: true,
            }, {
                name: 'new_id_type',
                type: Discord.ApplicationCommandOptionType.String,
                description: 'The type of the new identity you are going to assign to the user',
                choices: [
                    {
                        name: 'Discord',
                        value: 'discord',
                    },
                    {
                        name: 'Roblox',
                        value: 'roblox',
                    },
                ],
                required: true,
            }, {
                name: 'new_id',
                type: Discord.ApplicationCommandOptionType.String,
                description: 'The new identity of the user.',
                required: true,
            },
            {
                name: 'force',
                type: Discord.ApplicationCommandOptionType.Boolean,
                description: 'Would you like to force this change upon the user? (Administrators)',
                required: false,
            },
        ],
    },
    metadata: {
        required_run_context: CustomInteractionRunContext.Guild,
        required_access_level: CustomInteractionAccessLevel.CustomerService, /** @todo make this available to admins once ready */
    },
    handler: async (discord_client, interaction) => {
        if (!interaction.isChatInputCommand()) return;
        if (!interaction.inCachedGuild()) return;

        await interaction.deferReply();

        const current_id_type = interaction.options.getString('current_id_type', true) as IdType;
        const current_id = interaction.options.getString('current_id', true);
        const new_id_type = interaction.options.getString('new_id_type', true) as IdType;
        const new_id = interaction.options.getString('new_id', true);
        const force = interaction.options.getBoolean('force', false); //Skips the user confirmation

        let update_filter; //The filter used when updating the user's identity
        let updatedDocument; //The document used when updating document
        let db_user_data; //Data of the target user

        //If the force argument is used and it is true, check if the initiator is an administrator
        if (!process.env.BOT_SUPPORT_STAFF_DATABASE_ROLE_ID) return;
        const staff_member_is_permitted = interaction.member.roles.cache.has(process.env.BOT_SUPPORT_STAFF_DATABASE_ROLE_ID);
        if (!staff_member_is_permitted) {
            interaction.editReply({
                embeds: [
                    CustomEmbed.from({
                        color: CustomEmbed.Color.Violet,
                        title: 'Inertia Lighting | Identity Manager',
                        description: 'You aren\'t allowed to use this command!',
                    }),
                ],
            }).catch(console.warn);

            return;
        }
        //Check if current_id_type and new_id_type are the same to try to stop errors;
        if (current_id_type === new_id_type) {
            await interaction.editReply({
                embeds: [
                    CustomEmbed.from({
                        color: CustomEmbed.Color.Yellow,
                        title: 'Inertia Lighting | Identity Manager',
                        description: '\`\`new_id_type\`\` and \`\`current_id_type\`\` cannot be the same.',
                    }),
                ],
            }).catch(console.warn);

            return;
        }

        //Check if type is valid
        if (!Object.values(IdType).includes(current_id_type)) {
            await interaction.editReply({
                embeds: [
                    CustomEmbed.from({
                        color: CustomEmbed.Color.Yellow,
                        title: 'Inertia Lighting | Identity Manager',
                        description: `Invalid type: \`${current_id_type}\``,
                    }),
                ],
            }).catch(console.warn);

            return;
        }

        //Change update_filter based on current_id_type
        switch (current_id_type) {
            case IdType.Discord: {
                db_user_data = await go_mongo_db.find(db_database_name, db_users_collection_name, {
                    'identity.discord_user_id': current_id,
                }, {
                    projection: {
                        '_id': false,
                    },
                }).then(
                    (db_user_data_documents) => db_user_data_documents.at(0), // grab the first one
                ).catch(
                    (error) => {
                        console.trace(error);

                        return null;
                    }
                );
                update_filter = { 'identity.discord_user_id': current_id };
                break;
            }
            case IdType.Roblox: {
                db_user_data = await go_mongo_db.find(db_database_name, db_users_collection_name, {
                    'identity.roblox_user_id': current_id,
                }, {
                    projection: {
                        '_id': false,
                    },
                }).then(
                    (db_user_data_documents) => db_user_data_documents.at(0), // grab the first one
                ).catch(
                    (error) => {
                        console.trace(error);

                        return null;
                    }
                );
                update_filter = { 'identity.roblox_user_id': current_id };
                break;
            }
            default: {
                break;
            }
        }

        //Change Updated Document based on new_id_type
        switch (new_id_type) {
            case IdType.Discord: {
                updatedDocument = {
                    '$set': {
                        'identity.discord_user_id': new_id,
                    },
                };
                break;
            }
            case IdType.Roblox: {
                updatedDocument = {
                    '$set': {
                        'identity.roblox_user_id': new_id,
                    },
                };
                break;
            }
            default: {
                break;
            }
        }
        //Check if db_user_data exists
        if (!db_user_data) {
            await interaction.editReply({
                embeds: [
                    CustomEmbed.from({
                        color: CustomEmbed.Color.Violet,
                        title: 'Inertia Lighting | Identity Manager',
                        description: `Did not find a user matching \`${current_id}\` in the database.`,
                    }),
                ],
            }).catch(console.warn);

            return;
        }
        //Get the discord user from the DB
        const recipient = discord_client.users.cache.get(db_user_data.identity.discord_user_id);
        if (recipient && !force) {
            const DMChannel = await recipient.createDM();
            const confirm = new Discord.ButtonBuilder({
                custom_id: 'confirm',
                label: 'Confirm identity change',
                style: Discord.ButtonStyle.Success,
            });
            const reject = new Discord.ButtonBuilder({
                custom_id: 'reject',
                label: 'Reject identity change',
                style: Discord.ButtonStyle.Danger,
            });
            const buttons = new Discord.ActionRowBuilder<Discord.ButtonBuilder>({
                components: [confirm, reject],
            });
            const expireDate = Date.now() + 120000;
            const reqEmbed = CustomEmbed.from({
                color: CustomEmbed.Color.Blue,
                title: 'Inertia Lighting | Identity Manager',
                description: `${interaction.user.username} would like to update your ${new_id_type} id to \`${new_id}\` \n Expires in <t:${expireDate}:R>`,
            });
            const sent = await DMChannel.send({ embeds: [reqEmbed], components: [buttons] }).catch(() => {
                const resEmbed = CustomEmbed.from({
                    color: CustomEmbed.Color.Violet,
                    title: 'Inertia Lighting | Identity Manager',
                    description: `Could not DM ${recipient.username} confirmation. (Ensure that the user can receive DMs.),`,
                });
                return interaction.editReply({ embeds: [resEmbed] });
            });
            try {
                const response = await sent.awaitMessageComponent({
                    time: 120000,
                });

                switch (response.customId) {
                    case 'confirm': {
                        try {
                            // eslint-disable-next-line max-depth
                            if (update_filter && updatedDocument) {
                                go_mongo_db.update(db_database_name,
                                    db_users_collection_name,
                                    update_filter,
                                    updatedDocument);
                            }
                            const resEmbed = CustomEmbed.from({
                                title: 'Success',
                                color: CustomEmbed.Color.Green,
                                description: `Updated ${recipient.username}\'s ${new_id_type} id to ${new_id}`,
                            });

                            await interaction.editReply({ embeds: [resEmbed] });
                        } catch (e) {
                            const resEmbed = CustomEmbed.from({
                                color: CustomEmbed.Color.Violet,
                                title: 'Inertia Lighting | Identity Manager',
                                description: `Error setting identity: \`\`\`${e}\`\`\``,
                            });
                            await interaction.editReply({ embeds: [resEmbed] });
                        }
                        break;
                    }
                    case 'reject': {
                        const resEmbed = CustomEmbed.from({
                            color: CustomEmbed.Color.Violet,
                            title: 'Inertia Lighting | Identity Manager',
                            description: 'User rejected request.',
                        });
                        await interaction.editReply({ embeds: [resEmbed] });
                        break;
                    }
                    default: {
                        break;
                    }
                }
            } catch (e) {
                const resEmbed1 = CustomEmbed.from({
                    color: CustomEmbed.Color.Violet,
                    title: 'Inertia Lighting | Identity Manager',
                    description: 'Request expired.',
                });
                const resEmbed2 = CustomEmbed.from({
                    color: CustomEmbed.Color.Violet,
                    title: 'Inertia Lighting | Identity Manager',
                    description: 'User did not respond in time.',
                });
                await sent.edit({ embeds: [resEmbed1] });
                await interaction.editReply({ embeds: [resEmbed2] });
                return;
            }
        } else if (recipient && force) {
            try {
                if (update_filter && updatedDocument) {
                    go_mongo_db.update(db_database_name,
                        db_users_collection_name,
                        update_filter,
                        updatedDocument);
                }
                const resEmbed = CustomEmbed.from({
                    color: CustomEmbed.Color.Green,
                    title: 'Inertia Lighting | Identity Manager',
                    description: `Updated ${recipient.username}\'s ${new_id_type} id to ${new_id}`,
                });
                await interaction.editReply({ embeds: [resEmbed] });
                return;
            } catch (e) {
                const resEmbed = CustomEmbed.from({
                    color: CustomEmbed.Color.Violet,
                    title: 'Inertia Lighting | Identity Manager',
                    description: `Error setting identity: \`\`\`${e}\`\`\``,
                });
                await interaction.editReply({ embeds: [resEmbed] });
                return;
            }
        }
    },
});
