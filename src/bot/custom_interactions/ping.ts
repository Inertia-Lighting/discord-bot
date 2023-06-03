import * as Discord from 'discord.js';

import { CustomInteraction, CustomInteractionAccessLevel } from '../common/managers/custom_interactions_manager';


export default new CustomInteraction({
    identifier: 'ping',
    type: Discord.InteractionType.ApplicationCommand,
    data: {
        type: Discord.ApplicationCommandType.ChatInput,
        description: 'Display the ping of the bot',
        options: [],
    },
    metadata: {
        required_access_level: CustomInteractionAccessLevel.Public,
    },
    handler: async (discord_client, interaction) => {
        if (!interaction.isChatInputCommand()) return;
        if (!interaction.inCachedGuild()) return;
        if (!interaction.channel) return;

        await interaction.reply({
            content: `Pong: ${discord_client.ws.ping}`,
        });
    },
});
