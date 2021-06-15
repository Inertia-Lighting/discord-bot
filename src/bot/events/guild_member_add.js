/* Copyright © Inertia Lighting | All Rights Reserved */

//---------------------------------------------------------------------------------------------------------------//

'use strict';

//---------------------------------------------------------------------------------------------------------------//

const { Timer } = require('../../utilities.js');
const { go_mongo_db } = require('../../mongo/mongo.js');
const { Discord, client } = require('../discord_client.js');

//---------------------------------------------------------------------------------------------------------------//

const { illegalNicknameHandler } = require('../handlers/illegal_nickname_handler.js');

//---------------------------------------------------------------------------------------------------------------//

const new_user_role_ids = process.env.BOT_NEW_USER_AUTO_ROLE_IDS.split(',');

//---------------------------------------------------------------------------------------------------------------//

module.exports = {
    name: 'guildMemberAdd',
    async handler(member) {
        if (member.user.system) return; // don't operate on system accounts
        if (member.user.bot) return; // don't operate on bots to prevent feedback-loops

        /* handle nicknames for new members */
        await illegalNicknameHandler(member);

        /* give roles to new members */
        for (const role_id of new_user_role_ids) {
            await member.roles.add(role_id).catch(console.warn);
            await Timer(1_000); // prevent api abuse
        }

        /* fetch user data from the database */
        const [ db_user_data ] = await go_mongo_db.find(process.env.MONGO_DATABASE_NAME, process.env.MONGO_USERS_COLLECTION_NAME, {
            'identity.discord_user_id': member.id,
        });

        /* don't continue if the user isn't in the database */
        if (!db_user_data) return;

        /* fetch an up-to-date copy of the products and their info */
        const db_roblox_products = await go_mongo_db.find(process.env.MONGO_DATABASE_NAME, process.env.MONGO_PRODUCTS_COLLECTION_NAME, {});

        /* iterate over all of the user's products (includes non-owned products) */
        for (const [ product_code_from_user, user_owns_product ] of Object.entries(db_user_data.products ?? {})) {
            /* find the product info from the recently fetched products */
            const product = db_roblox_products.find(product => product.code === product_code_from_user);

            /* give the user the role for the product if they own it */
            if (user_owns_product) {
                await member.roles.add(product.discord_role_id).catch(console.warn);
            }

            await Timer(1_000); // prevent api abuse
        }

        /* direct message the user to notify them about the auto-verification */
        const dm_channel = await member.user.createDM();
        dm_channel.send({
            embeds: [ 
                new Discord.MessageEmbed({
                    color: 0x00FF00,
                    author: {
                        iconURL: `${client.user.displayAvatarURL({ dynamic: true })}`,
                        name: 'Inertia Lighting | Auto-Verification',
                    },
                    description: [
                        `Hey there ${member.user}!`,
                        'You were automatically verified since you exist in our system!',
                    ].join('\n\n'),
                }),
            ],
        }).catch(console.warn);
    },
};
