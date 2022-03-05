/* Copyright © Inertia Lighting | All Rights Reserved */

//---------------------------------------------------------------------------------------------------------------//

'use strict';

//---------------------------------------------------------------------------------------------------------------//

const stringSimilarity = require('string-similarity');

const { go_mongo_db } = require('../../mongo/mongo.js');

const { client } = require('../discord_client.js');

const { math_clamp } = require('../../utilities.js');

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

const confidence_threshold = 0.75;

//---------------------------------------------------------------------------------------------------------------//

async function updateQuickSupportTopics() {
    const db_quick_support_topics = await go_mongo_db.find(process.env.MONGO_DATABASE_NAME, process.env.MONGO_QUICK_SUPPORT_TOPICS_COLLECTION_NAME, {});

    quick_support_topics.length = 0; // empty the array
    for (const db_quick_support_topic of db_quick_support_topics) {
        quick_support_topics.push(db_quick_support_topic);
    }
}
setImmediate(() => updateQuickSupportTopics());
setInterval(() => updateQuickSupportTopics(), 15 * 60_000); // every 15 minutes

//---------------------------------------------------------------------------------------------------------------//

/**
 * @param {string} string_1
 * @param {string} string_2
 * @returns {number}
 */
function getSimilarityScore(string_1, string_2) {
    return stringSimilarity.compareTwoStrings(string_1.toLowerCase(), string_2.toLowerCase());
}

/**
 * @param {string} user_input
 * @param {QuickSupportTopic} quick_support_topic
 * @returns {number}
 */
function generateSimilarityScoreForQuickSupportTopic(user_input, quick_support_topic) {
    let similarity_score = 0;

    for (const searchable_query of quick_support_topic.searchable_queries) {
        const searchable_query_similarity_score = getSimilarityScore(user_input, searchable_query);
        if (searchable_query_similarity_score <= similarity_score) continue;

        similarity_score = searchable_query_similarity_score;
    }

    const title_similarity_score = getSimilarityScore(user_input, quick_support_topic.title);
    if (title_similarity_score > similarity_score) {
        similarity_score = title_similarity_score;
    }

    return similarity_score;
}

/**
 * @param {string} user_input
 * @returns {(QuickSupportTopic & { similarity_score: number })[]}
 */
function findPotentialMatchingQuickSupportTopics(user_input) {
    const mapped_quick_support_topics = [];
    for (const quick_support_topic of quick_support_topics) {
        mapped_quick_support_topics.push({
            ...quick_support_topic,
            /** On a scale from (0 -> 1) */
            similarity_score: generateSimilarityScoreForQuickSupportTopic(user_input, quick_support_topic),
        });
    }

    const matching_qs_topics = mapped_quick_support_topics.filter(quick_support_topic =>
        quick_support_topic.similarity_score >= confidence_threshold
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

    const matching_qs_topics = findPotentialMatchingQuickSupportTopics(message.cleanContent).slice(0, 3);
    if (matching_qs_topics.length === 0) return;

    message.reply({
        content: [
            `I found ${matching_qs_topics.length} quick support topic(s) that might be related to your message!`,
        ].join('\n'),
        embeds: matching_qs_topics.map(quick_support_topic => ({
            color: 0x60A0FF,
            author: {
                iconURL: `${client.user.displayAvatarURL({ dynamic: true })}`,
                name: 'Inertia Lighting | Automatic Quick Support',
            },
            title: quick_support_topic.title,
            description: quick_support_topic.support_contents,
            footer: {
                text: `Automated Confidence: ${(math_clamp(quick_support_topic.similarity_score * 100, 0, 100)).toFixed(2)}%`,
            },
        })),
    }).catch(console.warn);
}

//---------------------------------------------------------------------------------------------------------------//

module.exports = {
    automatedQuickSupportHandler,
};
