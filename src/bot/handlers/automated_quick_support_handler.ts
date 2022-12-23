//------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
//------------------------------------------------------------//

//---------------------------------------------------------------------------------------------------------------//

import { compareTwoStrings } from 'string-similarity';

import { go_mongo_db } from '../../mongo/mongo';

import { Discord, client } from '../discord_client';

import { math_clamp } from '../../utilities';

//---------------------------------------------------------------------------------------------------------------//

type QuickSupportTopic = {
    id: string,
    title: string,
    searchable_queries: string[],
    support_contents: string,
};

//---------------------------------------------------------------------------------------------------------------//

const quick_support_topics: QuickSupportTopic[] = [];

const confidence_threshold = 0.75; // on a scale from <0, 1> (inclusive), how similar the two strings should be to match

//---------------------------------------------------------------------------------------------------------------//

async function updateQuickSupportTopics() {
    quick_support_topics.length = 0; // empty the array

    const db_quick_support_topics = await go_mongo_db.find(process.env.MONGO_DATABASE_NAME as string, process.env.MONGO_QUICK_SUPPORT_TOPICS_COLLECTION_NAME as string, {}) as unknown as QuickSupportTopic[];

    for (const db_quick_support_topic of db_quick_support_topics) {
        quick_support_topics.push(db_quick_support_topic);
    }
}
setImmediate(() => updateQuickSupportTopics());
setInterval(() => updateQuickSupportTopics(), 15 * 60_000); // every 15 minutes

//---------------------------------------------------------------------------------------------------------------//

function getSimilarityScore(string_1: string, string_2: string): number {
    return compareTwoStrings(string_1.toLowerCase(), string_2.toLowerCase()); // returns a number between <0, 1> (inclusive)
}

function generateSimilarityScoreForQuickSupportTopic(user_input: string, quick_support_topic: QuickSupportTopic): number {
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

function findPotentialMatchingQuickSupportTopics(user_input: string): (QuickSupportTopic & { similarity_score: number; })[] {
    const mapped_quick_support_topics = [];
    for (const quick_support_topic of quick_support_topics) {
        mapped_quick_support_topics.push({
            ...quick_support_topic,
            /** On a scale from <0, 1> (inclusive) */
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

async function automatedQuickSupportHandler(message: Discord.Message) {
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
                iconURL: `${client.user!.displayAvatarURL({ forceStatic: false })}`,
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

export {
    automatedQuickSupportHandler,
};
