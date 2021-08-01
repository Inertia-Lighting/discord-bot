/* Copyright © Inertia Lighting | All Rights Reserved */

//---------------------------------------------------------------------------------------------------------------//

'use strict';

//---------------------------------------------------------------------------------------------------------------//

const bcrypt = require('bcryptjs');
const { v4: uuid_v4 } = require('uuid');

//---------------------------------------------------------------------------------------------------------------//

const { go_mongo_db } = require('../../mongo/mongo.js');

const { Discord, client } = require('../discord_client.js');

const { command_permission_levels } = require('../common/bot.js');

//---------------------------------------------------------------------------------------------------------------//

async function generateUserAPIToken() {
    const non_encrypted_token = uuid_v4();
    const user_api_token_bcrypt_salt_length = Number.parseInt(process.env.USER_API_TOKEN_BCRYPT_SALT_LENGTH);

    if (Number.isNaN(user_api_token_bcrypt_salt_length)) throw new Error('Invalid \`USER_API_TOKEN_BCRYPT_SALT_LENGTH\` environment variable.');

    const encrypted_token = bcrypt.hashSync(non_encrypted_token, bcrypt.genSaltSync(user_api_token_bcrypt_salt_length));

    return {
        non_encrypted_token,
        encrypted_token,
    };
}

//---------------------------------------------------------------------------------------------------------------//

module.exports = {
    name: 'identity_token',
    description: 'n/a',
    aliases: ['identity_token'],
    permission_level: command_permission_levels.PUBLIC,
    cooldown: 60_000,
    async execute(message, args) {
        const { command_prefix, command_name, command_args } = args;

        const [ db_user_data ] = await go_mongo_db.find(process.env.MONGO_DATABASE_NAME, process.env.MONGO_USERS_COLLECTION_NAME, {
            'identity.discord_user_id': message.author.id,
        });

        if (!db_user_data) {
            await message.reply({
                content: `Please \`${command_prefix}verify\` before using this command!`,
            }).catch(console.warn);
            return; // don't continue if user doesn't exist in the database
        }

        switch (`${command_args[0]}`.toLowerCase()) {
            case 'help': {
                await message.channel.send({
                    embeds: [
                        new Discord.MessageEmbed({
                            color: 0x60A0FF,
                            author: {
                                iconURL: `${client.user.displayAvatarURL({ dynamic: true })}`,
                                name: 'Inertia Lighting | Identity Token System',
                            },
                            fields: [
                                {
                                    name: 'What are Identity Tokens?',
                                    value: 'Identity Tokens are like passwords, we use them to verify your identity with our systems; just like how your computer uses a password to verify that it is you!',
                                }, {
                                    name: 'How do I generate my Identity Token?',
                                    value: `Run \`${command_prefix}${command_name} generate\` to generate your token!`,
                                }, {
                                    name: 'How do I use my Identity Token?',
                                    value: `When running the \`${command_prefix}${command_name} generate\` command, you will be given an Identity Token Code Snippet to paste into your Roblox Studio Command Bar.`,
                                },
                            ],
                        }),
                    ],
                }).catch(console.warn);

                break;
            }
            case 'generate': {
                const { non_encrypted_token, encrypted_token } = await generateUserAPIToken();

                try {
                    const dm_channel = await message.author.createDM();
                    await dm_channel.send({
                        embeds: [
                            new Discord.MessageEmbed({
                                color: 0x60A0FF,
                                author: {
                                    iconURL: `${client.user.displayAvatarURL({ dynamic: true })}`,
                                    name: 'Inertia Lighting | Identity Token System',
                                },
                                description: [
                                    '**Instructions:**',
                                    '1) Keep your Identity Token secret, it is unique to you (like a password).',
                                    '2) Paste your Identity Token Code Snippet into Roblox Studio\'s Command Bar.',
                                    '3) Observe your Roblox Studio\'s Output.',
                                    '4) Assuming everything went correctly, you can now use our products inside of your game.',
                                    '',
                                    '**Your Identity Token Code Snippet:**',
                                    `||\`require(7096701514)('${non_encrypted_token}')\`||`,
                                    '(Click the box above to view your Identity Token Code Snippet)',
                                ].join('\n'),
                            }),
                        ],
                    });
                } catch {
                    await message.reply({
                        content: 'I was unable to send a direct message to you!',
                    }).catch(console.warn);
                    return; // don't continue if the user can't be direct messaged
                }

                await message.reply({
                    content: 'I sent you your Identity Token via DMs!',
                }).catch(console.warn);

                try {
                    await go_mongo_db.update(process.env.MONGO_DATABASE_NAME, process.env.MONGO_API_AUTH_USERS_COLLECTION_NAME, {
                        'identity.discord_user_id': db_user_data.identity.discord_user_id,
                    }, {
                        $set: {
                            'identity.roblox_user_id': db_user_data.identity.roblox_user_id,
                            'encrypted_api_token': encrypted_token,
                        },
                    }, {
                        upsert: true,
                    });
                } catch (error) {
                    console.trace(error);
                    await message.reply({
                        content: 'Something went wrong while updating your Identity Token in the database, please contact our support staff!',
                    }).catch(console.warn);
                }

                break;
            }
            default: {
                message.channel.send({
                    embeds: [
                        new Discord.MessageEmbed({
                            color: 0x60A0FF,
                            author: {
                                iconURL: `${client.user.displayAvatarURL({ dynamic: true })}`,
                                name: 'Inertia Lighting | Identity Token System',
                            },
                            description: [
                                'Please use one of the following sub-commands:',
                                '\`\`\`',
                                ...[
                                    'help',
                                    'generate',
                                ].map(sub_command => `${command_prefix}${command_name} ${sub_command}`),
                                '\`\`\`',
                            ].join('\n'),
                        }),
                    ],
                }).catch(console.warn);

                break;
            }
        }
    },
};
