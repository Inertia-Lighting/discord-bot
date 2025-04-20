import { Interaction } from '@root/common/interactions/handler';
import Discord from 'discord.js';
// import { CustomEmbed } from '@root/common/utilities/embed';

export default new Interaction({
    identifier: 'profile',
    type: Discord.InteractionType.ApplicationCommand,
    data: {
        type: Discord.ApplicationCommandType.ChatInput,
        description: 'Test the command',
        options: [
            {
                type: Discord.ApplicationCommandOptionType.String,
                name: 'test',
                description: 'test',
                choices: [
                    {
                        name: 'Property',
                        value: 'property'
                    }
                ]
            }
        ]
    },
    metadata: {
        required_access_level: PermissionLevel.Public,
        required_run_context: InteractionRunContext.Guild,
        dev_only: true,
    },
    handler: async (client, interaction) => {
        if(!interaction.isCommand()) return;
        
    }
});