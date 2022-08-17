/* Copyright © Inertia Lighting | All Rights Reserved */

//---------------------------------------------------------------------------------------------------------------//

import path from 'node:path';

import { client } from './discord_client';

const recursiveReadDirectory = require('recursive-read-directory');

//---------------------------------------------------------------------------------------------------------------//

async function main() {
    /* register events */
    const event_files_path = path.join(process.cwd(), 'dist', 'bot', 'events');
    const event_files = recursiveReadDirectory(event_files_path);

    for (const event_file of event_files) {
        if (!event_file.endsWith('.js')) continue;

        const event_file_path = path.join(event_files_path, event_file);

        const { default: bot_event } = await import(event_file_path) as {
            default: {
                name: string;
                handler: (...args: unknown[]) => Promise<void>;
            },
        };
        client.on(bot_event.name, bot_event.handler);
    }
}

main();
