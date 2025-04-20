import { Interaction } from '@root/common/interactions/handler';
import Discord from 'discord.js';

export default new Interaction({
    identifier: 'lookup',
    type: Discord.InteractionType.ApplicationCommand,
    data: {
        type: Discord.ApplicationCommandType.ChatInput,
        description: 'Summon the test button',
        options: [
            {
                type: Discord.ApplicationCommandOptionType.String,
                name: 'Type',
                required: true,
                choices: [
                    {
                        name: 'Discord',
                        value: 'discord'
                    },
                    {
                        name: 'Roblox',
                        value: 'roblox'
                    }
                ],
                description: 'Type of ID to lookup'
            },
            {
                type: Discord.ApplicationCommandOptionType.String,
                name: 'ID',
                description: 'ID of the user',
                required: true,
            }
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

        const idType = interaction.options.getString('type', true) as 'discord' | 'roblox';
        const id = interaction.options.getString('id', true)
        // eslint-disable-next-line default-case
        // switch (idType) {
        //     case 'discord':{
                
        //     }
        //     case 'roblox':
        // }
        
        // await interaction.reply({
        //     content: 'Button created',
        //     flags: ['Ephemeral']
        // })
        // return;
        // await interaction.editReply({
        //     embeds: 
        // })
    }
});