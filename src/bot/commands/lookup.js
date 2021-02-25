'use strict';

//---------------------------------------------------------------------------------------------------------------//

const { go_mongo_db } = require('../../mongo/mongo.js');

const { Discord, client } = require('../discord_client.js');

//---------------------------------------------------------------------------------------------------------------//

module.exports = {
    name: 'lookup',
    description: 'looks up a specified user in the database',
    aliases: ['lookup'],
    permission_level: 'admin',
    async execute(message, args) {
        const { command_args } = args;

        const lookup_discord_user_id = message.mentions.members.first()?.id;
        const lookup_roblox_user_id = command_args[0];

        if (!(lookup_discord_user_id || lookup_roblox_user_id)) {
            message.reply('provide a \`roblox_user_id\` or a discord user @mention!');
            return;
        }

        /* send the user document */
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
        await message.channel.send(new Discord.MessageEmbed({
            color: 0x60A0FF,
            author: {
                iconURL: `${client.user.displayAvatarURL({ dynamic: true })}`,
                name: 'Inertia Lighting | User Document',
            },
            description: `${'```'}json\n${JSON.stringify(db_user_data ?? 'user not found in database', null, 2)}\n${'```'}`,
        })).catch(console.warn);
    },
};
