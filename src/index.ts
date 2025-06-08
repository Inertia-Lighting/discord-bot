// ------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
// ------------------------------------------------------------//

import 'dotenv/config'

import path from 'node:path';

import * as Discord from 'discord.js';
import recursiveReadDirectory from 'recursive-read-directory';

// ------------------------------------------------------------//

/* prevent from crashing for unhandledRejections */
process.on('unhandledRejection', (reason, promise) => {
    console.error('----------------------------------------------------------------------------------------------------------------');
    console.trace('unhandledRejection at:', reason, promise);
    console.error('----------------------------------------------------------------------------------------------------------------');
});

/* prevent from crashing for uncaughtExceptions */
process.on('uncaughtException', (error) => {
    console.error('----------------------------------------------------------------------------------------------------------------');
    console.trace('uncaughtException at:', error);
    console.error('----------------------------------------------------------------------------------------------------------------');
});

// ------------------------------------------------------------//

const bot_token = `${process.env.BOT_TOKEN ?? ''}`;
if (bot_token.length < 1) throw new Error('Environment variable: BOT_TOKEN; is not set correctly.');

// ------------------------------------------------------------//

const client = new Discord.Client({
    allowedMentions: {
        parse: [
            Discord.AllowedMentionsTypes.User,
            Discord.AllowedMentionsTypes.Role,
        ],
        repliedUser: true,
    },
    intents: [
        Discord.GatewayIntentBits.MessageContent,
        Discord.GatewayIntentBits.Guilds,
        Discord.GatewayIntentBits.GuildMembers,
        Discord.GatewayIntentBits.GuildModeration,
        Discord.GatewayIntentBits.GuildEmojisAndStickers,
        Discord.GatewayIntentBits.GuildIntegrations,
        Discord.GatewayIntentBits.GuildWebhooks,
        Discord.GatewayIntentBits.GuildInvites,
        Discord.GatewayIntentBits.GuildMessages,
        Discord.GatewayIntentBits.GuildMessageReactions,
        Discord.GatewayIntentBits.DirectMessages,
    ],
    partials: [
        Discord.Partials.Channel,
    ],
    presence: {
        status: 'online',
        activities: [
            {
                type: Discord.ActivityType.Listening,
                name: '/help',
            },
        ],
    },
});

// ------------------------------------------------------------//

async function registerClientEvents(
) {
    const event_files_path = path.join(process.cwd(), 'dist', 'events');
    const event_files = recursiveReadDirectory(event_files_path);

    for (const event_file of event_files) {
        if (!event_file.endsWith('.js')) continue;

        const event_file_path = path.join(event_files_path, event_file);

        // required b/c esm imports are quirky
        const relative_path = path.relative(path.join(process.cwd(), 'dist'), event_file_path);
        const esm_compatible_path = `./${relative_path.replace(/\\/g, '/')}`;

        console.info(`Registering client event... ${esm_compatible_path}`);

        const { default: bot_event } = await import(esm_compatible_path).then((imported_module) => {
            // handle esm and commonjs module exports
            const imported_module_exports = imported_module.default ?? imported_module;

            return imported_module_exports;
        }) as {
            default: {
                name: string;
                handler: (client: Discord.Client, ...args: unknown[]) => void;
            },
        };

        client.on(bot_event.name, (...args) => bot_event.handler(client, ...args));
    }

    console.info('Registered client events.');
}

// ------------------------------------------------------------//

async function main() {
    /* login the discord bot */
    await client.login(bot_token);

    /* register events */
    await registerClientEvents(client);
}

main();
