import { Interaction } from '@root/common/interactions/handler';
import Discord from 'discord.js';
import { CustomEmbed } from '@root/common/utilities/embed';

export default new Interaction({
    identifier: 'kick',
    type: Discord.InteractionType.ApplicationCommand,
    data: {
        type: Discord.ApplicationCommandType.ChatInput,
        description: 'Kick user from the server',
        options: [
            {
                type: Discord.ApplicationCommandOptionType.Mentionable,
                name: 'user',
                description: 'User that will be kicked',
                required: true,
            },
            // {
            //     type: Discord.ApplicationCommandOptionType.String,
            //     name: 'reason',
            //     description: 'Why is this user getting kicked?',
            //     required: true,
            //     choices: [
            //         { 
            //             name: 'Reason 1',
            //              value: 'reason_1' 
            //         },
            //         {
            //             name: 'Reason 2',
            //             value: 'reason_2'
            //         }
            //     ]
            // }
        ]
    },
    metadata: {
        required_access_level: PermissionLevel.Public,
        required_run_context: InteractionRunContext.Guild,
        dev_only: true,
    },
    handler: async (client, interaction) => {
        if (!interaction.isChatInputCommand()) return;
        if (!interaction.inCachedGuild()) return;
        if (!interaction.channel) return;

        await interaction.deferReply({ flags: [] });
        const user = interaction.options.get(('user'), true);        
        const reason = interaction.options.getString(('reason'), true)


        if(!user.member) {
            interaction.editReply({
            embeds: [
                CustomEmbed.from({
                    color: CustomEmbed.color.Violet,
                    title: 'Error',
                    description: 'There was an error fetching the member'
                })
            ]
        })
        return;
    }
        if(!user.member.moderatable) {
            interaction.editReply({
                embeds: [
                    CustomEmbed.from({
                        color: CustomEmbed.color.Violet,
                        title: 'Error',
                        description: 'I do not have permission to kick this user'
                    })
                ]
            })
            return;
        }

        try {

        user.member.send({
            embeds: [
                CustomEmbed.from({
                    color: CustomEmbed.color.Red,
                    title: 'Kicked',
                    description: `You were kicked from Inertia Lighting for: \n ${reason}`
                })
            ]
        })
        user.member.kick(reason)
        } catch(err) {
                interaction.editReply({
                    embeds: [
                        CustomEmbed.from({
                            color: CustomEmbed.color.Violet,
                            title: 'Error',
                            description: 'There was an error kicking this user'
                        })
                    ]
                })
            console.trace(err)
            return;

        } finally {
            interaction.editReply({
                embeds: [
                    CustomEmbed.from({
                        color: CustomEmbed.color.Green,
                        title: 'Error',
                        description: 'User kicked successfully'
                    })
                ]
            })
        }

        return;
        // await interaction.editReply({
        //     embeds: 
        // })
    }
});