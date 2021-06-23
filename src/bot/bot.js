/* Copyright © Inertia Lighting | All Rights Reserved */

//---------------------------------------------------------------------------------------------------------------//

'use strict';

//---------------------------------------------------------------------------------------------------------------//

const fs = require('fs');
const path = require('path');

//---------------------------------------------------------------------------------------------------------------//

const { client } = require('./discord_client.js');

//---------------------------------------------------------------------------------------------------------------//

const event_files_path = path.join(process.cwd(), './src/bot/events/');
const event_files = fs.readdirSync(event_files_path).filter(file => file.endsWith('.js'));

/* register events */
for (const event_file of event_files) {
    const bot_event = require(path.join(event_files_path, event_file));
    client.on(bot_event.name, bot_event.handler);
}
