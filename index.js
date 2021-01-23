'use strict';

//---------------------------------------------------------------------------------------------------------------//

require('dotenv').config();

//---------------------------------------------------------------------------------------------------------------//

const fs = require('fs');
const moment = require('moment-timezone');
const Discord = require('discord.js');

//---------------------------------------------------------------------------------------------------------------//

const mongo = require('./mongo');
const userSchema = require('./schemas/userSchema');

//---------------------------------------------------------------------------------------------------------------//

const client = new Discord.Client();
const command_prefix = process.env.COMMAND_PREFIX;

const { commandHandler } = require('./handlers/commandHandler');

//---------------------------------------------------------------------------------------------------------------//

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

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

//---------------------------------------------------------------------------------------------------------------//

const express = require('express');
const bodyParser = require('body-parser');
const router = express.Router();
const app = express();
app.set('port', process.env.SERVER_PORT);

app.use(bodyParser.json()); // parse application/json
app.use('/', router);

//---------------------------------------------------------------------------------------------------------------//

const { userVerify } = require('./server/user/verify');
const { userVerified } = require('./server/user/verified');
const { userProductsFetch } = require('./server/user/fetch-products');
const { userProductsBuy } = require('./server/user/buy-products');

//---------------------------------------------------------------------------------------------------------------//

userVerify(router, client);
userVerified(router, client);
userProductsFetch(router, client);
userProductsBuy(router, client);

/* start the server on the port */
app.listen(app.get('port'), () => {
    console.log(`----------------------------------------------------------------------------------------------------------------`);
    console.log(`Started Bot Server On Port: ${app.get('port')}`);
    console.log(`----------------------------------------------------------------------------------------------------------------`);
});

//---------------------------------------------------------------------------------------------------------------//

/* prevent the script from crashing for unhandledRejections */
process.on('unhandledRejection', (reason, promise) => {
    console.error('----------------------------------------------------------------------------------------------------------------');
    console.trace('unhandledRejection at:', reason?.stack ?? reason, promise);
    console.error('----------------------------------------------------------------------------------------------------------------');
});

/* prevent the script from crashing for uncaughtExceptions */
process.on('uncaughtException', (error) => {
    console.error('----------------------------------------------------------------------------------------------------------------');
    console.trace('uncaughtException at:', error);
    console.error('----------------------------------------------------------------------------------------------------------------');
});
