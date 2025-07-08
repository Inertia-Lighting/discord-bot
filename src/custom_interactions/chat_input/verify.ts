// ------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
// ------------------------------------------------------------//

import { CustomInteraction, CustomInteractionAccessLevel, CustomInteractionRunContext } from '@root/common/managers/custom_interactions_manager';
import { CustomEmbed } from '@root/common/message';
import axios from 'axios';
import * as Discord from 'discord.js';

// ------------------------------------------------------------//

const db_database_name = `${process.env.MONGO_DATABASE_NAME ?? ''}`;
if (db_database_name.length < 1) throw new Error('Environment variable: MONGO_DATABASE_NAME; is not set correctly.');

const db_users_collection_name = `${process.env.MONGO_USERS_COLLECTION_NAME ?? ''}`;
if (db_users_collection_name.length < 1) throw new Error('Environment variable: MONGO_USERS_COLLECTION_NAME; is not set correctly.');

const user_verification_endpoints_base64_encoded_token = `${process.env.API_BASE64_ENCODED_TOKEN_FOR_USER_VERIFICATION_ENDPOINTS ?? ''}`;
if (user_verification_endpoints_base64_encoded_token.length < 1) throw new Error('Environment variable: API_BASE64_ENCODED_TOKEN_FOR_USER_VERIFICATION_ENDPOINTS; is not set correctly.');

const api_server = `${process.env.API_SERVER ?? ''}`;
if (api_server.length < 1) throw new Error('Environment variable: API_SERVER; is not set correctly.');

const verified_role_id = `${process.env.BOT_VERIFIED_ROLE_ID ?? ''}`;
if (verified_role_id.length < 1) throw new Error('Environment variable: BOT_VERIFIED_ROLE_ID; is not set correctly.');

// ------------------------------------------------------------//

async function userAlreadyVerifiedHandler(
    interaction: Discord.ChatInputCommandInteraction,
): Promise<void> {
    await interaction.editReply({
        embeds: [
            CustomEmbed.from({
                color: CustomEmbed.Color.Yellow,
                author: {
                    icon_url: `${interaction.client.user.displayAvatarURL({ forceStatic: false })}`,
                    name: `${interaction.client.user.username} | Verification System`,
                },
                title: 'You are already verified!',
                description: [
                    `${interaction.user} is already verified and linked in our database!`,
                    '',
                    'Click the "Your User Profile" button below to view your profile!',
                    'To modify your linked accounts, please open an "Account Recovery" support ticket.',
                ].join('\n'),
            }),
        ],
        components: [
            {
                type: Discord.ComponentType.ActionRow,
                components: [
                    {
                        type: Discord.ComponentType.Button,
                        style: Discord.ButtonStyle.Secondary,
                        customId: 'verify_command_user_profile_button', // handled by `custom_interactions/button/verify_command_user_profile.ts`
                        label: 'Your User Profile',
                    },
                ],
            },
        ],
    }).catch(console.warn);
}

