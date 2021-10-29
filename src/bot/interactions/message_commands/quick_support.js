/* Copyright © Inertia Lighting | All Rights Reserved */

//---------------------------------------------------------------------------------------------------------------//

'use strict';

//---------------------------------------------------------------------------------------------------------------//

const stringSimilarity = require('string-similarity');

const { array_random } = require('../../../utilities.js');
const { go_mongo_db } = require('../../../mongo/mongo.js');

const { Discord, client } = require('../../discord_client.js');

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

module.exports = {
    identifier: 'quick_support',
    /** @param {Discord.AutocompleteInteraction|Discord.CommandInteraction} interaction */
    async execute(interaction) {
        if (interaction.isAutocomplete()) {
            const search_query = interaction.options.getFocused();

            /** @type {QuickSupportTopics} */
            const qs_topics = await go_mongo_db.find(process.env.MONGO_DATABASE_NAME, process.env.MONGO_QUICK_SUPPORT_TOPICS_COLLECTION_NAME, {});

            const mapped_qs_topics = [];
            for (const qs_topic of qs_topics) {
                let similarity_score_total = 0;
                for (const searchable_query of qs_topic.searchable_queries) {
                    similarity_score_total += stringSimilarity.compareTwoStrings(search_query, searchable_query);
                }

                similarity_score_total += stringSimilarity.compareTwoStrings(search_query, qs_topic.title);

                const similarity_score_average = similarity_score_total / qs_topic.searchable_queries.length;

                mapped_qs_topics.push({
                    ...qs_topic,
                    similarity_score: similarity_score_average,
                });
            }

            const matching_qs_topics = mapped_qs_topics.filter(qs_topic => qs_topic.similarity_score > 0.35);

            // eslint-disable-next-line no-inner-declarations
            function generateRandomQuickSupportTopic() {
                const random_qs_topic = array_random(qs_topics);

                const already_matched_qs_topic = matching_qs_topics.find(matching_qs_topic => matching_qs_topic.id === random_qs_topic?.id);

                if (!already_matched_qs_topic) return random_qs_topic;

                return generateRandomQuickSupportTopic();
            }

            const random_qs_topics = Array.from({ length: 3 }, generateRandomQuickSupportTopic);

            interaction.respond(
                [
                    ...matching_qs_topics,
                    ...random_qs_topics,
                ].slice(0, 5).map(qs_topic => ({
                    name: qs_topic.title,
                    value: qs_topic.id,
                }))
            );
        } else if (interaction.isCommand()) {
            await interaction.deferReply();

            const quick_support_topic_id = interaction.options.get('topic', true)?.value;

            /** @type {QuickSupportTopics} */
            const qs_topics = await go_mongo_db.find(process.env.MONGO_DATABASE_NAME, process.env.MONGO_QUICK_SUPPORT_TOPICS_COLLECTION_NAME, {});

            const quick_support_topic = qs_topics.find(qs_topic => qs_topic.id === quick_support_topic_id);

            if (!quick_support_topic) {
                interaction.followUp({
                    embeds: [
                        new Discord.MessageEmbed({
                            color: 0x60A0FF,
                            description: 'Unable to find a matching quick support topic.',
                        }),
                    ],
                });
                return;
            }

            interaction.followUp({
                embeds: [
                    new Discord.MessageEmbed({
                        color: 0x60A0FF,
                        author: {
                            iconURL: `${client.user.displayAvatarURL({ dynamic: true })}`,
                            name: 'Inertia Lighting | Quick Support System',
                        },
                        title: `${quick_support_topic.title}`,
                        description: `${quick_support_topic.support_contents}`,
                    }),
                ],
            });
        }
    },
};
