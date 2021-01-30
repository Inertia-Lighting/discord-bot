'use strict';

//---------------------------------------------------------------------------------------------------------------//

const { Discord, client } = require('../discord_client.js');

//---------------------------------------------------------------------------------------------------------------//

const command_prefix = process.env.BOT_COMMAND_PREFIX;

const support_tickets_category_id = '805191315947913236';

//---------------------------------------------------------------------------------------------------------------//

const support_categories = new Discord.Collection([
    {
        id: 'PRODUCT_ISSUES',
        name: 'Product Issues',
        description: 'Come here if you are having issues with any of our products.',
    }, {
        id: 'PRODUCT_TRANSFERS',
        name: 'Product Transfers',
        description: 'Come here if you want to transfer any of your products to another account.',
    }, {
        id: 'OTHER',
        name: 'Other Issues',
        description: 'Come here if none of the other categories match your issue.',
    },
].map((item, index) => ([ item.id, { ...{ human_index: index + 1 }, ...item } ])));

//---------------------------------------------------------------------------------------------------------------//

module.exports = {
    name: 'support',
    description: 'support tickets and stuff',
    ownerOnly: true,
    usage: 'support',
    async execute(message, args) {
        const bot_message = await message.channel.send(`${message.author}`, new Discord.MessageEmbed({
            color: 0x00FF00,
            author: {
                iconURL: `${client.user.displayAvatarURL({ dynamic: true })}`,
                name: 'Inertia Lighting | Support System',
            },
            description: [
                '**How can I help you today?**',
                support_categories.map(({ human_index, name, description }) => `**${human_index} | ${name}**\n${description}`).join('\n\n'),
                '**Type the number of the category that you need.**',
            ].join('\n\n'),
        }));

        const message_collector_1 = bot_message.channel.createMessageCollector((msg) => msg.author.id === message.author.id);
        message_collector_1.on('collect', async (msg) => {
            const matching_support_category = support_categories.find(support_category => `${support_category.human_index}` === msg.content);
            if (matching_support_category) {
                message_collector_1.stop();
                msg.reply(`You selected ${matching_support_category.name}!`);
            } else if (msg.content === 'cancel') {
                message_collector_1.stop();
                msg.reply(`Canceled!`);
            } else {
                msg.reply(`Please type the category number or \`cancel\`.`);
            }
        });
    },
};
