'use strict';

//---------------------------------------------------------------------------------------------------------------//

const stringSimilarity = require('string-similarity');
const { Discord, client } = require('../discord_client.js');

//---------------------------------------------------------------------------------------------------------------//

const bot_command_prefix = process.env.BOT_COMMAND_PREFIX;

//---------------------------------------------------------------------------------------------------------------//

/* searchable_query must be lowercase */
const qs_topics = [
    {
        searchable_query: 'roblox studio output',
        support_contents: 'To open the output window in Roblox Studio, click on the **View** tab and then click on **Output**.',
    }, {
        searchable_query: 'roblox game output',
        support_contents: 'To open the **Developer Console** (Output) in Roblox, press F9 or type \`/console\` in the **game\'s chat**.',
    }, {
        searchable_query: 'templates',
        support_contents: 'To fix this issue, make sure that your game is published, then restart the Roblox Studio session you are currently in.',
    }, {
        searchable_query: 'product prices',
        support_contents: 'Check out the \`${bot_command_prefix}products\` command for more info on product prices.',
    }, {
        searchable_query: 'paypal',
        support_contents: 'Please open a support ticket (<#814197612491833354>) to purchase using paypal.',
    },
    // {
    //     searchable_query: 'identity token',
    //     support_contents: 'Check out the \`${bot_command_prefix}identity_token\` command for more info on identity tokens.',
    // },
    {
        searchable_query: 'buying products',
        support_contents: 'Check out <#601891200273743932> for more info on buying our products.',
    }, {
        searchable_query: 'using products',
        support_contents: 'Check out <#822726590508957727> for more info on using our products.',
    }, {
        searchable_query: 'support tickets',
        support_contents: 'Check out <#814197612491833354> for more info on support tickets.',
    }, {
        searchable_query: 'refunds',
        support_contents: 'We do not offer refunds as stated by our product hub confirmation screens.',
    },
];

//---------------------------------------------------------------------------------------------------------------//

module.exports = {
    name: 'quick_support',
    description: 'provides a method to quickly look up support topics',
    aliases: ['quick_support', 'qs'],
    permission_level: 'public',
    async execute(message, args) {
        const { command_prefix, command_name, command_args } = args;

        const search_query = command_args.join(' ').trim().toLowerCase();

        if (search_query.length === 0) {
            message.channel.send(new Discord.MessageEmbed({
                color: 0xFFFF00,
                author: {
                    iconURL: `${client.user.displayAvatarURL({ dynamic: true })}`,
                    name: 'Inertia Lighting | Quick Support System',
                },
                title: 'Improper Command Usage!',
                description: 'Please provide a quick support topic to lookup!',
            }));
            return;
        }

        const mapped_qs_topics = [];
        for (const qs_topic of qs_topics) {
            const similarity_score = stringSimilarity.compareTwoStrings(search_query, qs_topic.searchable_query);
            mapped_qs_topics.push({
                ...qs_topic,
                similarity_score: similarity_score,
            });
        }

        const [ matching_qs_topic ] = mapped_qs_topics.filter(qs_topic => qs_topic.similarity_score > 0.55);
        if (!matching_qs_topic) {
            const example_qs_topics = qs_topics.slice(0, 3).map(qs_topic => qs_topic.searchable_query);
            message.channel.send(new Discord.MessageEmbed({
                color: 0xFFFF00,
                author: {
                    iconURL: `${client.user.displayAvatarURL({ dynamic: true })}`,
                    name: 'Inertia Lighting | Quick Support System',
                },
                title: 'Improper Command Usage!',
                description: [
                    'I couldn\'t find quick support topic that matches your search query!',
                    '\nFor example; here are a few quick support topics that you can lookup:',
                    `\`\`\`\n${example_qs_topics.map(example_qs_topic => `${command_prefix}${command_name} ${example_qs_topic}`).join('\n')}\n\`\`\``,
                ].join('\n'),
            }));
            return;
        }

        message.channel.send(new Discord.MessageEmbed({
            color: 0x60A0FF,
            author: {
                iconURL: `${client.user.displayAvatarURL({ dynamic: true })}`,
                name: 'Inertia Lighting | Quick Support System',
            },
            title: `${matching_qs_topic.searchable_query}`,
            description: `${matching_qs_topic.support_contents}`,
        }));
    }
}
