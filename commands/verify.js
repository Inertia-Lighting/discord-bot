module.exports = {
    name: 'verify',
    description: 'verifies the user and adds them to the database',
    usage: 'CODE_HERE',
    ownerOnly: false,
    aliases: ['verify', 'v'],
    async execute(message, args, client, Discord, prefix, mongo, userSchema) {
        const verification_code_to_lookup = args[0];
        const verification_context = client.$.verification_contexts.get(verification_code_to_lookup);

        if (!verification_context) {
            message.channel.send(new Discord.MessageEmbed({
                color: 0xFF0000,
                author: {
                    name: `${client.user.username}`,
                    iconURL: `${client.user.avatarURL()}`,
                    url: `https://inertia-lighting.xyz`
                },
                title: 'Error',
                description: [
                    'That verification code was not recognised!',
                    'You need to provide the verification code that was given to you in the product hub!',
                    `Example: \`${prefix}verify CODE_HERE\``,
                ].join('\n'),
            }));
            return;
        }

        /* remove the verification code b/c it is no longer needed */
        client.$.verification_contexts.delete(verification_context.verification_code);

        message.channel.send(new Discord.MessageEmbed({
            color: 0x00FF00,
            author: {
                name: `${client.user.username}`,
                iconURL: `${client.user.avatarURL()}`,
                url: `https://inertia-lighting.xyz`
            },
            title: 'Success',
            description: 'That verification code was recognised!',
        }));

        await mongo(); // initialize connection to database

        const db_user_data = await userSchema.findOne({
            _id: message.author.id,
        });

        if (db_user_data) {
            message.channel.send(new Discord.MessageEmbed({
                color: 0xFF0000,
                author: {
                    name: `${client.user.username}`,
                    iconURL: `${client.user.avatarURL()}`,
                    url: `https://inertia-lighting.xyz`
                },
                title: 'Error',
                description: 'I already found you in the database! If you would like to update yourself please run \`!update\`',
            }));
        } else {
            const member_roles = message.member.roles.cache;
            await userSchema.findOneAndUpdate({
                _id: message.author.id,
            }, {
                ROBLOX_ID: verification_context.roblox_user_id,
                products: {
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
            }, {
                upsert: true,
            });
        }
    }
}
