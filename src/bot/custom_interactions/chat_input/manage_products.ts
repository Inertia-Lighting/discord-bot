//------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
//------------------------------------------------------------//

import * as Discord from 'discord.js';

import { compareTwoStrings } from 'string-similarity';

import { DbProductData, DbUserData } from '@root/types/types';

import { go_mongo_db } from '@root/mongo/mongo';

import { CustomEmbed } from '@root/bot/common/message';

import { CustomInteraction, CustomInteractionAccessLevel } from '@root/bot/common/managers/custom_interactions_manager';

//------------------------------------------------------------//

const db_database_name = `${process.env.MONGO_DATABASE_NAME ?? ''}`;
if (db_database_name.length < 1) throw new Error('Environment variable: MONGO_DATABASE_NAME; is not set correctly.');

const db_products_collection_name = `${process.env.MONGO_PRODUCTS_COLLECTION_NAME ?? ''}`;
if (db_products_collection_name.length < 1) throw new Error('Environment variable: MONGO_PRODUCTS_COLLECTION_NAME; is not set correctly.');

const db_users_collection_name = `${process.env.MONGO_USERS_COLLECTION_NAME ?? ''}`;
if (db_users_collection_name.length < 1) throw new Error('Environment variable: MONGO_USERS_COLLECTION_NAME; is not set correctly.');

const db_support_staff_role_id = `${process.env.BOT_SUPPORT_STAFF_DATABASE_ROLE_ID ?? ''}`;
if (db_support_staff_role_id.length < 1) throw new Error('Environment variable: BOT_SUPPORT_STAFF_DATABASE_ROLE_ID; is not set correctly.');

//------------------------------------------------------------//

async function manageProductsAutoCompleteHandler(
    interaction: Discord.AutocompleteInteraction,
): Promise<void> {
    const db_roblox_products = await go_mongo_db.find(db_database_name, db_products_collection_name, {}) as unknown[] as DbProductData[];

    const user_id_to_modify = interaction.options.get('for')?.value; // required to be like this because of weird discord.js bug
    const action_to_perform = interaction.options.getString('action');

    const focused_option = interaction.options.getFocused();
    const search_query = focused_option.toUpperCase();

    /* find the user in the database */
    const [ db_user_data ] = (await go_mongo_db.find(db_database_name, db_users_collection_name, {
        'identity.discord_user_id': user_id_to_modify,
    }, {
        projection: {
            '_id': false,
        },
    })) as unknown[] as DbUserData[];

    if (!db_user_data) {
        return interaction.respond([]);
    }

    const filtered_db_roblox_products = db_roblox_products.filter(db_roblox_product => {
        const user_owns_product = Boolean(db_user_data.products[db_roblox_product.code]);

        return (
            (action_to_perform === 'add' && !user_owns_product) ||
            (action_to_perform === 'remove' && user_owns_product)
        );
    });

    const mapped_db_roblox_products = [];
    for (const db_roblox_product of filtered_db_roblox_products) {
        mapped_db_roblox_products.push({
            ...db_roblox_product,
            similarity_score: compareTwoStrings(search_query, db_roblox_product.code),
        });
    }

    const matching_db_roblox_products = mapped_db_roblox_products.sort(
        (a, b) => b.similarity_score - a.similarity_score
    ).sort(
        (a, b) => {
            const first_char_of_query: string = search_query.at(0)!;

            if (a.code.startsWith(first_char_of_query) === b.code.startsWith(first_char_of_query)) return a.code.localeCompare(b.code);
            if (a.code.startsWith(first_char_of_query)) return -1;
            if (b.code.startsWith(first_char_of_query)) return 1;

            return 0;
        }
    ).filter(
        ({ similarity_score, code }, index) => search_query.length > 0 ? (
            similarity_score >= 0.25 || (similarity_score < 0.25 && index < 10)
        ) : true
    );

    if (matching_db_roblox_products.length === 0) {
        return interaction.respond([]);
    }

    interaction.respond(
        matching_db_roblox_products.slice(0, 5).map(db_roblox_product => ({
            name: db_roblox_product.code,
            value: db_roblox_product.code,
        }))
    );
}

