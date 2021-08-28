/* Copyright © Inertia Lighting | All Rights Reserved */

//---------------------------------------------------------------------------------------------------------------//

'use strict';

//---------------------------------------------------------------------------------------------------------------//

const { command_permission_levels } = require('../common/bot.js');
const { Discord } = require('../discord_client.js');

//---------------------------------------------------------------------------------------------------------------//

module.exports = {
    name: 'purge',
    description: 'deletes a mass of messages',
    usage: ['purge 20', 'purge #channel 20', 'purge @user 20', 'purge #channel @user 20'],
    aliases: ['purge'],
    permission_level: command_permission_levels.MODERATORS,
    cooldown: 2_000,
    async execute(message, args) {
        const { command_args } = args;

        /* check if there was a channel mentioned */

        let channel = message.guild.channels.cache.get(command_args[0]);

        if (channel) {
          command_args.shift();
        } else channel = message.channel;

        /* check if a user was mentioned */

        const member = message.guild.members.cache.get(command_args[0]);

        if (member) {
            command_args.shift();
        }

        /* check if a an amount was given and if it was between 1 - 100 */

        const amount = parseInt(command_args[0]);

        if (isNaN(amount) === true || !amount || amount < 0 || amount > 100) {
            return message.reply({
                content: 'You need to specify a number between 1-100!'
            });
        }

        await message.delete();

        /* find member messages if given */

        let messages;

        if (member) {
            messages = (await channel.messages.fetch({ limit: amount })).filter(m => m.author.id === member.id);
        } else messages = amount;

        /* check if there was messages found */

        if (messages.size === 0) {
            return message.reply({
                embeds: [
                    new Discord.MessageEmbed({
                        color: 0x60A0FF,
                        name: 'Inertia Lighting | Moderation',
                        description: `Unable to find messages from ${member}.
                        This message will be deleted after \`10 seconds\``,
                        fields: [
                            {
                                name: 'Channel',
                                value: `${channel}`,
                            }, {
                                name: 'Member',
                                value: `${member}`,
                            }
                        ]

                    })
                ]
            }).then(msg => msg.delete({ timeout: 10000 })).catch(err => console.log(err.stack));
        } else {
            channel.bulkDelete(messages, true).then(message => {
                if (!member) {
                message.reply({
                    embeds: [
                        new Discord.MessageEmbed({
                            color: 0x60A0FF,
                            name: 'Inertia Lighting | Moderation',
                            description: `Successfully deleted **${messages.size}** message(s).
                            This message will be deleted after \`10 seconds\`.`,
                            fields: [
                                {
                                    name: 'Channel',
                                    value: `${channel}`,
                                },
                            ]
                        })
                    ]
                }).then(msg => msg.delete({ timeout: 10000 })).catch(err => console.log(err.stack));
            } else if (member) {
                message.reply({
                    embeds: [
                        new Discord.MessageEmbed({
                            color: 0x60A0FF,
                            name: 'Inertia Lighting | Moderation',
                            description: `Successfully deleted **${messages.size}** message(s).
                            This message will be deleted after \`10 seconds\`.`,
                            fields: [
                                {
                                    name: 'Channel',
                                    value: `${channel}`,
                                }, {
                                    name: 'Member',
                                    value: `${member}`,
                                }, {
                                    name: 'Found messages',
                                    value: `${messages.size}`,
                                },
                            ]
                        })
                    ]
                }).then(msg => msg.delete({ timeout: 10000 })).catch(err => console.log(err.stack));
            }


            });
        }
    }
};
