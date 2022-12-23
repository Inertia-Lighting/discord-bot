//------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
//------------------------------------------------------------//

//---------------------------------------------------------------------------------------------------------------//

import { command_permission_levels } from '../common/bot';

import { Discord } from '../discord_client';

import { CustomEmbed } from '../common/message';

const support_categories = new Discord.Collection([
    {
        id: 'ISSUES',
        name: 'Product Tech Support',
        description: 'Product technical support can be found here.',
    }, {
        id: 'RECOVERY',
        name: 'Account Recovery',
        description: 'Recover products from an inaccessible account.',
    }, {
        id: 'TRANSFERS',
        name: 'Transfer Products',
        description: 'Transfer or gift products to a different account.',
    }, {
        id: 'TRANSACTIONS',
        name: 'Transactions',
        description: 'Failed transactions or monetary issues with purchases.',
    }, {
        id: 'OTHER',
        name: 'Other & Quick Questions',
        description: 'For all other forms of support.',
    },
].map((item) => [ item.id, item ]));

//---------------------------------------------------------------------------------------------------------------//

export default {
    name: 'support_embed',
    description: 'why does this even exist fuc',
    aliases: ['support_embed'],
    permission_level: command_permission_levels.ADMINS,
    cooldown: 500,
    async execute(
        message: Discord.Message<true>,
        args: {
            [key: string]: unknown;
        },
    ) {
        message.channel.send({
            embeds: [
                CustomEmbed.from({
                    description: [
                        '**How do I open a support ticket?**',
                        'To open a support ticket, simply click on the drop down bellow, and click the selection that best fits your needs!',
                        '',
                        '**What do I do once my ticket is open?**',
                        'Wait for support staff to get to your ticket.',
                        '',
                        '**How do I close my support ticket?**',
                        'Support tickets can only be closed by staff members.',
                        'Let us know in the ticket when you want us to close it.',
                        '',
                        '**How do I suggest new features / ideas?**',
                        'Suggestions can be made in any of our suggestions channels.',
                        'Simply send your suggestion in one of the suggestions channels.',
                        '',
                        '**Abuse of the support system will result in a 24 hour timeout.**',
                    ].join('\n'),
                }),
            ],
            components: [
                {
                    type: 1,
                    components: [
                        {
                            type: 3,
                            custom_id: 'support_category_selection_menu',
                            placeholder: 'Select a support category!',
                            min_values: 1,
                            max_values: 1,
                            options: support_categories.map(({ id, name, description }) => ({
                                label: name,
                                description: description.slice(0, 100),
                                value: id,
                            })),
                        },
                    ],
                },
            ],
        }).catch(console.warn);
    },
};