async function manageProductsChatInputCommandHandler(
    interaction: Discord.ChatInputCommandInteraction,
): Promise<void> {
    await interaction.deferReply({ ephemeral: false });

    const db_roblox_products = await go_mongo_db.find(db_database_name, db_products_collection_name, {}) as unknown[] as DbProductData[];

    const interaction_guild_member = await interaction.guild!.members.fetch(interaction.user.id);

    /* check if the user is allowed to use this command */
    if (!interaction_guild_member.roles.cache.has(db_support_staff_role_id)) {
        interaction.editReply({
            embeds: [
                CustomEmbed.from({
                    color: CustomEmbed.colors.VIOLET,
                    title: 'Inertia Lighting | Products Manager',
                    description: 'You aren\'t allowed to use this command!',
                }),
            ],
        }).catch(console.warn);

        return;
    }

    const user_to_modify = interaction.options.getUser('for', true);
    const action_to_perform = interaction.options.getString('action', true);
    const product_code = interaction.options.getString('product_code', true);
    const reason = interaction.options.getString('reason', true);

    /* find the user in the database */
    const [ db_user_data ] = await go_mongo_db.find(process.env.MONGO_DATABASE_NAME as string, process.env.MONGO_USERS_COLLECTION_NAME as string, {
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
                CustomEmbed.from({
                    color: CustomEmbed.colors.YELLOW,
                    title: 'Inertia Lighting | Products Manager',
                    description: `${user_to_modify} does not exist in the database!`,
                }),
            ],
        }).catch(console.warn);

        return;
    }

    const db_roblox_product = db_roblox_products.find(db_roblox_product => db_roblox_product.code === product_code);
    if (!db_roblox_product) {
        interaction.followUp({
            embeds: [
                CustomEmbed.from({
                    color: CustomEmbed.colors.YELLOW,
                    title: 'Inertia Lighting | Products Manager',
                    description: `\`${product_code}\` is not a valid product code!`,
                }),
            ],
        }).catch(console.warn);

        return;
    }

    try {
        await go_mongo_db.update(process.env.MONGO_DATABASE_NAME as string, process.env.MONGO_USERS_COLLECTION_NAME as string, {
            'identity.discord_user_id': db_user_data.identity.discord_user_id,
            'identity.roblox_user_id': db_user_data.identity.roblox_user_id,
        }, {
            $set: {
                [`products.${db_roblox_product.code}`]: (action_to_perform === 'add' ? true : false),
            },
        });
    } catch (error) {
        console.trace(error);

        interaction.editReply({
            embeds: [
                CustomEmbed.from({
                    color: CustomEmbed.colors.RED,
                    title: 'Inertia Lighting | Products Manager',
                    description: 'An error occurred while modifying the user\'s products!',
                }),
            ],
        }).catch(console.warn);

        return;
    }

    const logging_channel = (await interaction.guild!.channels.fetch(process.env.BOT_LOGGING_PRODUCTS_MANAGER_CHANNEL_ID as string)) as Discord.TextBasedChannel;
    logging_channel.send({
        embeds: [
            CustomEmbed.from({
                color: action_to_perform === 'add' ? CustomEmbed.colors.GREEN : CustomEmbed.colors.RED,
                title: 'Inertia Lighting | Products Manager',
                description: `${interaction.user} ${action_to_perform === 'add' ? 'added' : 'removed'} \`${db_roblox_product.code}\` ${action_to_perform === 'add' ? 'to' : 'from'} ${user_to_modify}.`,
                fields: [
                    {
                        name: 'Reason',
                        value: `${reason}`,
                    },
                ],
            }),
        ],
    }).catch(console.warn);

    await interaction.editReply({
        embeds: [
            CustomEmbed.from({
                color: action_to_perform === 'add' ? CustomEmbed.colors.GREEN : CustomEmbed.colors.RED,
                title: 'Inertia Lighting | Products Manager',
                description: `${action_to_perform === 'add' ? 'Added' : 'Removed'} \`${db_roblox_product.code}\` ${action_to_perform === 'add' ? 'to' : 'from'} ${user_to_modify}.`,
                fields: [
                    {
                        name: 'Reason',
                        value: `${reason}`,
                    },
                ],
            }),
        ],
    }).catch(console.warn);
}

//------------------------------------------------------------//

export default new CustomInteraction({
    identifier: 'manage_products',
    type: Discord.InteractionType.ApplicationCommand,
    data: {
        type: Discord.ApplicationCommandType.ChatInput,
        description: 'Used by staff to manage products.',
        options: [
            {
                name: 'for',
                type: Discord.ApplicationCommandOptionType.User,
                description: 'The member who you want to manage products for.',
                required: true,
            }, {
                name: 'action',
                type: Discord.ApplicationCommandOptionType.String,
                description: 'The action you want to perform.',
                choices: [
                    {
                        name: 'Add',
                        value: 'add',
                    }, {
                        name: 'Remove',
                        value: 'remove',
                    },
                ],
                required: true,
            }, {
                name: 'product_code',
                type: Discord.ApplicationCommandOptionType.String,
                description: 'The product code to manage.',
                autocomplete: true,
                required: true,
            },
        ],
    },
    metadata: {
        required_access_level: CustomInteractionAccessLevel.TeamLeaders,
    },
    handler: async (discord_client, interaction) => {
        if (!interaction.inCachedGuild()) return;

        if (interaction.isAutocomplete()) {
            await manageProductsAutoCompleteHandler(interaction);
        } else if (interaction.isChatInputCommand()) {
            await manageProductsChatInputCommandHandler(interaction);
        }
    },
});
