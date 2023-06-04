//------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
//------------------------------------------------------------//

//------------------------------------------------------------//

import * as Discord from 'discord.js';

import { compareTwoStrings } from 'string-similarity';

import { array_random } from '@root/utilities';

import { go_mongo_db } from '@root/mongo/mongo';

import { CustomInteraction, CustomInteractionAccessLevel } from '@root/bot/common/managers/custom_interactions_manager';

import { CustomEmbed } from '@root/bot/common/message';

//------------------------------------------------------------//

const db_database_name = `${process.env.MONGO_DATABASE_NAME ?? ''}`;
if (db_database_name.length < 1) throw new Error('Environment variable: MONGO_DATABASE_NAME; is not set correctly.');

const db_quick_support_topics_collection_name = `${process.env.MONGO_QUICK_SUPPORT_TOPICS_COLLECTION_NAME ?? ''}`;
if (db_quick_support_topics_collection_name.length < 1) throw new Error('Environment variable: MONGO_QUICK_SUPPORT_TOPICS_COLLECTION_NAME; is not set correctly.');

//------------------------------------------------------------//

type QuickSupportTopic = {
    id: string,
    title: string,
    searchable_queries: string[],
    support_contents: string,
};

type QuickSupportTopics = QuickSupportTopic[];

//------------------------------------------------------------//

async function fetchQuickSupportTopics(): Promise<QuickSupportTopics> {
    return await go_mongo_db.find(db_database_name, db_quick_support_topics_collection_name, {}) as unknown as QuickSupportTopics;
}

async function fetchQuickSupportTopicById(
    qs_topic_id: string,
): Promise<QuickSupportTopic> {
    const [ qs_topic ] = await go_mongo_db.find(db_database_name, db_quick_support_topics_collection_name, {
        id: qs_topic_id,
    }) as unknown as QuickSupportTopics;

    return qs_topic;
}

//------------------------------------------------------------//

async function quickSupportAutoCompleteHandler(
    interaction: Discord.AutocompleteInteraction,
): Promise<void> {
    const search_query = interaction.options.getFocused();

    const qs_topics = await fetchQuickSupportTopics();

    const mapped_qs_topics = [];
    for (const qs_topic of qs_topics) {
        let similarity_score_total = 0;
        for (const searchable_query of qs_topic.searchable_queries) {
            similarity_score_total += compareTwoStrings(search_query, searchable_query);
        }

        similarity_score_total += compareTwoStrings(search_query, qs_topic.title) * 1.20; // multiplied for weighted value

        const similarity_score_average = similarity_score_total / qs_topic.searchable_queries.length;

        mapped_qs_topics.push({
            ...qs_topic,
            similarity_score: similarity_score_average,
        });
    }

    const matching_qs_topics = mapped_qs_topics.filter(
        (qs_topic) => qs_topic.similarity_score > 0.20
    ).sort(
        (a, b) => b.similarity_score - a.similarity_score
    );

    // eslint-disable-next-line no-inner-declarations
    function generateRandomQuickSupportTopic(): QuickSupportTopic {
        const random_qs_topic = array_random(qs_topics);

        const already_matched_qs_topic = matching_qs_topics.find(
            (matching_qs_topic) => matching_qs_topic.id === random_qs_topic?.id
        );

        if (!already_matched_qs_topic) return random_qs_topic;

        return generateRandomQuickSupportTopic();
    }

    const random_qs_topics = Array.from({ length: 3 }, generateRandomQuickSupportTopic);

    await interaction.respond(
        [
            ...matching_qs_topics,
            ...random_qs_topics,
        ].slice(0, 5).map(
            (qs_topic) => ({
                name: qs_topic.title,
                value: qs_topic.id,
            })
        )
    ).catch(console.warn);
}

async function quickSupportChatInputHandler(
    interaction: Discord.ChatInputCommandInteraction,
): Promise<void> {
    if (!interaction.inCachedGuild()) return;
    if (!interaction.channel) return;

    await interaction.deferReply({ ephemeral: false });

    const interaction_topic_option = interaction.options.get('topic', true);
    const quick_support_topic_id = interaction_topic_option.value;

    if (typeof quick_support_topic_id !== 'string') {
        console.trace('quickSupportChatInputHandler(): quick_support_topic_id was not a string.');

        await interaction.editReply({
            embeds: [
                CustomEmbed.from({
                    description: 'Something went wrong while fetching the quick support topic.',
                }),
            ],
        }).catch(console.warn);

        return;
    }

    const quick_support_topic = await fetchQuickSupportTopicById(quick_support_topic_id);

    if (!quick_support_topic) {
        await interaction.editReply({
            embeds: [
                CustomEmbed.from({
                    description: 'Unable to find a matching quick support topic.',
                }),
            ],
        }).catch(console.warn);

        return;
    }

    await interaction.editReply({
        embeds: [
            CustomEmbed.from({
                color: 0x60A0FF,
                author: {
                    icon_url: `${interaction.client.user.displayAvatarURL({ forceStatic: false })}`,
                    name: 'Inertia Lighting | Quick Support System',
                },
                title: `${quick_support_topic.title}`,
                description: `${quick_support_topic.support_contents}`,
            }),
        ],
    }).catch(console.warn);
}

//------------------------------------------------------------//

export default new CustomInteraction({
    identifier: 'quick_support',
    type: Discord.InteractionType.ApplicationCommand,
    data: {
        type: Discord.ApplicationCommandType.ChatInput,
        description: 'Quickly fetches support information for a topic.',
        options: [
            {
                name: 'topic',
                type: Discord.ApplicationCommandOptionType.String,
                description: 'The topic to fetch support information for.',
                autocomplete: true,
                required: true,
            },
        ],
    },
    metadata: {
        required_access_level: CustomInteractionAccessLevel.Public,
    },
    handler: async (discord_client, interaction) => {
        if (interaction.isAutocomplete()) {
            await quickSupportAutoCompleteHandler(interaction);
        } else if (interaction.isChatInputCommand()) {
            await quickSupportChatInputHandler(interaction);
        }
    },
});
