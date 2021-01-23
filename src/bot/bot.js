'use strict';

//---------------------------------------------------------------------------------------------------------------//

const fs = require('fs');
const path = require('path');
const moment = require('moment-timezone');
const Discord = require('discord.js');

//---------------------------------------------------------------------------------------------------------------//

const mongo = require('../mongo/mongo.js');
const userSchema = require('../mongo/schemas/userSchema.js');

//---------------------------------------------------------------------------------------------------------------//

const client = new Discord.Client();
const command_prefix = process.env.COMMAND_PREFIX;

const { commandHandler } = require('./handlers/commandHandler.js');

//---------------------------------------------------------------------------------------------------------------//

const test = path.join(process.cwd(), './src/bot/commands/');
console.log({ test });
const commandFiles = fs.readdirSync(test).filter(file => file.endsWith('.js'));

/* expose interface on client for internal usage */
client.$ = {
    commands: new Discord.Collection(),
    verification_contexts: new Discord.Collection(),
};

/* register commands */
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.$.commands.set(command.name, command);
}

//---------------------------------------------------------------------------------------------------------------//

client.on('ready', () => {
    const ready_timestamp = `${moment()}`;
    console.log(`----------------------------------------------------------------------------------------------------------------`);
    console.log(`${process.env.BOT_NAME} Logged in as ${client.user.tag} on ${ready_timestamp}`);
    console.log(`----------------------------------------------------------------------------------------------------------------`);
});

/* handle messages */
client.on('message', async (message) => {
    /* don't allow bots */
    if (message.author.bot) return;

    /* only allow text channels */
    if (message.channel.type !== 'text') return;

    /* respond to mentions */
    if (message.content.startsWith(`<@!${client.user.id}>`)) {
        message.reply(`The command_prefix for me is \`${command_prefix}\`. To see a list of commands do \`${command_prefix}help\`!`).catch(console.warn);
    }

    /* handle commands */
    if (message.content.startsWith(command_prefix)) {
        commandHandler(Discord, client, message, command_prefix, mongo, userSchema);
    }
});

/* login the discord bot */
client.login(process.env.BOT_TOKEN);