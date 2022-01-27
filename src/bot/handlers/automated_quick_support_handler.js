/* Copyright © Inertia Lighting | All Rights Reserved */

//---------------------------------------------------------------------------------------------------------------//

'use strict';

//---------------------------------------------------------------------------------------------------------------//

const stringSimilarity = require('string-similarity');

const { go_mongo_db } = require('../../mongo/mongo.js');

const { client } = require('../../discord_client.js');

//---------------------------------------------------------------------------------------------------------------//

/**
 * @typedef {{
 *  id: string,
 *  title: string,
 *  searchable_queries: string[],
 *  support_contents: string,
 * }} QuickSupportTopic
 * @typedef {QuickSupportTopic[]} QuickSupportTopics
 */

//---------------------------------------------------------------------------------------------------------------//

/** @type {QuickSupportTopics} */
const quick_support_topics = [];

//---------------------------------------------------------------------------------------------------------------//

async function updateQuickSupportTopics() {
    const db_quick_support_topics = await go_mongo_db.find(process.env.MONGO_DATABASE_NAME, process.env.MONGO_QUICK_SUPPORT_TOPICS_COLLECTION_NAME, {});

    quick_support_topics.length = 0; // empty the array
    for (const db_quick_support_topic of db_quick_support_topics) {
        quick_support_topics.push(db_quick_support_topic);
    }
}
setImmediate(() => updateQuickSupportTopics());
setInterval(() => updateQuickSupportTopics(), 10 * 60_000); // every 10 minutes

async function findPotentialMatchingQuickSupportTopics(user_input) {
    const mapped_quick_support_topics = [];
    for (const quick_support_topic of quick_support_topics) {
        let similarity_score_total = 0;
        for (const searchable_query of quick_support_topic.searchable_queries) {
            similarity_score_total += stringSimilarity.compareTwoStrings(user_input, searchable_query);
        }

        similarity_score_total += stringSimilarity.compareTwoStrings(user_input, quick_support_topic.title) * 1.20; // multiplied for weighted value

        const similarity_score_average = similarity_score_total / quick_support_topic.searchable_queries.length;

        mapped_quick_support_topics.push({
            ...quick_support_topic,
            similarity_score: similarity_score_average,
        });
    }

    const matching_qs_topics = mapped_quick_support_topics.filter(quick_support_topic =>
        quick_support_topics.similarity_score > 0.80
    ).sort((a, b) =>
        b.similarity_score - a.similarity_score
    );

    return matching_qs_topics;
}

//---------------------------------------------------------------------------------------------------------------//

/**
 * @param {Discord.Message} message
 */
async function automatedQuickSupportHandler(message) {
    if (message.author.system || message.author.bot) return;
    if (message.cleanContent.length < 5) return;
    if (!(/\w+/gi).test(message.cleanContent)) return;

    const matching_qs_topics = (await findPotentialMatchingQuickSupportTopics(message.cleanContent)).slice(0, 3);
    if (matching_qs_topics.length === 0) return;

    console.log({
        matching_qs_topics,
    });

    message.reply({
        content: [
            `I found ${matching_qs_topics.length} quick support topics that might be relevant to your message!`,
        ].join('\n'),
        embeds: matching_qs_topics.map(quick_support_topic => ({
            color: 0x60A0FF,
            author: {
                iconURL: `${client.user.displayAvatarURL({ dynamic: true })}`,
                name: 'Inertia Lighting | Quick Support System',
            },
            title: quick_support_topic.title,
            description: quick_support_topic.support_contents,
            footer: {
                text: `${quick_support_topic.similarity_score.toFixed(2)}%`,
            },
        })),
    }).catch(console.warn);
}

//---------------------------------------------------------------------------------------------------------------//

module.exports = {
    automatedQuickSupportHandler,
};
