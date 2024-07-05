//------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
//------------------------------------------------------------//

import * as events from 'events';

import { ButtonStyle, CommandInteraction, ComponentType, Message } from 'discord.js';

import { CustomEmbed } from '../../message.js';

import { getMarkdownFriendlyTimestamp } from '@root/utilities';

import { RobloxUsersApiUser, event_map, getUserData, getUserUpdates } from './user_update.js';

//------------------------------------------------------------//

interface verification_code_data {
    interaction: CommandInteraction,
    roblox_id: string,
    code: string,
    expiration: number
    event: events.EventEmitter
    message_object: Message;
}

//------------------------------------------------------------//

export const codes: Array<verification_code_data> = [];

const db_database_name = `${process.env.MONGO_DATABASE_NAME ?? ''}`;
if (db_database_name.length < 1) throw new Error('Environment variable: MONGO_DATABASE_NAME; is not set correctly.');

const db_products_collection_name = `${process.env.MONGO_PRODUCTS_COLLECTION_NAME ?? ''}`;
if (db_products_collection_name.length < 1) throw new Error('Environment variable: MONGO_PRODUCTS_COLLECTION_NAME; is not set correctly.');

const db_users_collection_name = `${process.env.MONGO_USERS_COLLECTION_NAME ?? ''}`;
if (db_users_collection_name.length < 1) throw new Error('Environment variable: MONGO_USERS_COLLECTION_NAME; is not set correctly.');

const word_array = ['white', 'black', 'source', 'copy', 'possible', 'new', 'native', 'rocks', 'apple', 'pear', 'tree', 'quackers', 'aiden', 'cole', 'cheese', 'pizza', 'man', 'transfer', 'ticket', 'products', 'alpha', 'bravo', 'charlie', 'delta', 'echo', 'foxtrot', 'golf', 'hotel', 'india', 'lima', 'mike', 'november', 'oscar', 'papa', 'romeo', 'tango', 'uniform', 'victor', 'zulu'];

const special_word_array = ['inertia', 'recovery', 'lighting'];

const code_length = 10;

//------------------------------------------------------------//

/**
 * @async
 * @param {string | number} user_id Discord User Id
 * @param {CommandInteraction} interaction Interaction for reply
 * @returns {Promise<[boolean, string | Error]>}
 *
 * @example generateVerificationCode(269953912058937345, interaction)
 *
 */

async function checkUser(user_id: string, interaction: CommandInteraction) {
    const user_data = await getUserData(user_id);
    codes.filter((data: verification_code_data) => data.roblox_id === user_id).forEach((data) => {
        interaction.editReply({
            embeds: [
                CustomEmbed.from({
                    title: 'CODE ALREADY PENDING',
                    description: `**${user_data.name}** already has a pending code...`,
                }),
            ],
            components: [
                {
                    type: ComponentType.ActionRow,
                    components: [
                        {
                            type: ComponentType.Button,
                            url: `${data.message_object.url}`,
                            style: ButtonStyle.Link,
                            label: 'Code',
                        },
                    ],
                },
            ],
        });
        return false;
    });
    return true;
}

export async function generateVerificationCode(user_id: string, interaction: CommandInteraction): Promise<undefined> {
    if (await checkUser(user_id, interaction) === false) return;
    let code: string = '';
    const random_places: Array<[number, string]> = [];
    special_word_array.forEach((word) => {
        let isValid;
        let position: number;
        do {
            position = Math.floor(Math.random() * code_length);
            isValid = true;
            for (let j = 0; j < random_places.length; j++) {
                if (Math.abs(position - random_places[j][0]) <= 1) {
                    isValid = false;
                    break;
                }
            }
        } while (!isValid);
        random_places.push([position, word]);
    });

    for (let i = 0; i < code_length; i++) {
        const find_query = random_places.find((element) => element[0] === i);
        if (find_query) {
            code += `${find_query[1]} `;
        } else {

            code += `${word_array[Math.floor(Math.random() * word_array.length)]} `;
        }
        code.trim();
    }
    //Generic typing because noblox.js doesn't have typings for "onBlurbChange"
    const user_data = await getUserData(user_id);
    const event = await getUserUpdates(user_id);
    const message_object = (await interaction.fetchReply());
    const push_data = {
        interaction: interaction,
        roblox_id: user_id,
        code: code,
        expiration: Date.now() + 43200000,
        event: event,
        message_object: message_object,
    };
    codes.push(push_data);

    const discord_friendly_timestamp = getMarkdownFriendlyTimestamp(push_data.expiration);

    //send message to channel detailing how to verify.
    interaction.editReply({
        embeds: [
            CustomEmbed.from({
                title: 'Awaiting verification',
                description: `**${user_data.name}** must verify their account <t:${discord_friendly_timestamp}:R>. Failing to do so may result in this ticket being closed by staff for inactivity.`,
                fields: [
                    {
                        name: 'Code',
                        value: `\`\`\`${push_data.code}\`\`\``,
                    },
                    {
                        name: 'Help',
                        value: 'https://chesse.needs.rest/chrome_W4BT0T84nm.gif',
                    },
                ],
            }),
        ],
        components: [
            {
                type: ComponentType.ActionRow,
                components: [
                    {
                        type: ComponentType.Button,
                        url: `https://roblox.com/users/${user_id}/profile`,
                        style: ButtonStyle.Link,
                        label: 'Your profile',
                    },
                ],
            },
        ],
    });

    try {


        event.on('Update', (data: RobloxUsersApiUser) => {
            const regexFilter = `\\b${push_data.code.trim()}\\b`;
            console.log(regexFilter);
            const contains_code = new RegExp(regexFilter, 'i').test(data.description);
            console.log(contains_code);
            if (contains_code) {
                interaction.editReply({
                    embeds: [
                        CustomEmbed.from({
                            color: CustomEmbed.Color.Green,
                            title: 'SUCCESS',
                            description: 'Successfully verified account! Please wait for a staff member to assist you.',
                        }),
                    ],
                });
                event_map.delete(push_data.roblox_id);
                codes.filter((data) => data.roblox_id === user_id).forEach((_Object, index) => codes.splice(index));
                console.log('The recovery code is part of the user\'s blurb.');
                return;
            } else {
                console.log('The recovery code is not part of the user\'s blurb.');
                console.log(`Wanted: ${push_data.code}`);
                console.log(`Got this instead: ${data.description}`);
            }
        });
    } catch (error) {
        console.trace(error);
        return;
    }
}

/* -------------------------------------------------------------------------- */

setInterval(() => {

    codes.filter((element) => element.expiration <= Date.now()).forEach((data, index) => {
        data.interaction?.editReply({
            embeds: [
                CustomEmbed.from({
                    color: CustomEmbed.Color.Red,
                    title: 'COULD NOT VERIFY',
                    description: 'We could not verify your account in time.',
                }),
            ],
        });
        codes.splice(index);

    });
}, 60000);
