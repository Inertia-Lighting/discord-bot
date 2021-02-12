'use strict';

//---------------------------------------------------------------------------------------------------------------//

const bcrypt = require('bcryptjs');
const { v4: uuid_v4 } = require('uuid');

const { go_mongo_db } = require('../../mongo/mongo.js');
const { Discord, client } = require('../discord_client.js');

//---------------------------------------------------------------------------------------------------------------//

async function generateUserAPIToken() {
    const non_encrypted_token = uuid_v4();
    const encrypted_token = bcrypt.hashSync(non_encrypted_token, bcrypt.genSaltSync(parseInt(process.env.BCRYPT_SALT_LENGTH)));
    return {
        non_encrypted_token,
        encrypted_token,
    };
}

//---------------------------------------------------------------------------------------------------------------//

module.exports = {
    name: 'api_token',
    description: 'n/a',
    aliases: ['api_token'],
    cooldown: 60_000,
    permission_level: 'staff',
    async execute(message, args) {
        const { command_prefix, command_name, command_args } = args;

        const [ user_db_data ] = await go_mongo_db.find(process.env.MONGO_DATABASE_NAME, process.env.MONGO_USERS_COLLECTION_NAME, {
            'discord_user_id': message.author.id,
        });

        if (!user_db_data) {
            message.reply(`Please \`${command_prefix}verify\` before using this command!`);
            return;
        }

        switch (`${command_args[0]}`.toLowerCase()) {
            case 'help':
                message.reply(`\`${command_prefix}${command_name} help\` coming soon!`);
                break;
            case 'generate':
                const { non_encrypted_token, encrypted_token } = await generateUserAPIToken();
                try {
                    const dm_channel = await message.author.createDM();
                    await dm_channel.send(new Discord.MessageEmbed({
                        color: 0x60A0FF,
                        author: {
                            iconURL: `${client.user.displayAvatarURL({ dynamic: true })}`,
                            name: 'Inertia Lighting | API Token System',
                        },
                        description: [
                            'The following token must be kept private and must be used in games with our products:',
                            `||${non_encrypted_token}||`,
                            '(click the box above to view your token)',
                        ].join('\n'),
                    }));
                } catch {
                    message.reply('I was unable to DM you!');
                }
                await go_mongo_db.update(process.env.MONGO_DATABASE_NAME, process.env.MONGO_API_AUTH_USERS_COLLECTION_NAME, {
                    'discord_user_id': user_db_data.discord_user_id,
                }, {
                    $set: {
                        'roblox_user_id': user_db_data.roblox_user_id,
                        'encrypted_api_token': encrypted_token,
                    },
                }, {
                    upsert: true,
                });
                break;
            default:
                message.channel.send(new Discord.MessageEmbed({
                    color: 0x60A0FF,
                    author: {
                        iconURL: `${client.user.displayAvatarURL({ dynamic: true })}`,
                        name: 'Inertia Lighting | API Token System',
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
                }));
                break;
        }
    },
};
