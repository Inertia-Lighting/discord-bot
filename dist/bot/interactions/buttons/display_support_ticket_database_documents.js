/* Copyright © Inertia Lighting | All Rights Reserved */
//---------------------------------------------------------------------------------------------------------------//
'use strict';
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
//---------------------------------------------------------------------------------------------------------------//
const Discord = __importStar(require("discord.js"));
//---------------------------------------------------------------------------------------------------------------//
const mongo_js_1 = require("../../../mongo/mongo.js");
//---------------------------------------------------------------------------------------------------------------//
module.exports = {
    identifier: 'display_support_ticket_database_documents',
    async execute(interaction) {
        if (!interaction.inCachedGuild())
            return;
        await interaction.deferReply({ ephemeral: true });
        const channel = interaction.channel;
        const support_ticket_owner_id = channel.name.match(/(?!.*\-)?([0-9])+/i)?.[0];
        /* check if the user is blacklisted */
        const [db_blacklisted_user_data] = await mongo_js_1.go_mongo_db.find(process.env.MONGO_DATABASE_NAME, process.env.MONGO_BLACKLISTED_USERS_COLLECTION_NAME, {
            'identity.discord_user_id': support_ticket_owner_id,
        }, {
            projection: {
                '_id': false,
            },
        });
        if (db_blacklisted_user_data) {
            await interaction.editReply({
                embeds: [
                    new Discord.MessageEmbed({
                        color: 0xFF0000,
                        author: {
                            iconURL: `${interaction.client.user.displayAvatarURL({ dynamic: true })}`,
                            name: 'Inertia Lighting | Blacklist System',
                        },
                        description: [
                            '\`\`\`',
                            'User is blacklisted from using Inertia Lighting products!',
                            '\`\`\`',
                            '\`\`\`json',
                            `${JSON.stringify(db_blacklisted_user_data, null, 2)}`,
                            '\`\`\`',
                        ].join('\n'),
                    }),
                ],
            }).catch(console.warn);
            return; // don't continue if the user is blacklisted
        }
        /* send the user document */
        const [db_user_data] = await mongo_js_1.go_mongo_db.find(process.env.MONGO_DATABASE_NAME, process.env.MONGO_USERS_COLLECTION_NAME, {
            'identity.discord_user_id': support_ticket_owner_id,
        }, {
            projection: {
                '_id': false,
            },
        });
        await interaction.editReply({
            embeds: [
                new Discord.MessageEmbed({
                    color: 0x60A0FF,
                    author: {
                        iconURL: `${interaction.client.user.displayAvatarURL({ dynamic: true })}`,
                        name: 'Inertia Lighting | User Document',
                    },
                    title: 'This embed is for our support staff.',
                    description: `${'```'}json\n${JSON.stringify(db_user_data ?? 'user not found in database', null, 2)}\n${'```'}`,
                }),
            ],
        }).catch(console.warn);
    },
};
//# sourceMappingURL=display_support_ticket_database_documents.js.map