'use strict';

require('dotenv').config();

//---------------------------------------------------------------------------------------------------------------//

const mongo = require('./mongo');
const userSchema = require('./schemas/userSchema');
const fs = require('fs');
const moment = require('moment-timezone');

//---------------------------------------------------------------------------------------------------------------//

const Discord = require('discord.js');
const client = new Discord.Client();
const prefix = process.env.PREFIX

//---------------------------------------------------------------------------------------------------------------//

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

client.commands = new Discord.Collection();

client.$ = {
    verification_contexts: new Discord.Collection(),
};

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.name, command);
}

function errorEmbed(message) {
    message.channel.send(new Discord.MessageEmbed({
        color: 0xeb8d1a,
        author: {name: `${client.user.username}`, iconURL: `${client.user.avatarURL()}`, url: `https://inertia-lighting.xyz`},
        title: `Command Error`,
        description: `You do not have access to use this command!`
    }));
}

//---------------------------------------------------------------------------------------------------------------//

const express = require('express');
const bodyParser = require('body-parser');
const router = express.Router();
const app = express();
app.set('port', process.env.SERVER_PORT);

//---------------------------------------------------------------------------------------------------------------//

const { commandHandler } = require('./Handlers/commandHandler');
const { userVerify } = require('./server/user/verify');
const { userVerified } = require('./server/user/verified');
const { userFind } = require('./server/user/find-player');
const { userProducts } = require('./server/user/fetch-products');

//---------------------------------------------------------------------------------------------------------------//

userVerify(router, client, userSchema, mongo);
userVerified(router, client, userSchema, mongo);
userFind(router, client, userSchema, mongo);
userProducts(router, client, userSchema, mongo);

//---------------------------------------------------------------------------------------------------------------//
client.on('ready', async () => {
    const ready_timestamp = moment();
    console.log(`----------------------------------------------------------------------------------------------------------------`);
    console.log(`${process.env.BOT_NAME} Logged in as ${client.user.tag} on ${ready_timestamp}`);
    console.log(`----------------------------------------------------------------------------------------------------------------`);
});

client.on('message', async (message) => {
    if (message.author.bot) return;
    if (message.channel.type === 'dm') return;
    commandHandler(client, message, prefix, errorEmbed, mongo, userSchema);
})

client.login(process.env.TOKEN)

//---------------------------------------------------------------------------------------------------------------//

app.use(bodyParser.json()); // parse application/json
app.use('/', router);

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
