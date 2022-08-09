"use strict";
/* Copyright © Inertia Lighting | All Rights Reserved */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.client = exports.Discord = void 0;
//---------------------------------------------------------------------------------------------------------------//
const Discord = __importStar(require("discord.js"));
exports.Discord = Discord;
//---------------------------------------------------------------------------------------------------------------//
const client = new Discord.Client({
    allowedMentions: {
        parse: [
            'users',
            'roles',
        ],
        repliedUser: true,
    },
    intents: [
        Discord.Intents.FLAGS.GUILDS,
        Discord.Intents.FLAGS.GUILD_MEMBERS,
        Discord.Intents.FLAGS.GUILD_MESSAGES,
        Discord.Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
        Discord.Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS,
        Discord.Intents.FLAGS.GUILD_INTEGRATIONS,
        Discord.Intents.FLAGS.GUILD_WEBHOOKS,
        Discord.Intents.FLAGS.GUILD_INVITES,
        Discord.Intents.FLAGS.GUILD_BANS,
        Discord.Intents.FLAGS.DIRECT_MESSAGES,
    ],
    partials: [
        'CHANNEL',
    ],
    presence: {
        status: 'online',
        activities: [
            {
                type: 'LISTENING',
                name: `${process.env.BOT_COMMAND_PREFIX}help`,
            },
        ],
    },
});
exports.client = client;
client.$ = {
    commands: new Discord.Collection(),
    interactions: new Discord.Collection(),
};
//---------------------------------------------------------------------------------------------------------------//
/* login the discord bot */
client.login(process.env.BOT_TOKEN);
//# sourceMappingURL=discord_client.js.map