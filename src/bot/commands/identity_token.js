/* Copyright © Inertia Lighting | All Rights Reserved */

//---------------------------------------------------------------------------------------------------------------//

'use strict';

//---------------------------------------------------------------------------------------------------------------//

const bcrypt = require('bcryptjs');
const { v4: uuid_v4 } = require('uuid');

//---------------------------------------------------------------------------------------------------------------//

const { go_mongo_db } = require('../../mongo/mongo.js');
const { Discord, client } = require('../discord_client.js');

//---------------------------------------------------------------------------------------------------------------//

const identity_token_channel_id = process.env.BOT_IDENTITY_TOKEN_CHANNEL_ID;

//---------------------------------------------------------------------------------------------------------------//

async function generateUserAPIToken() {
    const non_encrypted_token = uuid_v4();
    const encrypted_token = bcrypt.hashSync(non_encrypted_token, bcrypt.genSaltSync(parseInt(process.env.USER_API_TOKEN_BCRYPT_SALT_LENGTH)));
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
    permission_level: 'staff',
    cooldown: 60_000,
    async execute(message, args) {
        const { command_prefix, command_name, command_args } = args;

        const [ db_user_data ] = await go_mongo_db.find(process.env.MONGO_DATABASE_NAME, process.env.MONGO_USERS_COLLECTION_NAME, {
            'identity.discord_user_id': message.author.id,
        });

        if (!db_user_data) {
            await message.reply(`Please \`${command_prefix}verify\` before using this command!`).catch(console.warn);
            return; // don't continue if they don't exist in the database
        }

        switch (`${command_args[0]}`.toLowerCase()) {
            case 'help':
                message.channel.send({
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
                                    value: `Check out <#${identity_token_channel_id}> for instructions on how to use identity tokens!`,
                             },
                            ],
                        }),
                    ],
                }).catch(console.warn);
                break;
            case 'generate':
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
                                    'The following token must be kept private and must be used in games with our products:',
                                    `||${non_encrypted_token}||`,
                                    '(click the box above to view your token)',
                                ].join('\n'),
                            }),
                        ],
                    });
                } catch {
                    await message.reply('I was unable to DM you!').catch(console.warn);
                    return; // don't continue if the user can't be messaged via DMs
                }

                await message.reply('I sent you your Identity Token via DMs!').catch(console.warn);

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
                    message.reply('Something went wrong while updating your Identity Token in the database, please contact staff!').catch(console.warn);
                }

                break;
            default:
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
    },
};
