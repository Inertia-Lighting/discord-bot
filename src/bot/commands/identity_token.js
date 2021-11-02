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
    cooldown: 15_000,
    async execute(message, args) {
        const { command_prefix } = args;

        const [ db_user_data ] = await go_mongo_db.find(process.env.MONGO_DATABASE_NAME, process.env.MONGO_USERS_COLLECTION_NAME, {
            'identity.discord_user_id': message.author.id,
        });

        if (!db_user_data) {
            await message.reply({
                content: `Please \`${command_prefix}verify\` before using this command!`,
            }).catch(console.warn);

            return; // don't continue if user doesn't exist in the database
        }

        const bot_msg = await message.channel.send({
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
                            value: 'Click the **Generate New Identity Token** button below!',
                        }, {
                            name: 'How do I use my Identity Token?',
                            value: 'After clicking the button, check your DMs for further instructions.',
                        },
                    ],
                }),
            ],
            components: [
                {
                    type: 1,
                    components: [
                        {
                            type: 2,
                            style: 2,
                            custom_id: 'generate_new_identity_token',
                            label: 'Generate New Identity Token',
                        },
                    ],
                },
            ],
        }).catch(console.warn);

        const bot_msg_components_collector = bot_msg.createMessageComponentCollector({
            filter: (interaction) => interaction.user.id === message.author.id,
            time: 5 * 60_000,
            max: 1,
        });

        bot_msg_components_collector.on('collect', async (interaction) => {
            await interaction.deferUpdate();

            switch (interaction.customId) {
                case 'generate_new_identity_token': {
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
                        content: 'I sent your new Identity Token to you via DMs!',
                    }).catch(console.warn);

                    try {
                        /* IMPORTANT: remove the existing identity token entry */
                        await go_mongo_db.remove(process.env.MONGO_DATABASE_NAME, process.env.MONGO_API_AUTH_USERS_COLLECTION_NAME, {
                            'identity.discord_user_id': db_user_data.identity.discord_user_id,
                        });

                        /* add the new identity token entry */
                        await go_mongo_db.add(process.env.MONGO_DATABASE_NAME, process.env.MONGO_API_AUTH_USERS_COLLECTION_NAME, [
                            {
                                'identity': {
                                    'discord_user_id': db_user_data.identity.discord_user_id,
                                    'roblox_user_id': db_user_data.identity.roblox_user_id,
                                },
                                'encrypted_api_token': encrypted_token,
                            },
                        ]);
                    } catch (error) {
                        console.trace(error);

                        await message.reply({
                            content: 'Something went wrong while updating your Identity Token in our database, please contact our support staff!',
                        }).catch(console.warn);
                    }

                    break;
                }

                default: {
                    return; // don't continue if we don't have a valid custom_id
                }
            }

            bot_msg_components_collector.stop();
        });

        bot_msg_components_collector.on('end', async (collected_interactions, reason) => {
            /* remove all components from the message */
            await bot_msg.edit({
                components: [],
            }).catch(console.warn);

            /* check if the collector has exceeded the specified time */
            if (reason === 'time') {
                await bot_msg.delete();
            }
        });
    },
};
