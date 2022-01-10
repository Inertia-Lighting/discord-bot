/* Copyright © Inertia Lighting | All Rights Reserved */

//---------------------------------------------------------------------------------------------------------------//

'use strict';

//---------------------------------------------------------------------------------------------------------------//

const axios = require('axios');

const { Discord, client } = require('../discord_client.js');

const { go_mongo_db } = require('../../mongo/mongo.js');

//---------------------------------------------------------------------------------------------------------------//

/**
 * @param {Discord.GuildMember} member
 */
async function automaticVerificationHandler(member) {
    const [ db_user_data ] = await go_mongo_db.find(process.env.MONGO_DATABASE_NAME, process.env.MONGO_USERS_COLLECTION_NAME, {
        'identity.discord_user_id': member.id,
    });

    /* check if the user has already verified */
    if (db_user_data) {
        try {
            const dm_channel = await member.createDM();
            await dm_channel.send({
                embeds: [
                    new Discord.MessageEmbed({
                        color: 0x60A0FF,
                        author: {
                            iconURL: `${client.user.displayAvatarURL({ dynamic: true })}`,
                            name: 'Inertia Lighting | Verification System',
                        },
                        title: 'You are verified in our database!',
                        description: [
                            `Our records indicate that [this roblox account](https://www.roblox.com/users/${db_user_data.identity.roblox_user_id}/profile) is linked to ${member}.`,
                            '*If that doesn\'t look right to you, please open an \"Account Recovery\" support ticket in our server.*',
                        ].join('\n'),
                    }),
                ],
            });
        } catch {} // ignore any errors

        return; // don't continue if the user has already verified
    }

    /* store the collected roblox user ids */
    const unsanitized_potential_roblox_user_ids = [];

    /* attempt to find the roblox user id from bloxlink */
    const { data: bloxlink_response_data } = await axios.get(`https://api.blox.link/v1/user/${member.id}`).catch(() => ({ data: {} }));
    unsanitized_potential_roblox_user_ids.push(bloxlink_response_data?.primaryAccount || undefined);

    /* attempt to find the roblox user id from rover */
    const { data: rover_response_data } = await axios.get(`https://verify.eryn.io/api/user/${member.id}`).catch(() => ({ data: {} }));
    unsanitized_potential_roblox_user_ids.push(rover_response_data?.robloxId || undefined);

    /* sanitize the collected ids and remove any duplicates */
    const sanitized_potential_roblox_user_ids = new Set(unsanitized_potential_roblox_user_ids.filter(item => item !== undefined));

    /* don't continue if there aren't any ids */
    if (sanitized_potential_roblox_user_ids.size === 0) return;

    /* store the collected roblox users */
    const potential_roblox_users = [];

    /* fetch user data from roblox */
    for (const potential_roblox_user_id of sanitized_potential_roblox_user_ids.values()) {
        let roblox_response;
        try {
            roblox_response = await axios.get(`https://users.roblox.com/v1/users/${potential_roblox_user_id}`);
        } catch {
            continue; // proceed to the next roblox user id
        }

        const {
            id: roblox_user_id,
            name: roblox_username,
            displayName: roblox_display_name,
        } = roblox_response?.data ?? {};

        potential_roblox_users.push({
            id: roblox_user_id,
            username: roblox_username,
            display_name: roblox_display_name,
        });
    }

    /* direct message the user to choose an account */
    try {
        const dm_channel = await member.createDM();
        const account_selection_menu_message = await dm_channel.send({
            embeds: [
                new Discord.MessageEmbed({
                    color: 0x60A0FF,
                    author: {
                        iconURL: `${client.user.displayAvatarURL({ dynamic: true })}`,
                        name: 'Inertia Lighting | Verification System',
                    },
                    title: 'Please select an account bellow to automatically verify.',
                }),
            ],
            components: [
                {
                    type: 1,
                    components: [
                        {
                            type: 3,
                            custom_id: 'automatic_verification_selection_menu',
                            placeholder: 'Please select your roblox account from the dropdown menu.',
                            min_values: 1,
                            max_values: 1,
                            options: [
                                ...potential_roblox_users.map(({ id, username, display_name }) => ({
                                    label: `${display_name}`.slice(0, 100), // truncate for discord,
                                    description: `@${username} (${id})`.slice(0, 100), // truncate for discord
                                    value: `${id}`,
                                })), {
                                    label: 'My account is not listed.',
                                    description: 'Select this if the above options are not correct.',
                                    value: 'account_was_not_listed',
                                },
                            ],
                        },
                    ],
                },
            ],
        });

        const account_selection_menu_interaction_collector = await account_selection_menu_message.createMessageComponentCollector({
            filter: (interaction) => interaction.user.id === member.id,
            time: 30 * 60_000, // 30 minutes
        });

        account_selection_menu_interaction_collector.on('collect', async (account_selection_menu_interaction) => {
            await account_selection_menu_interaction.deferUpdate();

            const account_selection_menu_value = account_selection_menu_interaction.values[0];

            switch (account_selection_menu_value) {
                case 'account_was_not_listed': {
                    dm_channel.send({
                        embeds: [
                            new Discord.MessageEmbed({
                                color: 0xFFFF00,
                                author: {
                                    iconURL: `${client.user.displayAvatarURL({ dynamic: true })}`,
                                    name: 'Inertia Lighting | Verification System',
                                },
                                title: 'You need to manually verify in our product hub!',
                                description: 'Please go to our product hub to manually verify your account with us.',
                            }),
                        ],
                        components: [
                            {
                                type: 1,
                                components: [
                                    {
                                        type: 2,
                                        style: 5,
                                        label: 'Product Hub',
                                        url: 'https://product-hub.inertia.lighting/',
                                    },
                                ],
                            },
                        ],
                    }).catch(console.warn);

                    break;
                }

                default: {
                    const roblox_user_id = account_selection_menu_value;

                    const [ db_user_data ] = await go_mongo_db.find(process.env.MONGO_DATABASE_NAME, process.env.MONGO_USERS_COLLECTION_NAME, {
                        'identity.roblox_user_id': roblox_user_id,
                    });

                    /* don't continue if the user has already verified */
                    if (db_user_data) return;

                    const db_roblox_products = await go_mongo_db.find(process.env.MONGO_DATABASE_NAME, process.env.MONGO_PRODUCTS_COLLECTION_NAME, {});

                    const user_products = {};

                    for (const db_roblox_product of db_roblox_products) {
                        user_products[db_roblox_product.code] = false;
                    }

                    await go_mongo_db.update(process.env.MONGO_DATABASE_NAME, process.env.MONGO_USERS_COLLECTION_NAME, {
                        'identity.roblox_user_id': roblox_user_id,
                    }, {
                        $set: {
                            'identity.discord_user_id': member.id,
                            'products': user_products,
                        },
                    }, {
                        upsert: true,
                    });

                    dm_channel.send({
                        embeds: [
                            new Discord.MessageEmbed({
                                color: 0x00FF00,
                                author: {
                                    iconURL: `${client.user.displayAvatarURL({ dynamic: true })}`,
                                    name: 'Inertia Lighting | Verification System',
                                },
                                title: 'Automatic verification was successful!',
                                description: [
                                    'You have successfully completed the automatic verification process.',
                                    'While you\'re here, you should check out our website, products, and privacy policy.',
                                    '',
                                    'Thank you for choosing Inertia Lighting!',
                                ].join('\n'),
                            }),
                        ],
                        components: [
                            {
                                type: 1,
                                components: [
                                    {
                                        type: 2,
                                        style: 5,
                                        label: 'Products & Downloads',
                                        url: 'https://inertia.lighting/products',
                                    }, {
                                        type: 2,
                                        style: 5,
                                        label: 'Product Hub',
                                        url: 'https://product-hub.inertia.lighting/',
                                    }, {
                                        type: 2,
                                        style: 5,
                                        label: 'Privacy Policy',
                                        url: 'https://inertia.lighting/privacy',
                                    },
                                ],
                            },
                        ],
                    }).catch(console.warn);

                    break;
                }
            }

            account_selection_menu_interaction_collector.stop();
        });

        account_selection_menu_interaction_collector.on('end', async () => {
            await account_selection_menu_message.delete().catch(console.warn);
        });
    } catch (error) {
        console.warn(error);
        return; // unable to dm user
    }
}

module.exports = {
    automaticVerificationHandler,
};
