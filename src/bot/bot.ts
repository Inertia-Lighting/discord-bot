//------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
//------------------------------------------------------------//

import path from 'node:path';

import { client } from './discord_client';

import recursiveReadDirectory from 'recursive-read-directory';

//------------------------------------------------------------//

async function registerClientEvents() {
    const event_files_path = path.join(process.cwd(), 'dist', 'bot', 'events');
    const event_files = recursiveReadDirectory(event_files_path);

    for (const event_file of event_files) {
        if (!event_file.endsWith('.js')) continue;

        const event_file_path = path.join(event_files_path, event_file);

        // required b/c esm imports are quirky
        const relative_path = path.relative(path.join(process.cwd(), 'dist', 'bot'), event_file_path);
        const esm_compatible_path = `./${relative_path.replace(/\\/g, '/')}`;

        console.info(`Registering client event... ${esm_compatible_path}`);

        const { default: bot_event } = await import(esm_compatible_path).then((imported_module) => {
            // handle esm and commonjs module exports
            const imported_module_exports = imported_module.default ?? imported_module;

            return imported_module_exports;
        }) as {
            default: {
                name: string;
                handler: (...args: unknown[]) => Promise<void>;
            },
        };

        client.on(bot_event.name, bot_event.handler);
    }

    console.info('Registered client events.');
}

//------------------------------------------------------------//

async function main() {
    /* register events */
    await registerClientEvents();
}

main();
