'use strict';

//---------------------------------------------------------------------------------------------------------------//

const mongoose = require('mongoose');

//---------------------------------------------------------------------------------------------------------------//

const requiredString = {
    type: String,
    required: true,
};

const productSchema = mongoose.Schema({
    'id': requiredString,
    'code': requiredString,
    'name': requiredString,
    'discord_role_id': requiredString,
    'description': requiredString,
});

//---------------------------------------------------------------------------------------------------------------//

module.exports = mongoose.model('products', productSchema);
