import { Interaction } from '@root/common/interactions/handler';
import Discord from 'discord.js'
import { CustomEmbed } from '@root/common/utilities/embed';

export default new Interaction({
    identifier: 'demo',
    type: Discord.InteractionType.ApplicationCommand,
    data: {
        type: Discord.ApplicationCommandType.ChatInput,
        description: 'Link to our testing website'
    }, // Add appropriate data structure here
    metadata: {
        required_access_level: PermissionLevel.Public,
        required_run_context: InteractionRunContext.Guild,
    },
    handler: async function(client, interaction) {
        if (!interaction.isRepliable()) return;
        interaction.reply({
            embeds: [
                CustomEmbed.from({
                    title: 'Try It!',
                    description: 'Try our latest products here!',
                })
            ],
            components: [
                {
                    type: Discord.ComponentType.ActionRow,
                    components: [
                        {
                            type: Discord.ComponentType.Button,
                            style: Discord.ButtonStyle.Link,
                            label: 'Demo Game',
                            url: 'https://www.roblox.com/games/start?placeId=6602186152',
                        }
                    ]
                }
            ]
        })
        return;
    }
})