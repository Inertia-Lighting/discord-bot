// ------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
// ------------------------------------------------------------//

import * as Discord from 'discord.js';
import got from 'got';

import { CustomInteraction, CustomInteractionAccessLevel, CustomInteractionRunContext } from '@/common/managers/custom_interactions_manager.js'
;
import { CustomEmbed } from '@/common/message.js'
;
import { v3VerificationFetch } from '@/types/index.js'
;

// ------------------------------------------------------------//

const user_verification_endpoints_base64_encoded_token = `${process.env.API_BASE64_ENCODED_TOKEN_FOR_USER_VERIFICATION_ENDPOINTS ?? ''}`;
if (user_verification_endpoints_base64_encoded_token.length < 1) throw new Error('Environment variable: API_BASE64_ENCODED_TOKEN_FOR_USER_VERIFICATION_ENDPOINTS; is not set correctly.');

const api_server = `${process.env.API_SERVER ?? ''}`;
if (api_server.length < 1) throw new Error('Environment variable: API_SERVER; is not set correctly.');

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

    const fetch_pending_verification_response = await got.post(`https://${api_server}/v3/user/verification/context/fetch`,
        {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `InertiaAuthUserVerificationEndpoints ${user_verification_endpoints_base64_encoded_token}`,
            },
            json: {
                verification_code: sanitized_verification_code
            },
        }
    ).json<v3VerificationFetch>().catch(async (err) => {
        console.warn(err)
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
    })

    if (!fetch_pending_verification_response) {
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

    // Ensure the fetched context actually contains a verification code we can submit.
    const maybe_verification_code = (fetch_pending_verification_response as unknown as { verification_code?: unknown }).verification_code;

    if (typeof maybe_verification_code !== 'string' || maybe_verification_code.trim().length === 0) {
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

    // Extract a properly-typed local verification code string for submission.
    const submission_verification_code: string = maybe_verification_code.trim();

    try {
        // Use `got` to submit the verification context. We expect a 200 status for success.
        await got.post(`https://${api_server}/v3/user/verification/context/submit`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `InertiaAuthUserVerificationEndpoints ${user_verification_endpoints_base64_encoded_token}`,
            },
            json: {
                verification_code: submission_verification_code,
                discordId: interaction.user.id,
            },
            throwHttpErrors: false,
        }).then((res) => {
            if (res.statusCode !== 200) throw new Error(`Unexpected status code: ${res.statusCode}`);
        });
    } catch (error) {
        console.error('verifyHandler(): error while updating and/or submitting verification context', error);

        // Try to extract useful debug information from got's error shape, if present.
        let debugInfo: string | undefined;
        try {
            // got may throw an HTTPError with a `response` containing `body`.
            const unknownErr = error as unknown;
            if (typeof unknownErr === 'object' && unknownErr !== null) {
                const maybeResponse = (unknownErr as { response?: { body?: unknown } }).response;
                if (maybeResponse && maybeResponse.body) debugInfo = String(maybeResponse.body);
                else if ((unknownErr as { message?: unknown }).message) debugInfo = String((unknownErr as { message?: unknown }).message);
            }
        } catch {
            // ignore extraction errors
        }

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
                        ...(debugInfo ? [
                            '',
                            'Debug Information:',
                            `\`\`\`js\n${debugInfo}\n\`\`\``,
                        ] : []),
                    ].join('\n'),
                }),
            ],
        }).catch(console.warn);

        return;
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

        const request = await got.post(`https://${api_server}/v3/user/identity/fetch`, {
            json: {
                discordId: interaction.user.id,
            },
            throwHttpErrors: false,
        }).catch((err) => { console.error(err); return undefined; });

        // got returns a Response with statusCode; normalize to axios-like shape for the existing logic
        const normalizedRequest = request ? { status: request.statusCode, data: request.body } : undefined;

        if (normalizedRequest && normalizedRequest.status === 200) {
            await userAlreadyVerifiedHandler(interaction)
        }


        await verifyHandler(interaction);
    },
});
