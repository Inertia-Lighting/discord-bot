'use strict';

//---------------------------------------------------------------------------------------------------------------//

const { go_mongo_db } = require('../../mongo/mongo.js');

//---------------------------------------------------------------------------------------------------------------//

module.exports = {
    name: 'lookup_user',
    description: 'looks up a specified user',
    ownerOnly: true,
    aliases: ['lookup_user'],
    async execute(message, command_args) {
        const lookup_discord_user_id = message.mentions.members.first()?.id;
        const lookup_roblox_user_id = command_args[0];

        if (!(lookup_discord_user_id || lookup_roblox_user_id)) {
            message.reply('provide a roblox_id or user mention!');
            return;
        }

        const [ user_db_data ] = await go_mongo_db.find(process.env.MONGO_DATABASE_NAME, process.env.MONGO_USERS_COLLECTION_NAME, {
            ...(lookup_discord_user_id ? {
                '_id': lookup_discord_user_id,
            } : {
                'ROBLOX_ID': lookup_roblox_user_id,
            }),
        });

        console.log({ user_db_data });

        // message.channel.send(new Discord.MessageEmbed({
        //     color: 0x2f3136,
        //     author: {
        //         iconURL: `${client.user.displayAvatarURL({ dynamic: true })}`,
        //         name: 'Inertia Lighting | Products',
        //         color: 0x36393F 
        //     },
        //     description: [
        //         `Hey there ${message.author}!\n\n**Here are our products:**`,
        //         db_roblox_products.map(product => 
        //             [
        //                 `**Product** ${product.name}`,
        //                 `**Code:** ${product.code}`,
        //                 `**Role:** <@&${product.discord_role_id}>`,
        //                 `**Description:**\n\`\`\`${product.description}\`\`\``,
        //             ].join('\n')
        //         ).join('\n'),
        //     ].join('\n\n'),
        // })).catch(console.warn);
    },
};