async function verifyHandler(
    interaction: Discord.ChatInputCommandInteraction,
): Promise<void> {
    const verification_code = interaction.options.getString('code', true);

    // Remove all whitespace from the verification code and trim it down.
    // This is to sanitize the input and allow it to work with our Api Server.
    const sanitized_verification_code = verification_code.replace(/\s+/gi, '').trim();

    let fetch_pending_verification_response;
    try {
        fetch_pending_verification_response = await axios({
            method: 'post',
            url: `https://${api_server}/v3/user/verification/context/fetch`,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `InertiaAuthUserVerificationEndpoints ${user_verification_endpoints_base64_encoded_token}`,
            },
            data: {
                verification_code: sanitized_verification_code,
            },
            validateStatus: (status) => [200, 404].includes(status),
        });
    } catch (error) {
        console.error(error);

        await interaction.editReply({
            embeds: [
                CustomEmbed.from({
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
        await interaction.editReply({
            embeds: [
                CustomEmbed.from({
                    color: CustomEmbed.Color.Yellow,
                    author: {
                        icon_url: `${interaction.client.user.displayAvatarURL({ forceStatic: false })}`,
                        name: `${interaction.client.user.username} | Verification System`,
                    },
                    title: 'Unknown Verification Code',
                    description: [
                        'That verification code was not recognized!',
                        'Please check your code and try again.',
                        '',
                        'If you need a verification code, visit our product hub.',
                    ].join('\n'),
                }),
            ],
            components: [
                {
                    type: Discord.ComponentType.ActionRow,
                    components: [
                        {
                            type: Discord.ComponentType.Button,
                            style: Discord.ButtonStyle.Link,
                            label: 'Product Hub',
                            url: 'https://product-hub.inertia.lighting/',
                        },
                    ],
                },
            ],
        }).catch(console.warn);

        return;
    }

    try {
        await axios({
            method: 'post',
            url: `https://${api_server}/v3/user/verification/context/submit`,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `InertiaAuthUserVerificationEndpoints ${user_verification_endpoints_base64_encoded_token}`,
            },
            data: {
                verification_code: fetch_pending_verification_response.data.verification_code,
                discordId: interaction.user.id,
            },
            validateStatus: (status) => status === 200,
        });
    } catch (error) {
        console.error('verifyHandler(): error while updating and/or submitting verification context', error);

        await interaction.editReply({
            embeds: [
                CustomEmbed.from({
                    color: CustomEmbed.Color.Red,
                    author: {
                        icon_url: `${interaction.client.user.displayAvatarURL({ forceStatic: false })}`,
                        name: `${interaction.client.user.username} | Verification System`,
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

    /* assign verified role to the user */
    try {
        const guild_member = await interaction.guild!.members.fetch(interaction.user.id);
        await guild_member.roles.add(verified_role_id);
        console.log(`Successfully assigned verified role to user: ${interaction.user.id}`);
    } catch (error) {
        console.error('Failed to assign verified role:', error);
        // Continue with verification success message even if role assignment fails
    }

    /* inform the user */
    await interaction.editReply({
        embeds: [
            CustomEmbed.from({
                color: CustomEmbed.Color.Green,
                author: {
                    icon_url: `${interaction.client.user.displayAvatarURL({ forceStatic: false })}`,
                    name: `${interaction.client.user.username} | Verification System`,
                },
                title: 'You have successfully verified!',
                description: [
                    'You can now return to the Product Hub to continue.',
                    '',
                    'Make sure to stay in our Discord server after making a purchase.',
                    'Our license system requires you to be in our Discord server.',
                ].join('\n'),
            }),
        ],
    }).catch(console.warn);
}

// ------------------------------------------------------------//

export default new CustomInteraction({
    identifier: 'verify',
    type: Discord.InteractionType.ApplicationCommand,
    data: {
        type: Discord.ApplicationCommandType.ChatInput,
        description: 'Verify your account with a code provided by our services.',
        options: [
            {
                name: 'code',
                type: Discord.ApplicationCommandOptionType.String,
                description: 'The verification code.',
                minLength: 1,
                maxLength: 32, // just-in-case the user does something unexpected
                required: true,
            },
        ],
    },
    metadata: {
        required_run_context: CustomInteractionRunContext.Guild,
        required_access_level: CustomInteractionAccessLevel.Public,
    },
    handler: async (discord_client, interaction) => {
        if (!interaction.isChatInputCommand()) return;
        if (!interaction.inCachedGuild()) return;
        if (!interaction.channel) return;

        await interaction.deferReply({ flags: ['Ephemeral'] });

        const request = await axios.post(`https://${api_server}/v3/user/identity/fetch`, {
            discordId: interaction.user.id
        },
            {
                validateStatus: (status) => [200, 404].includes(status),
            }).catch((err) => { console.error(err) })

        if (request && request.status === 200) {
            await userAlreadyVerifiedHandler(interaction)
        }


        await verifyHandler(interaction);
    },
});
