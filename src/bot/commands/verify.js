/* Copyright © Inertia Lighting | All Rights Reserved */

//---------------------------------------------------------------------------------------------------------------//

'use strict';

//---------------------------------------------------------------------------------------------------------------//

const { default: axios } = require('axios');

const { go_mongo_db } = require('../../mongo/mongo.js');

const { Discord, client } = require('../discord_client.js');

const { command_permission_levels } = require('../common/bot.js');
const { disableMessageComponents } = require('../common/message.js');

const { userProfileHandler } = require('../handlers/user_profile_handler.js');

//---------------------------------------------------------------------------------------------------------------//

module.exports = {
    name: 'verify',
    description: 'verifies and adds a user to the database',
    usage: 'CODE_HERE',
    aliases: ['verify', 'link'],
    permission_level: command_permission_levels.PUBLIC,
    cooldown: 5_000,
    /**
     * @param {Discord.Message} message
     * @param {Object.<string, any>} args
     */
    async execute(message, args) {
        const { command_prefix, command_args } = args;

        const [ db_user_data ] = await go_mongo_db.find(process.env.MONGO_DATABASE_NAME, process.env.MONGO_USERS_COLLECTION_NAME, {
            'identity.discord_user_id': message.author.id,
        }, {
            projection: {
                '_id': false,
            },
        });
        if (db_user_data) {
            /** @type {Discord.Message} */
            const bot_msg = await message.channel.send({
                embeds: [
                    new Discord.MessageEmbed({
                        color: 0xFFFF00,
                        author: {
                            iconURL: `${client.user.displayAvatarURL({ dynamic: true })}`,
                            name: `${client.user.username} | Verification System`,
                        },
                        title: 'You are already verified!',
                        description: [
                            `${message.author} is already verified and linked in our database!`,
                            'Click the \"Your User Profile\" button below to view your profile!',
                            'To modify your linked accounts, please open an \"Account Recovery\" support ticket.',
                        ].join('\n'),
                    }),
                ],
                components: [
                    {
                        type: 1,
                        components: [
                            {
                                type: 2,
                                style: 2,
                                custom_id: 'verify_command_user_profile_button',
                                label: 'Your User Profile',
                            },
                        ],
                    },
                ],
            });

            const message_component_collector = await message.channel.createMessageComponentCollector();
            message_component_collector.on('collect', async (message_component) => {
                switch (message_component.customId) {
                    case 'verify_command_user_profile_button': {
                        if (!message_component.isButton()) return;

                        if (message_component.user.id !== message.author.id) {
                            await message_component.reply({
                                ephemeral: true,
                                embeds: [
                                    new Discord.MessageEmbed({
                                        color: 0xFFFF00,
                                        description: 'That button is not for you!',
                                    }),
                                ],
                            }).catch(console.warn);
                            return;
                        }

                        await message_component.deferReply({ ephemeral: true });

                        await disableMessageComponents(bot_msg).catch(console.warn);

                        userProfileHandler(message_component, message.author.id);

                        break;
                    }

                    default: {
                        return; // keep the message_component_collector running
                    }
                }

                message_component_collector.stop();
            });

            message_component_collector.on('end', () => {
                disableMessageComponents(bot_msg);
            });

            return; // don't allow the user to verify if they're already verified
        }

        const verification_code_to_lookup = `${command_args[0]}`.trim();

        const fetch_pending_verification_response = await axios({
            method: 'post',
            url: 'https://api.inertia.lighting/v2/user/verification/context/fetch',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `InertiaAuthUserVerificationEndpoints ${process.env.API_BASE64_ENCODED_TOKEN_FOR_USER_VERIFICATION_ENDPOINTS}`,
            },
            data: {
                verification_code: verification_code_to_lookup,
            },
        }).catch(error => {
            console.warn(error);

            return error;
        });

        if (fetch_pending_verification_response.status !== 200 || !fetch_pending_verification_response.data) {
            await message.channel.send({
                embeds: [
                    new Discord.MessageEmbed({
                        color: 0xFFFF00,
                        author: {
                            iconURL: `${client.user.displayAvatarURL({ dynamic: true })}`,
                            name: `${client.user.username} | Verification System`,
                        },
                        title: 'Invalid verification code!',
                        description: [
                            'This command is used to verify your roblox account in our database.',
                            '',
                            'You need to use the verification code given to you by our Product Hub!',
                            `Example: \`${command_prefix}verify CODE_HERE\``,
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
                                label: 'Product Hub',
                                url: 'https://product-hub.inertia.lighting/',
                            },
                        ],
                    },
                ],
            }).catch(console.warn);

            return;
        }

        const update_pending_verification_response = await axios({
            method: 'post',
            url: 'https://api.inertia.lighting/v2/user/verification/context/update',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `InertiaAuthUserVerificationEndpoints ${process.env.API_BASE64_ENCODED_TOKEN_FOR_USER_VERIFICATION_ENDPOINTS}`,
            },
            data: {
                verification_code: fetch_pending_verification_response.data.verification_code,
                discord_user_id: message.author.id,
            },
        }).catch(error => {
            console.warn(error);

            return error;
        });

        if (update_pending_verification_response.status !== 200 || !update_pending_verification_response.data) {
            await message.channel.send({
                embeds: [
                    new Discord.MessageEmbed({
                        color: 0xFFFF00,
                        author: {
                            iconURL: `${client.user.displayAvatarURL({ dynamic: true })}`,
                            name: `${client.user.username} | Verification System`,
                        },
                        title: 'Failed to verify!',
                        description: [
                            'Something went wrong while verifying your account!',
                            '',
                            'Debug Information:',
                            `roblox_user_id (${fetch_pending_verification_response.data.roblox_user_id}) already exists in the database!`,
                        ].join('\n'),
                    }),
                ],
            }).catch(console.warn);

            return;
        }

        /* inform the user */
        await message.channel.send({
            embeds: [
                new Discord.MessageEmbed({
                    color: 0x00FF00,
                    author: {
                        iconURL: `${client.user.displayAvatarURL({ dynamic: true })}`,
                        name: `${client.user.username} | Verification System`,
                    },
                    title: 'You have successfully verified!',
                    description: [
                        'Go back to the Product Hub to continue.',
                        '',
                        'Make sure to stay in our Discord server after making a purchase.',
                        'Our whitelist requires you to be in our Discord server for it to work.',
                    ].join('\n'),
                }),
            ],
        }).catch(console.warn);
    },
};
