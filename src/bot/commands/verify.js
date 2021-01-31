'use strict';

//---------------------------------------------------------------------------------------------------------------//

const { go_mongo_db } = require('../../mongo/mongo.js');

const { Discord, client } = require('../discord_client.js');

//---------------------------------------------------------------------------------------------------------------//

const command_prefix = process.env.BOT_COMMAND_PREFIX;

//---------------------------------------------------------------------------------------------------------------//

module.exports = {
    name: 'verify',
    description: 'verifies the user and adds them to the database',
    usage: 'CODE_HERE',
    aliases: ['verify', 'v'],
    permission_level: 'staff',
    async execute(message, args) {
        const verification_code_to_lookup = args[0];
        const verification_context = client.$.verification_contexts.get(verification_code_to_lookup);

        if (!verification_context) {
            message.channel.send(new Discord.MessageEmbed({
                color: 0xFF0000,
                author: {
                    iconURL: `${client.user.displayAvatarURL({ dynamic: true })}`,
                    name: `${client.user.username}`,
                },
                title: 'Error',
                description: [
                    'That verification code was not recognized!',
                    'You need to provide the verification code that was given to you in the product hub!',
                    `Example: \`${command_prefix}verify CODE_HERE\``,
                ].join('\n'),
            })).catch(console.warn);
            return;
        }

        /* remove the verification code b/c it is no longer needed */
        client.$.verification_contexts.delete(verification_context.verification_code);

        message.channel.send(new Discord.MessageEmbed({
            color: 0x00FF00,
            author: {
                iconURL: `${client.user.displayAvatarURL({ dynamic: true })}`,
                name: `${client.user.username}`,
            },
            title: 'Success',
            description: 'That verification code was recognized!',
        })).catch(console.warn);

        const [ db_user_data ] = await go_mongo_db.find(process.env.MONGO_DATABASE_NAME, process.env.MONGO_USERS_COLLECTION_NAME, {
            '_id': message.author.id,
        });

        if (db_user_data) {
            message.channel.send(new Discord.MessageEmbed({
                color: 0xFF0000,
                author: {
                    iconURL: `${client.user.displayAvatarURL({ dynamic: true })}`,
                    name: `${client.user.username}`,
                },
                title: 'Error',
                description: 'I already found you in the database! If you would like to update yourself please run \`!update\`',
            })).catch(console.warn);
        } else {
            const member_roles = message.member.roles.cache;
            await go_mongo_db.update(process.env.MONGO_DATABASE_NAME, process.env.MONGO_USERS_COLLECTION_NAME, {
                '_id': message.author.id,
            }, {
                $set: {
                    'ROBLOX_ID': verification_context.roblox_user_id,
                    'products': {
                        'SGM_Q7_STROBE': member_roles.has('728050461566828554'),
                        'Laser_Fixture': member_roles.has('701758602624368741'),
                        'Follow_Spotlight': member_roles.has('703378159768436778'),
                        'JDC1': member_roles.has('651875390226169896'),
                        'C_Lights': member_roles.has('601909655165337600'),
                        'LED_Bars': member_roles.has('616358700642467856'),
                        'MagicPanels': member_roles.has('679585419192434699'),
                        'House_Lights': member_roles.has('704504968748466226'),
                        'Pars': member_roles.has('655225947951333376'),
                        'Blinders': member_roles.has('608432734578147338'),
                        'Wash': member_roles.has('673362639660908559'),
                    },
                },
            }, {
                upsert: true,
            });
        }
    },
};
