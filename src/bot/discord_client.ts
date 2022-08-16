/* Copyright © Inertia Lighting | All Rights Reserved */

//---------------------------------------------------------------------------------------------------------------//

import * as Discord from 'discord.js';

//---------------------------------------------------------------------------------------------------------------//

const client = new Discord.Client({
    allowedMentions: {
        parse: [
            'users',
            'roles',
        ],
        repliedUser: true,
    },
    intents: [
        Discord.Intents.FLAGS.GUILDS,
        Discord.Intents.FLAGS.GUILD_MEMBERS,
        Discord.Intents.FLAGS.GUILD_MESSAGES,
        Discord.Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
        Discord.Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS,
        Discord.Intents.FLAGS.GUILD_INTEGRATIONS,
        Discord.Intents.FLAGS.GUILD_WEBHOOKS,
        Discord.Intents.FLAGS.GUILD_INVITES,
        Discord.Intents.FLAGS.GUILD_BANS,
        Discord.Intents.FLAGS.DIRECT_MESSAGES,
    ],
    partials: [
        'CHANNEL',
    ],
    presence: {
        status: 'online',
        activities: [
            {
                type: 'LISTENING',
                name: `${process.env.BOT_COMMAND_PREFIX}help`,
            },
        ],
    },
}) as Discord.Client & {
    $: {
        [key: string]: unknown;
    },
};

client.$ = {
    commands: new Discord.Collection(),
};

//---------------------------------------------------------------------------------------------------------------//

/* login the discord bot */
client.login(process.env.BOT_TOKEN);

//---------------------------------------------------------------------------------------------------------------//

export {
    Discord,
    client,
};
