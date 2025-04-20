// ------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
// ------------------------------------------------------------//

import Discord from 'discord.js'
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
// import { InteractionsManager } from '@root/common/interactions/handler';


/* ---------------------------- Handle Rejections --------------------------- */

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

/* -------------------------------------------------------------------------- */

const bot_token = process.env.BOT_TOKEN;

const client = new Discord.Client({
  intents: [
    'AutoModerationExecution',
    'DirectMessageReactions',
    'DirectMessages',
    'GuildBans',
    'GuildEmojisAndStickers',
    'GuildExpressions',
    'GuildIntegrations',
    'GuildInvites',
    'GuildMembers',
    'GuildMessagePolls',
    'GuildMessageReactions',
    'GuildMessageTyping',
    'GuildMessages',
    'GuildModeration',
    'GuildPresences',
    'GuildScheduledEvents',
    'GuildVoiceStates',
    'GuildWebhooks',
    'Guilds',
    'MessageContent'
  ],
  partials: [
    Discord.Partials.Channel,
  ],
  presence: {
    status: 'online',
    activities: [
      {
        type: Discord.ActivityType.Watching,
        name: 'Beta Tester',       
      }
    ]
  }
});

console.log('hi')

function registerEvents(): void {
  try {
    const event_path = path.join(process.cwd(), 'dist', 'events')
    const resolved_path = path.resolve(process.cwd(), 'dist', 'events')
    console.log(event_path, resolved_path)
    const events: string[] = fs.readdirSync(event_path)
    for (const event_file of events) {
      if (event_file.endsWith('.map.js') || !event_file.endsWith('.js')) continue;
      const relative_path = path.relative(__dirname, path.join(event_path, event_file))
      import(`./${relative_path.replace(/\\/g, '/')}`).then(({ handler }): void => {
        console.log(event_file.slice(0,-3))
        client.on(event_file.slice(0,-3), (...args) => handler(client, ...args));
      }).catch(console.error);
    }
  } catch (error) {
    console.trace(error)
  }
}

registerEvents()


client.login(bot_token).catch(console.error)

export default client;