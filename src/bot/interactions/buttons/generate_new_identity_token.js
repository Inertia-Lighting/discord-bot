/* Copyright © Inertia Lighting | All Rights Reserved */

//---------------------------------------------------------------------------------------------------------------//

'use strict';

//---------------------------------------------------------------------------------------------------------------//

const Discord = require('discord.js');
const bcrypt = require('bcryptjs');
const { v4: uuid_v4 } = require('uuid');

//---------------------------------------------------------------------------------------------------------------//

const { go_mongo_db } = require('../../mongo/mongo.js');

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
    identifier: 'generate_new_identity_token',
    /** @param {Discord.ButtonInteraction} interaction */
    async execute(interaction) {
        if (!interaction.inCachedGuild()) return;

        await interaction.deferReply({ ephemeral: true });

        const guild_member = await interaction.guild.members.fetch(interaction.user.id);

        const [ db_user_data ] = await go_mongo_db.find(process.env.MONGO_DATABASE_NAME, process.env.MONGO_USERS_COLLECTION_NAME, {
            'identity.discord_user_id': guild_member.user.id,
        });

        if (!db_user_data) {
            await interaction.editReply({
                ephemeral: true,
                content: `Please \`${process.env.BOT_COMMAND_PREFIX}verify\` first!`,
            }).catch(console.warn);

            return; // don't continue if user doesn't exist in the database
        }

        const { non_encrypted_token, encrypted_token } = await generateUserAPIToken();

        try {
            /* IMPORTANT: remove the existing identity token entry */
            await go_mongo_db.remove(process.env.MONGO_DATABASE_NAME, process.env.MONGO_API_AUTH_USERS_COLLECTION_NAME, {
                $or: [
                    { 'identity.discord_user_id': db_user_data.identity.discord_user_id },
                    { 'identity.roblox_user_id': db_user_data.identity.roblox_user_id },
                ],
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

            await interaction.editReply({
                ephemeral: true,
                embeds: [
                    new Discord.MessageEmbed({
                        color: 0xFF0000,
                        author: {
                            iconURL: `${interaction.client.user.displayAvatarURL({ dynamic: true })}`,
                            name: 'Inertia Lighting | Identity Token System',
                        },
                        title: 'Error',
                        description: 'An error occurred while generating your Identity Token, please contact our support staff!',
                    }),
                ],
            }).catch(console.warn);

            return; // don't continue if something went wrong
        }

        await interaction.editReply({
            ephemeral: true,
            embeds: [
                new Discord.MessageEmbed({
                    color: 0x00FF00,
                    author: {
                        iconURL: `${interaction.client.user.displayAvatarURL({ dynamic: true })}`,
                        name: 'Inertia Lighting | Identity Token System',
                    },
                    description: [
                        '**Instructions:**',
                        '1) Keep your Identity Token secret as it is unique to you (like a password).',
                        '2) You only need to generate your Identity Token once!',
                        '3) Paste your Identity Token Code Snippet into Roblox Studio\'s Command Bar.',
                        '4) Observe your Roblox Studio\'s output window.',
                        '5) You can now use our products inside of your game.',
                        '',
                        '**Your Identity Token Code Snippet:**',
                        `||\`require(7096701514)('${non_encrypted_token}')\`||`,
                        '(Click the box above to view your Identity Token Code Snippet)',
                    ].join('\n'),
                }),
            ],
        }).catch(console.warn);
    },
};
