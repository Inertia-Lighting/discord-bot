//------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
//------------------------------------------------------------//

//---------------------------------------------------------------------------------------------------------------//

import axios from 'axios';

import { go_mongo_db } from '../../mongo/mongo';

import { Discord, client } from '../discord_client';

import { command_permission_levels } from '../common/bot';

import { disableMessageComponents } from '../common/message';

import { userProfileHandler } from '../handlers/user_profile_handler';

//---------------------------------------------------------------------------------------------------------------//

export default {
    name: 'verify',
    description: 'verifies and adds a user to the database',
    usage: 'CODE_HERE',
    aliases: ['verify', 'link'],
    permission_level: command_permission_levels.PUBLIC,
    cooldown: 1_500,
    async execute(
        message: Discord.Message<true>,
        args: {
            [key: string]: unknown;
            command_args: string[];
        },
    ) {
        const { command_args } = args;

        const [ db_user_data ] = await go_mongo_db.find(process.env.MONGO_DATABASE_NAME as string, process.env.MONGO_USERS_COLLECTION_NAME as string, {
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
                            iconURL: `${client.user!.displayAvatarURL({ dynamic: true })}`,
                            name: `${client.user!.username} | Verification System`,
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

                        await message_component.deferReply({ ephemeral: true });

                        if (message_component.user.id !== message.author.id) {
                            await message_component.followUp({
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

        const verification_code_to_lookup = `${command_args[0]}`.replace(/\s+/gi, '').trim();

        if (verification_code_to_lookup.length === 0) {
            await message.channel.send({
                embeds: [
                    new Discord.MessageEmbed({
                        color: 0xFFFF00,
                        title: 'Missing Verification Code',
                        description: 'You need to provide a verification code to verify!',
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

        let fetch_pending_verification_response;
        try {
            fetch_pending_verification_response = await axios({
                method: 'post',
                url: 'https://api.inertia.lighting/v2/user/verification/context/fetch',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `InertiaAuthUserVerificationEndpoints ${process.env.API_BASE64_ENCODED_TOKEN_FOR_USER_VERIFICATION_ENDPOINTS}`,
                },
                data: {
                    verification_code: verification_code_to_lookup,
                },
                validateStatus: (status) => [ 200, 404 ].includes(status),
            });
        } catch (error) {
            console.error(error);

            await message.channel.send({
                embeds: [
                    new Discord.MessageEmbed({
                        color: 0xFFFF00,
                        description: [
                            'There was an error while verifying your account.',
                            'Please contact our support staff for assistance!',
                        ].join('\n'),
                    }),
                ],
            }).catch(console.warn);

            return;
        }

        if (fetch_pending_verification_response.status === 404) {
            await message.channel.send({
                embeds: [
                    new Discord.MessageEmbed({
                        color: 0xFFFF00,
                        author: {
                            iconURL: `${client.user!.displayAvatarURL({ dynamic: true })}`,
                            name: `${client.user!.username} | Verification System`,
                        },
                        title: 'Unknown Verification Code',
                        description: [
                            'That verification code was not recognized!',
                        ].join('\n'),
                    }),
                ],
            }).catch(console.warn);

            return;
        }

        try {
            await axios({
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
                validateStatus: (status) => status === 200,
            });

            await axios({
                method: 'post',
                url: 'https://api.inertia.lighting/v2/user/verification/context/submit',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `InertiaAuthUserVerificationEndpoints ${process.env.API_BASE64_ENCODED_TOKEN_FOR_USER_VERIFICATION_ENDPOINTS}`,
                },
                data: {
                    verification_code: fetch_pending_verification_response.data.verification_code,
                },
                validateStatus: (status) => status === 200,
            });
        } catch (error) {
            console.error(error);

            await message.channel.send({
                embeds: [
                    new Discord.MessageEmbed({
                        color: 0xFFFF00,
                        author: {
                            iconURL: `${client.user!.displayAvatarURL({ dynamic: true })}`,
                            name: `${client.user!.username} | Verification System`,
                        },
                        title: 'Failed to verify!',
                        description: [
                            'Something went wrong while verifying your account!',
                            ...(axios.isAxiosError(error) ? [
                                '',
                                'Debug Information:',
                                `\`\`\`js\n${error.response?.data ?? 'Unknown error, please contact support!'}\n\`\`\``,
                            ] : []),
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
                        iconURL: `${client.user!.displayAvatarURL({ dynamic: true })}`,
                        name: `${client.user!.username} | Verification System`,
                    },
                    title: 'You have successfully verified!',
                    description: [
                        'You can now return to the Product Hub to continue.',
                        '',
                        'Make sure to stay in our Discord server after making a purchase.',
                        'Our whitelist requires you to be in our Discord server.',
                    ].join('\n'),
                }),
            ],
        }).catch(console.warn);
    },
};
