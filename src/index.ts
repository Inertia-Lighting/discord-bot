// ------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
// ------------------------------------------------------------//

import 'dotenv/config'

import fs from 'node:fs'
import path, { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import * as Discord from 'discord.js';

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

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename)

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
function registerEvents(): void {
  try {
    const event_path = path.join(process.cwd(), 'dist', 'events')
    const resolved_path = path.resolve(process.cwd(), 'dist', 'events')
    console.log(event_path, resolved_path)
    const events: string[] = fs.readdirSync(event_path)
    for (const event_file of events) {
      if (event_file.endsWith('.map.js') || !event_file.endsWith('.js')) continue;
      const relative_path = path.relative(__dirname, path.join(event_path, event_file))
      import(`./${relative_path.replace(/\\/g, '/')}`).then((module): void => {
        console.log(event_file.slice(0,-3))
        client.on(module.default.name, (...args) => module.default.handler(client, ...args));
      }).catch(console.error);
    }
  } catch (error) {
    console.trace(error)
  }
}

registerEvents()


client.login(bot_token).catch(console.error)

export default client;