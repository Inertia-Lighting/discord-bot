//------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
//------------------------------------------------------------//

//---------------------------------------------------------------------------------------------------------------//

import * as Discord from 'discord.js';

//---------------------------------------------------------------------------------------------------------------//

import { go_mongo_db } from '../../../mongo/mongo';

import { CustomEmbed } from '@root/bot/common/message';

//---------------------------------------------------------------------------------------------------------------//

export default {
    identifier: 'display_support_ticket_database_documents',
    async execute(
        interaction: Discord.ButtonInteraction
    ) {
        if (!interaction.inCachedGuild()) return;

        await interaction.deferReply({ ephemeral: true });

        const channel = interaction.channel! as Discord.TextChannel;

        const support_ticket_owner_id = channel.name.match(/(?!.*\-)?([0-9])+/i)?.[0];

        /* check if the user is blacklisted */
        const [ db_blacklisted_user_data ] = await go_mongo_db.find(process.env.MONGO_DATABASE_NAME as string, process.env.MONGO_BLACKLISTED_USERS_COLLECTION_NAME as string, {
            'identity.discord_user_id': support_ticket_owner_id,
        }, {
            projection: {
                '_id': false,
            },
        });
        if (db_blacklisted_user_data) {
            await interaction.editReply({
                embeds: [
                    CustomEmbed.from({
                        color: CustomEmbed.colors.RED,
                        author: {
                            icon_url: `${interaction.client.user!.displayAvatarURL({ forceStatic: false })}`,
                            name: 'Inertia Lighting | Blacklist System',
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
        const [ db_user_data ] = await go_mongo_db.find(process.env.MONGO_DATABASE_NAME as string, process.env.MONGO_USERS_COLLECTION_NAME as string, {
            'identity.discord_user_id': support_ticket_owner_id,
        }, {
            projection: {
                '_id': false,
            },
        });
        await interaction.editReply({
            embeds: [
                CustomEmbed.from({
                    author: {
                        icon_url: `${interaction.client.user!.displayAvatarURL({ forceStatic: false })}`,
                        name: 'Inertia Lighting | User Document',
                    },
                    title: 'This embed is for our support staff.',
                    description: `${'```'}json\n${JSON.stringify(db_user_data ?? 'user not found in database', null, 2)}\n${'```'}`,
                }),
            ],
        }).catch(console.warn);
    },
};
