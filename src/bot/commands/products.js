'use strict';

//---------------------------------------------------------------------------------------------------------------//

const mongo = require('../../mongo/mongo.js');
const productSchema = require('../../mongo/schemas/productSchema.js');

const { Discord, client } = require('../discord_client.js');

//---------------------------------------------------------------------------------------------------------------//

await mongo();

const db_roblox_products = (await productSchema.find({})).map(({
    name,
    code,
    description,
 }) => ({
    name,
    code,
    description,
}));

console.log({ db_roblox_products });

//---------------------------------------------------------------------------------------------------------------//

module.exports = {
    name: 'products',
    description: 'lists all of the products',
    aliases: ['products'],
    async execute(message, args, client) {

    },
};
