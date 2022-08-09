/* Copyright © Inertia Lighting | All Rights Reserved */

//---------------------------------------------------------------------------------------------------------------//

import fs from 'node:fs';

import path from 'node:path';

import { client } from './discord_client.js';

//---------------------------------------------------------------------------------------------------------------//

async function main() {
    const event_files_path = path.join(process.cwd(), './src/bot/events/');
    const event_files = fs.readdirSync(event_files_path).filter(file => file.endsWith('.js'));

    /* register events */
    for (const event_file of event_files) {
        const { default: bot_event } = await import(path.join(event_files_path, event_file));
        client.on(bot_event.name, bot_event.handler);
    }
}

main();
