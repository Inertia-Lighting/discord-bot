import { Interaction } from '@root/common/interactions/handler';
import Discord from 'discord.js';

export default new Interaction({
    identifier: 'summon_support_button',
    type: Discord.InteractionType.ApplicationCommand,
    data: {
        type: Discord.ApplicationCommandType.ChatInput,
        description: 'Summon the support button',
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

        await interaction.channel.send({
            components: [
                {
                    type: Discord.ComponentType.ActionRow,
                    components: [
                        {
                            type: Discord.ComponentType.Button,
                            label: 'Open a Ticket',
                            style: Discord.ButtonStyle.Primary,
                            customId: 'support_button'
                        }
                    ]
                }
            ]
        })
        await interaction.reply({
            content: 'Button created',
            flags: ['Ephemeral']
        })
        return;
        // await interaction.editReply({
        //     embeds: 
        // })
    }
});