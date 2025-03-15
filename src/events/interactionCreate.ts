import Discord from 'discord.js'
import { InteractionsManager } from '@root/common/interactions/handler';

export const event_name = 'interaction_create'

export function handler(client: Discord.Client<true>, interaction: Discord.Interaction) {
    console.log('New interaction')
    if (!interaction.client.isReady()) return; // don't allow interactions to be handled until the client is ready
    if (interaction.user.system) return; // don't allow system accounts to interact
    if (interaction.user.bot) return; // don't allow bots to interact

    /* handle interactions */
    InteractionsManager.handleInteractionFromDiscord(interaction.client, interaction);
}