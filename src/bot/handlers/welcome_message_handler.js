//             message.channel.send(new Discord.MessageEmbed({
//                 color: 0xFF0000,
//                 author: {
//                     iconURL: `${client.user.displayAvatarURL({ dynamic: true })}`,
//                     name: `${client.user.username}`,
//                 },
//                 title: 'Error',
//                 description: [
//                     'That verification code was not recognized!',
//                     `You need to provide the verification code that was given to you in the [Product Hub](${process.env.ROBLOX_PRODUCT_HUB_URL})!`,
//                     `Example: \`${command_prefix}verify CODE_HERE\``,
//                 ].join('\n'),
//             })).catch(console.warn);
