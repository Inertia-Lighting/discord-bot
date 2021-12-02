/* Copyright © Inertia Lighting | All Rights Reserved */

//---------------------------------------------------------------------------------------------------------------//

'use strict';

//---------------------------------------------------------------------------------------------------------------//

const stringSimilarity = require('string-similarity');

const { array_random } = require('../../../utilities.js');
const { go_mongo_db } = require('../../../mongo/mongo.js');

const { Discord, client } = require('../../discord_client.js');

//---------------------------------------------------------------------------------------------------------------//

const database_support_staff_role_id = process.env.BOT_SUPPORT_STAFF_DATABASE_ROLE_ID;

//---------------------------------------------------------------------------------------------------------------//

module.exports = {
    identifier: 'manage_products',
    /** @param {Discord.AutocompleteInteraction|Discord.CommandInteraction} interaction */
    async execute(interaction) {
        if (interaction.isAutocomplete()) {
            const search_query = `${interaction.options.getFocused()}`.toUpperCase();

            const db_roblox_products = await go_mongo_db.find(process.env.MONGO_DATABASE_NAME, process.env.MONGO_PRODUCTS_COLLECTION_NAME, {});

            const mapped_db_roblox_products = [];
            for (const db_roblox_product of db_roblox_products) {
                mapped_db_roblox_products.push({
                    ...db_roblox_product,
                    similarity_score: stringSimilarity.compareTwoStrings(search_query, db_roblox_product.code),
                });
            }

            const matching_db_roblox_products = mapped_db_roblox_products.filter(mapped_db_roblox_product => mapped_db_roblox_product.similarity_score > 0.25).sort((a, b) => b.similarity_score - a.similarity_score);

            console.warn({
                matching_db_roblox_products,
            });

            // eslint-disable-next-line no-inner-declarations
            function generateRandomRobloxProduct() {
                const random_db_roblox_product = array_random(db_roblox_products);

                const already_matched_db_roblox_product = matching_db_roblox_products.find(matching_db_roblox_product => matching_db_roblox_product.code === random_db_roblox_product?.code);

                if (!already_matched_db_roblox_product) return random_db_roblox_product;

                return generateRandomRobloxProduct();
            }

            const random_db_roblox_products = Array.from({ length: 3 }, generateRandomRobloxProduct);

            interaction.respond(
                [
                    ...matching_db_roblox_products,
                    ...random_db_roblox_products,
                ].slice(0, 5).map(db_roblox_product => ({
                    name: db_roblox_product.name,
                    value: db_roblox_product.code,
                }))
            );
        } else if (interaction.isCommand()) {
            await interaction.deferReply();

            const interaction_guild_member = await interaction.guild.members.fetch(interaction.user.id);

            /* check if the user is allowed to use this command */
            if (!interaction_guild_member.roles.cache.has(database_support_staff_role_id)) {
                interaction.editReply({
                    embeds: [
                        new Discord.MessageEmbed({
                            color: 0xFF0000,
                            description: 'You do not have permission to use this command.',
                        }),
                    ],
                });
                return;
            }

            const user_to_modify = interaction.options.getUser('for', true);
            const action_to_perform = interaction.options.getString('action', true);
            const db_roblox_product_code = interaction.options.getString('product_code', true);

            /* find the user in the database */
            const [ db_user_data ] = await go_mongo_db.find(process.env.MONGO_DATABASE_NAME, process.env.MONGO_USERS_COLLECTION_NAME, {
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
                        new Discord.MessageEmbed({
                            color: 0xFFFF00,
                            description: 'User does not exist in the database!',
                        }),
                    ],
                });
                return;
            }

            const db_roblox_products = await go_mongo_db.find(process.env.MONGO_DATABASE_NAME, process.env.MONGO_PRODUCTS_COLLECTION_NAME, {});

            const db_roblox_product = db_roblox_products.find(db_roblox_product => db_roblox_product.code === db_roblox_product_code);

            if (!db_roblox_product) {
                interaction.followUp({
                    embeds: [
                        new Discord.MessageEmbed({
                            color: 0x60A0FF,
                            description: 'Unable to find a matching product for the provided product_code.',
                        }),
                    ],
                });
                return;
            }

            await go_mongo_db.update(process.env.MONGO_DATABASE_NAME, process.env.MONGO_USERS_COLLECTION_NAME, {
                'identity.discord_user_id': db_user_data.identity.discord_user_id,
                'identity.roblox_user_id': db_user_data.identity.roblox_user_id,
            }, {
                $set: {
                    [`products.${db_roblox_product.code}`]: (action_to_perform === 'give' ? true : false),
                },
            });

            interaction.editReply({
                embeds: [
                    new Discord.MessageEmbed({
                        color: action_to_perform === 'give' ? 0x00FF00 : 0xFF0000,
                        author: {
                            iconURL: `${client.user.displayAvatarURL({ dynamic: true })}`,
                            name: 'Inertia Lighting | Products Manager',
                        },
                        description: `${action_to_perform === 'give' ? 'Gave' : 'Took'} ${db_roblox_product.code} ${action_to_perform === 'give' ? 'to' : 'from'} ${user_to_modify}!`,
                    }),
                ],
            });
        }
    },
};
