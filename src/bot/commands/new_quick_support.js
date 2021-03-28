const stringSimilarity = require('string-similarity');
const { Discord, client } = require('../discord_client.js');

const qs_topics = [
    {
        searchable_query: 'roblox studio output',
        support_contents: 'To open the output window in Roblox Studio, click on the View tab and then click on Ouput.',
    }, {
        searchable_query: 'roblox game output',
        support_contents: 'To open the Developer Console (Output) in Roblox, press F9 or type /console in the Chat.',
    }, {
        searchable_query: 'templates',
        support_contents: 'To fix this issue, make sure your game is published, then restart the studio session you are currently in.',
    }
];

module.exports = {
    name: 'new_quick_support',
    description: 'abooogaaaa',
    aliases: ['nqs'],
    permission_level: 'staff',
    async execute(message, args) {
        const { command_prefix, command_name, command_args } = args;
        const search_query = command_args.join(' ');

        const mapped_qs_topics = [];
        for (const qs_topic of qs_topics) {
            const similarity_score = stringSimilarity.compareTwoStrings(search_query, qs_topic.searchable_query);
            mapped_qs_topics.push({
                ...qs_topic,
                similarity_score: similarity_score,
            });
        }
        const [ best_matching_qs_topic ] = mapped_qs_topics.filter(qs_topic => qs_topic.similarity_score > 0.65);
        console.log(best_matching_qs_topic);
        if (best_matching_qs_topic) {
            message.reply(best_matching_qs_topic.support_contents);
        }
    }
}