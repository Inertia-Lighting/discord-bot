'use strict';

//---------------------------------------------------------------------------------------------------------------//

module.exports = {
    name: 'echo',
    description: 'sends message',
    staffOnly: true,
    aliases: ['echo'],
    execute(message, args, client, Discord) {
        message.delete();
        message.channel.send(`${args.join(' ')}`).catch(console.warn);
    },
};
