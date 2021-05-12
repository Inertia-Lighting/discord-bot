/* Copyright © Inertia Lighting | All Rights Reserved */

//---------------------------------------------------------------------------------------------------------------//

'use strict';

//---------------------------------------------------------------------------------------------------------------//

const fs = require('fs');
const path = require('path');

//---------------------------------------------------------------------------------------------------------------//

const { client } = require('./discord_client.js');

//---------------------------------------------------------------------------------------------------------------//

const command_files_path = path.join(process.cwd(), './src/bot/commands/');
const command_files = fs.readdirSync(command_files_path).filter(file => file.endsWith('.js'));

/* register commands */
for (const command_file of command_files) {
    const bot_command = require(path.join(command_files_path, command_file));
    client.$.commands.set(bot_command.name, bot_command);
}

//---------------------------------------------------------------------------------------------------------------//

const event_files_path = path.join(process.cwd(), './src/bot/events/');
const event_files = fs.readdirSync(event_files_path).filter(file => file.endsWith('.js'));

/* register events */
for (const event_file of event_files) {
    const bot_event = require(path.join(event_files_path, event_file));
    client.on(bot_event.name, bot_event.handler);
}
