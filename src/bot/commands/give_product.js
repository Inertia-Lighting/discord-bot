/* Copyright © Inertia Lighting | All Rights Reserved */

//---------------------------------------------------------------------------------------------------------------//

'use strict';

//---------------------------------------------------------------------------------------------------------------//

const Discord = require('discord.js');

const { go_mongo_db } = require('../../mongo/mongo.js');

//---------------------------------------------------------------------------------------------------------------//

module.exports = {
    name: 'give_product',
    description: 'gives a specified user a specified product',
    aliases: ['gp'],
    permission_level: 'admin',
    async execute(message, args) {
    }
};

//---------------------------------------------------------------------------------------------------------------//
