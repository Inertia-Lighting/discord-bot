/* Copyright © Inertia Lighting | All Rights Reserved */

//---------------------------------------------------------------------------------------------------------------//

'use strict';

//---------------------------------------------------------------------------------------------------------------//

const Discord = require('discord.js');

//---------------------------------------------------------------------------------------------------------------//

const { go_mongo_db } = require('../../../mongo/mongo.js');

//---------------------------------------------------------------------------------------------------------------//

module.exports = {
    identifier: 'display_support_ticket_database_documents',
    /** @param {Discord.ButtonInteraction} interaction */
    async execute(interaction) {
        if (!interaction.inCachedGuild()) return;

        await interaction.deferReply({ ephemeral: true });

        /** @type {Discord.TextChannel} */
        const channel = interaction.channel;

        const support_ticket_owner_id = channel.name.match(/(?!.*\-)?([0-9])+/i)?.[0];

        /* check if the user is blacklisted */
        const [ db_blacklisted_user_data ] = await go_mongo_db.find(process.env.MONGO_DATABASE_NAME, process.env.MONGO_BLACKLISTED_USERS_COLLECTION_NAME, {
            'identity.discord_user_id': support_ticket_owner_id,
        }, {
            projection: {
                '_id': false,
            },
        });
        if (db_blacklisted_user_data) {
            await interaction.editReply({
                embeds: [
                    new Discord.MessageEmbed({
                        color: 0x60A0FF,
                        author: {
                            iconURL: `${interaction.client.user.displayAvatarURL({ dynamic: true })}`,
                            name: 'Inertia Lighting | Support Ticket',
                        },
                        description: [
                            '\`\`\`',
                            'User is blacklisted from using Inertia Lighting products!',
                            '\`\`\`',
                            '\`\`\`json',
                            `${JSON.stringify(db_blacklisted_user_data, null, 2)}`,
                            '\`\`\`',
                        ].join('\n'),
                    }),
                ],
            }).catch(console.warn);

            return; // don't continue if the user is blacklisted
        }

        /* send the user document */
        const [ db_user_data ] = await go_mongo_db.find(process.env.MONGO_DATABASE_NAME, process.env.MONGO_USERS_COLLECTION_NAME, {
            'identity.discord_user_id': support_ticket_owner_id,
        }, {
            projection: {
                '_id': false,
            },
        });
        await interaction.editReply({
            embeds: [
                new Discord.MessageEmbed({
                    color: 0x60A0FF,
                    author: {
                        iconURL: `${interaction.client.user.displayAvatarURL({ dynamic: true })}`,
                        name: 'Inertia Lighting | User Document',
                    },
                    title: 'This embed is for our support staff.',
                    description: `${'```'}json\n${JSON.stringify(db_user_data ?? 'user not found in database', null, 2)}\n${'```'}`,
                }),
            ],
        }).catch(console.warn);
    },
};
