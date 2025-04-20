import Discord from 'discord.js'
import { Interaction } from '@root/common/interactions/handler'
import { CustomEmbed } from '@root/common/utilities/embed';

export default new Interaction({
    identifier: 'test_button',
    type: Discord.InteractionType.MessageComponent,
    data: undefined,
    metadata: {
        required_access_level: PermissionLevel.Public,
        required_run_context: InteractionRunContext.Guild
    },
    async handler(client, interaction): Promise<void> {
        if (!interaction.isButton()) return;
        if (!interaction.inCachedGuild()) return;
        if (!interaction.channel) return;

        await interaction.reply({
            flags: ['Ephemeral'],
            embeds: [
                CustomEmbed.from({
                    title: 'This is a test button :)',
                })
            ]
        })
    }
})