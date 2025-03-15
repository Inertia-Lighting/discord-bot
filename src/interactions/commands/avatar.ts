import { Interaction } from '@root/common/interactions/handler';
import Discord from 'discord.js';
import { CustomEmbed } from '../../common/utilities/embed';

export default new Interaction({
    identifier: 'avatar',
    type: Discord.InteractionType.ApplicationCommand,
    data: {
        type: Discord.ApplicationCommandType.ChatInput,
        description: 'Grab an avatar from a user',
        options: [
            {
                type: Discord.ApplicationCommandOptionType.User,
                name: 'user',
                description: 'User that will be fetched',
                required: false,
            }
        ]
    },
    metadata: {
        required_access_level: PermissionLevel.Public,
        required_run_context: InteractionRunContext.Guild,
    },
    handler: async (client, interaction) => {
        if (!interaction.isChatInputCommand()) return;
        if (!interaction.inCachedGuild()) return;
        if (!interaction.channel) return;

        await interaction.deferReply({ flags: [] });
        const user = interaction.options.getUser(('user'), false);
        if (user) {
            await interaction.editReply({
                embeds: [
                    CustomEmbed.from({
                        title: `${user.displayName}'s Avatar`,
                        image: {
                            url: user.avatarURL() ?? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}`
                        },
                        author: {
                            name: interaction.user.displayName,
                            icon_url: interaction.user.avatarURL({
                                size: 512
                            }) ?? `https://cdn.discordapp.com/avatars/${interaction.user.id}/${interaction.user.avatar}?size=512`,
                        }
                    })
                ]
            });
            return;
        }
        interaction.editReply({
            embeds: [
                CustomEmbed.from({
                    title: 'Your Avatar',
                    image: {
                        url: interaction.user.avatarURL() ?? `https://cdn.discordapp.com/avatars/${interaction.user.id}/${interaction.user.avatar}`
                    },
                    author: {
                        name: interaction.user.displayName,
                        icon_url: interaction.user.avatarURL({
                            size: 512
                        }) ?? `https://cdn.discordapp.com/avatars/${interaction.user.id}/${interaction.user.avatar}`,
                    }
                })
            ]
        });
        return;
        // await interaction.editReply({
        //     embeds: 
        // })
    }
});