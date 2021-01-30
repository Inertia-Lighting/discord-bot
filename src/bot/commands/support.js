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
].map((item, index) => ([ item.id, { index, ...item } ])));

//---------------------------------------------------------------------------------------------------------------//

module.exports = {
    name: 'support',
    description: 'support tickets and stuff',
    ownerOnly: true,
    usage: 'support',
    async execute(message, args) {
        const bot_message = await message.reply([
            'How can I help you today?',
            `${'```'}\n`,
            support_categories.map(({ index, name, description }) => `[ ${index + 1} ] | ${name}\n${description}`).join('\n\n'),
            `\n${'```'}`,
            'Type the number of the category that you need.',
        ].join('\n'));
    },
};
