import Discord from 'discord.js'
import { Interaction } from '@root/common/interactions/handler'
import { createSupportTicket } from '@root/common/utilities/support/createSupportTicket';

export default new Interaction({
    identifier: 'support_button',
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

        await createSupportTicket(interaction, 'test1')
    }
})