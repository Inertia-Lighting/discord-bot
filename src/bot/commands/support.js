'use strict';

//---------------------------------------------------------------------------------------------------------------//

const { Discord, client } = require('../discord_client.js');

//---------------------------------------------------------------------------------------------------------------//

const support_categories = new Discord.Collection([
    {
        id: 'PRODUCT_PURCHASES',
        name: 'Product Purchases',
        description: 'Come here if you are having issues with purchasing our products.',
    }, {
        id: 'PRODUCT_TRANSFERS',
        name: 'Product Transfers',
        description: 'Come here if you want to transfer any of your products to another account.',
    }, {
        id: 'PARTNER_REQUESTS',
        name: 'Partner Requests',
        description: 'Come here if you want to request a partnership with Inertia Lighting.',
    }, {
        id: 'OTHER',
        name: 'Other Issues',
        description: 'Come here if none of the other categories match your issue.',
    },
].map((item, index) => ([ item.id, { ...{ human_index: index + 1 }, ...item } ])));

//---------------------------------------------------------------------------------------------------------------//

const support_tickets_category_id = '805191315947913236';
async function createSupportTicketChannel(guild, guild_member, support_category) {
    const support_tickets_category = guild.channels.resolve(support_tickets_category_id);

    const support_channel_name = `${support_category.id}-${guild_member.id}`.toLowerCase();
    const potential_open_ticket_channel = guild.channels.cache.find(ch => ch.parent?.id === support_tickets_category.id && ch.name === support_channel_name);
    const support_ticket_channel = potential_open_ticket_channel ?? await guild.channels.create(support_channel_name, {
        type: 'text',
        topic: 'Thank you for being patient!',
        parent: support_tickets_category,
    });

    return support_ticket_channel;
}

//---------------------------------------------------------------------------------------------------------------//

module.exports = {
    name: 'support',
    description: 'support tickets and stuff',
    aliases: ['support', 'close_ticket'],
    permission_level: 'staff',
    async execute(message, args) {
        const { command_name } = args;

        if (command_name === 'close_ticket') {
            message.reply('command coming soon!');
            return;
        }

        const bot_message = await message.channel.send(`${message.author}`, new Discord.MessageEmbed({
            color: 0x959595,
            author: {
                iconURL: `${client.user.displayAvatarURL({ dynamic: true })}`,
                name: 'Inertia Lighting | Support System',
            },
            description: [
                '**How can I help you today?**',
                support_categories.map(({ human_index, name, description }) => `**${human_index} | ${name}**\n${description}`).join('\n\n'),
                '**Type the number of the category that you need or \`cancel\`.**',
            ].join('\n\n'),
        }));

        const message_collector_1 = bot_message.channel.createMessageCollector((msg) => msg.author.id === message.author.id);
        message_collector_1.on('collect', async (collected_message) => {
            const matching_support_category = support_categories.find((support_category) => `${support_category.human_index}` === collected_message.content);
            if (matching_support_category) {
                message_collector_1.stop();

                const support_channel = await createSupportTicketChannel(message.guild, message.member, matching_support_category);
                collected_message.reply([
                    `You selected ${matching_support_category.name}!`,
                    `Go to ${support_channel} to continue.`,
                ].join('\n')).catch(console.warn);

                switch (matching_support_category.id) {
                    case 'PRODUCT_PURCHASES':
                        support_channel.send(`${message.author}, A qualified member of staff will be assigned to help you with **${matching_support_category.name}** shortly!`);
                        break;
                    case 'PRODUCT_ISSUES':
                        support_channel.send(`${message.author}, A qualified member of staff will be assigned to help you with **${matching_support_category.name}** shortly!`);
                        break;
                    case 'PRODUCT_TRANSFERS':
                        support_channel.send(`${message.author}, A qualified member of staff will be assigned to help you with **${matching_support_category.name}** shortly!`);
                        break;
                    case 'PARTNER_REQUESTS':
                        support_channel.send(`${message.author}, A qualified member of staff will be assigned to help you with **${matching_support_category.name}** shortly!`);
                        break;
                    case 'OTHER':
                        support_channel.send(`${message.author}, Please tell us what you need assistance with!`);
                        break;
                }
            } else if (collected_message.content === 'cancel') {
                message_collector_1.stop();
                collected_message.reply('Canceled!').catch(console.warn);
                bot_message.delete({ timeout: 500 }).catch(console.warn);
            } else {
                collected_message.reply('Please type the category number or \`cancel\`.').catch(console.warn);
            }
        });
    },
};
