/* Copyright © Inertia Lighting | All Rights Reserved */

//---------------------------------------------------------------------------------------------------------------//

'use strict';

//---------------------------------------------------------------------------------------------------------------//

const { go_mongo_db } = require('../../mongo/mongo.js');

const { Discord, client } = require('../discord_client.js');

const { command_permission_levels } = require('../common/bot.js');

//---------------------------------------------------------------------------------------------------------------//

module.exports = {
    name: 'lookup',
    description: 'looks up a specified user in the database',
    aliases: ['lookup'],
    permission_level: command_permission_levels.STAFF,
    cooldown: 2_500,
    async execute(message, args) {
        const { command_args } = args;

        const lookup_discord_user_id = message.mentions.members.first()?.id;
        const lookup_roblox_user_id = command_args[0];

        if (!(lookup_discord_user_id || lookup_roblox_user_id)) {
            message.reply({
                content: 'provide a \`roblox_user_id\` or a discord @user mention!',
            }).catch(console.warn);
            return;
        }

        /* fetch blacklisted user data */
        const [ db_blacklisted_user_data ] = await go_mongo_db.find(process.env.MONGO_DATABASE_NAME, process.env.MONGO_BLACKLISTED_USERS_COLLECTION_NAME, {
            ...(lookup_discord_user_id ? {
                'identity.discord_user_id': lookup_discord_user_id,
            } : {
                'identity.roblox_user_id': lookup_roblox_user_id,
            }),
        }, {
            projection: {
                '_id': false,
            },
        });

        /* fetch the user document */
        const [ db_user_data ] = await go_mongo_db.find(process.env.MONGO_DATABASE_NAME, process.env.MONGO_USERS_COLLECTION_NAME, {
            ...(lookup_discord_user_id ? {
                'identity.discord_user_id': lookup_discord_user_id,
            } : {
                'identity.roblox_user_id': lookup_roblox_user_id,
            }),
        }, {
            projection: {
                '_id': false,
            },
        });

        /* send the user document */
        await message.channel.send({
            embeds: [
                ...(db_blacklisted_user_data ? [
                    new Discord.MessageEmbed({
                        color: 0x60A0FF,
                        author: {
                            iconURL: `${client.user.displayAvatarURL({ dynamic: true })}`,
                            name: 'Inertia Lighting | User Blacklist System',
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
                ] : []),
                new Discord.MessageEmbed({
                    color: 0x60A0FF,
                    author: {
                        iconURL: `${client.user.displayAvatarURL({ dynamic: true })}`,
                        name: 'Inertia Lighting | User Lookup System',
                    },
                    description: `${'```'}json\n${JSON.stringify(db_user_data ?? 'user not found in database', null, 2)}\n${'```'}`,
                }),
            ],
        }).catch(console.warn);
    },
};
