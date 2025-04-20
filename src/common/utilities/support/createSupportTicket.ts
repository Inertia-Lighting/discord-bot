import Discord, { ChannelType, ThreadAutoArchiveDuration } from 'discord.js';
import config from '@root/config';

export async function createSupportTicket(interaction: Discord.Interaction<'cached'>, catagory: 'test1' | 'test2'){
    const supportForum = interaction.guild.channels.cache.get('1360710110187487252')
    if(!supportForum) return;
    if(supportForum.type !== Discord.ChannelType.GuildText) return;
    const ticket = await supportForum.threads.create({
        name: `${catagory} - ${interaction.user.displayName}`,
        autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek,
        type: ChannelType.PrivateThread,
    })
    ticket.members.add(interaction.user)

    ticket.send({
        content: 'New ticket!'
    })
    ticket.parent?.send({
        content: `Ticket opened by ${interaction.user.displayName}`,
        components: [
            {
                type: Discord.ComponentType.ActionRow,
                components: [
                    {
                        type: Discord.ComponentType.Button,
                        label: 'Join ticket',
                        customId: `join_${interaction.user.id}`,
                        style: Discord.ButtonStyle.Primary,
                    },
                    
                ]
            }
        ]
    })
    const staffRole = interaction.guild.roles.cache.get(config.customer_service_role_id.id)
    if(!staffRole) return;
    let randomStaff1 = staffRole.members.random()
    if(!randomStaff1) return;
    if (randomStaff1.id === interaction.user.id) {
        randomStaff1 = staffRole.members.random()
    }
    if(!randomStaff1) return;
    ticket.members.add(randomStaff1.user)
    let randomStaff2 = staffRole.members.random()
    if(!randomStaff2) return;
    if (randomStaff2.id === interaction.user.id) {
        randomStaff2 = staffRole.members.random()
    }
    if(!randomStaff2) return;
    ticket.members.add(randomStaff2.user)

}