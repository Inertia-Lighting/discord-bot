'use strict';

//---------------------------------------------------------------------------------------------------------------//

const { string_ellipses } = require('../../utilities.js');

const { Discord, client } = require('../discord_client.js');

//---------------------------------------------------------------------------------------------------------------//

const suggestion_cooldown_tracker = new Discord.Collection();

//---------------------------------------------------------------------------------------------------------------//

async function suggestionsChannelHandler(message) {
    const suggestions_channel = message.channel;

    /* suggestion cooldown */
    const suggestion_cooldown_in_ms = 10_000; // 10 seconds
    const last_suggestion_epoch_for_user = suggestion_cooldown_tracker.get(message.author.id)?.last_suggestion_epoch ?? Date.now() - suggestion_cooldown_in_ms;
    const current_suggestion_epoch = Date.now();
    suggestion_cooldown_tracker.set(message.author.id, { last_suggestion_epoch: current_suggestion_epoch });
    if (current_suggestion_epoch - last_suggestion_epoch_for_user < suggestion_cooldown_in_ms) {
        message.reply('Please don\'t spam suggestions!').catch(console.warn);
        return;
    }

    /* suggestion text */
    const suggestion_text = string_ellipses(message.cleanContent, 1000);

    /* suggestion embed */
    const bot_suggestion_message = await suggestions_channel.send(new Discord.MessageEmbed({
        color: 0x60A0FF,
        author: {
            iconURL: `${message.author.displayAvatarURL({ dynamic: true })}`,
            name: `${message.member.displayName}`,
        },
        description: `${suggestion_text}`,
    })).catch(console.warn);

    /* suggestion embed reactions */
    await bot_suggestion_message.react(`⬆️`);
    await bot_suggestion_message.react(`⬇️`);

    /* remove original message */
    message.delete({ timeout: 500 });
}

//---------------------------------------------------------------------------------------------------------------//

module.exports = {
    suggestionsChannelHandler,
};
