'use strict';

//---------------------------------------------------------------------------------------------------------------//

const moment = require('moment-timezone');

//---------------------------------------------------------------------------------------------------------------//

const { client } = require('../discord_client.js');

//---------------------------------------------------------------------------------------------------------------//

const updateBotPresence = ((client) => {
    const statuses = [
        'with Roblox!',
        'with !verify',
        'with Inertia Lighting products!',
    ];

    return (async () => {
        const first_status_item = statuses.shift(); // remove the first item and return it

        const updated_presence = await client.user.setPresence({
            status: 'online',
            activity: {
                type: 'PLAYING',
                name: `${first_status_item}`,
            },
        });

        statuses.push(first_status_item); // append first_status_item to the end of the array

        return updated_presence;
    });
})(client);

//---------------------------------------------------------------------------------------------------------------//

module.exports = {
    name: 'ready',
    async handler() {
        const ready_timestamp = `${moment()}`;
        console.log(`----------------------------------------------------------------------------------------------------------------`);
        console.log(`Discord Bot Logged in as ${client.user.tag} on ${ready_timestamp}`);
        console.log(`----------------------------------------------------------------------------------------------------------------`);

        /* update the bot presence every 5 minutes */
        setInterval(async () => await updateBotPresence(), 5 * 60_000);
    },
};
