/* Copyright © Inertia Lighting | All Rights Reserved */
//---------------------------------------------------------------------------------------------------------------//
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
//---------------------------------------------------------------------------------------------------------------//
const discord_client_js_1 = require("../../discord_client.js");
const mongo_js_1 = require("../../../mongo/mongo.js");
const bot_js_1 = require("../../common/bot.js");
//---------------------------------------------------------------------------------------------------------------//
module.exports = {
    identifier: 'manage_karma',
    async execute(interaction) {
        if (!interaction.isCommand())
            return;
        await interaction.deferReply();
        const interaction_guild_member = await interaction.guild.members.fetch(interaction.user.id);
        const user_permission_level = (0, bot_js_1.getUserPermissionLevel)(interaction_guild_member);
        const user_has_access_to_command = user_permission_level >= bot_js_1.command_permission_levels.ADMINS;
        if (!user_has_access_to_command) {
            interaction.editReply(bot_js_1.user_is_not_allowed_access_to_command_message_options).catch(console.warn);
            return;
        }
        const user_to_modify = interaction.options.getUser('for', true);
        const action_to_perform = interaction.options.getString('action', true);
        const amount_to_modify_by = interaction.options.getInteger('amount', true);
        const reason = interaction.options.getString('reason', true) || 'No reason was specified.';
        /* find the user in the database */
        const [db_user_data] = await mongo_js_1.go_mongo_db.find(process.env.MONGO_DATABASE_NAME, process.env.MONGO_USERS_COLLECTION_NAME, {
            'identity.discord_user_id': user_to_modify.id,
        }, {
            projection: {
                '_id': false,
            },
        });
        /* check if the user exists */
        if (!db_user_data) {
            interaction.editReply({
                embeds: [
                    new discord_client_js_1.Discord.MessageEmbed({
                        color: 0xFFFF00,
                        description: `${user_to_modify} does not exist in the database!`,
                    }),
                ],
            }).catch(console.warn);
            return;
        }
        /** @type {number} */
        const initial_karma_amount = db_user_data.karma ?? 0;
        let updated_karma_amount;
        switch (action_to_perform) {
            case 'add': {
                updated_karma_amount = initial_karma_amount + amount_to_modify_by;
                break;
            }
            case 'remove': {
                updated_karma_amount = initial_karma_amount - amount_to_modify_by;
                break;
            }
            case 'set': {
                updated_karma_amount = amount_to_modify_by;
                break;
            }
            default: {
                interaction.editReply({
                    embeds: [
                        new discord_client_js_1.Discord.MessageEmbed({
                            color: 0xFFFF00,
                            description: `Invalid action: \`${action_to_perform}\``,
                        }),
                    ],
                }).catch(console.warn);
                return;
            }
        }
        /* prevent decimals */
        updated_karma_amount = Math.floor(updated_karma_amount);
        const karma_too_small = updated_karma_amount <= Number.MIN_SAFE_INTEGER;
        if (karma_too_small) {
            interaction.editReply({
                embeds: [
                    new discord_client_js_1.Discord.MessageEmbed({
                        color: 0xFF0000,
                        description: 'New karma amount is too small!',
                    }),
                ],
            }).catch(console.warn);
            return;
        }
        const karma_too_large = updated_karma_amount >= Number.MAX_SAFE_INTEGER;
        if (karma_too_large) {
            interaction.editReply({
                embeds: [
                    new discord_client_js_1.Discord.MessageEmbed({
                        color: 0xFF0000,
                        description: 'New karma amount is too large!',
                    }),
                ],
            }).catch(console.warn);
            return;
        }
        const karma_is_not_a_number = Number.isNaN(updated_karma_amount);
        if (karma_is_not_a_number) {
            interaction.editReply({
                embeds: [
                    new discord_client_js_1.Discord.MessageEmbed({
                        color: 0xFF0000,
                        description: 'New karma amount is not a valid number!',
                    }),
                ],
            }).catch(console.warn);
            return;
        }
        try {
            await mongo_js_1.go_mongo_db.update(process.env.MONGO_DATABASE_NAME, process.env.MONGO_USERS_COLLECTION_NAME, {
                'identity.discord_user_id': db_user_data.identity.discord_user_id,
                'identity.roblox_user_id': db_user_data.identity.roblox_user_id,
            }, {
                $set: {
                    'karma': updated_karma_amount,
                },
            });
        }
        catch (error) {
            console.trace(error);
            interaction.editReply({
                embeds: [
                    new discord_client_js_1.Discord.MessageEmbed({
                        color: 0xFF0000,
                        author: {
                            iconURL: `${discord_client_js_1.client.user.displayAvatarURL({ dynamic: true })}`,
                            name: 'Inertia Lighting | Karma System',
                        },
                        description: 'An error occurred while modifying the user\'s karma!',
                    }),
                ],
            }).catch(console.warn);
            return;
        }
        interaction.editReply({
            embeds: [
                new discord_client_js_1.Discord.MessageEmbed({
                    color: action_to_perform === 'add' ? (0x00FF00) : action_to_perform === 'remove' ? (0xFF0000) : (0x60A0FF),
                    author: {
                        iconURL: `${discord_client_js_1.client.user.displayAvatarURL({ dynamic: true })}`,
                        name: 'Inertia Lighting | Karma System',
                    },
                    description: [
                        action_to_perform === 'add' ? (`Added \`${amount_to_modify_by}\` karma to ${user_to_modify}.`) : action_to_perform === 'remove' ? (`Removed \`${amount_to_modify_by}\` karma from ${user_to_modify}.`) : (`Set ${user_to_modify}'s karma to a new amount.`),
                        `New karma amount: \`${updated_karma_amount}\``,
                    ].join('\n'),
                    fields: [
                        {
                            name: 'Reason',
                            value: `${reason}`,
                        },
                    ],
                }),
            ],
        }).catch(console.warn);
    },
};
//# sourceMappingURL=manage_karma.js.map