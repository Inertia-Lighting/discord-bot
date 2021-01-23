const Discord = require('discord.js')
async function commandHandler(client, message, prefix, errorEmbed, mongo, userSchema) {
    if (message.content.startsWith(`<@!${client.user.id}>`)) {
        message.reply(`The prefix for me is \`${prefix}\` to see a list of commands do ${prefix}help`);
    }

    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/\s+/g);
    const commandName = args.shift().toLowerCase();
    const command = client.commands.get(commandName) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName))
    if (!command) {
        message.reply(new Discord.MessageEmbed({
            color: 0xeb8d1a,
            author: {name: `${client.user.name}`, iconURL: `${client.user.avatarURL()}`, url: `https://inertia-lighting.xyz`},
            title: `Command Error`,
            description: `That is not a vailid command!`
        }));
        return;
    }

    // Command Options

    if (command.staffOnly && message.member.roles.cache.has('789342326978772992') === false) {
        errorEmbed(message);
        return;
    }

    if (command.ownerOnly && message.author.id !== `196254672418373632` && message.author.id !== '331938622733549590') {
        errorEmbed(message);
        return;
    }

    try {
        command.execute(message, args, client, Discord, prefix, mongo, userSchema);
    } catch (err) {
        console.error(err);
        message.reply(new Discord.MessageEmbed({
            color: 0xff0000,
            author: {name: `${client.user.name}`, iconURL: `${client.user.avatarURL()}`, url: `https://inertia-lighting.xyz`},
            title: `Command Error`,
            description: `Looks like I ran into an error while trying to run ${commandName}`
        }));
    }
}

module.exports = {
    commandHandler,
}
