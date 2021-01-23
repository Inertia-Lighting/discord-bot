'use strict';

//---------------------------------------------------------------------------------------------------------------//

const mongoose = require('mongoose');

//---------------------------------------------------------------------------------------------------------------//

const requiredString = {
    type: String,
    required: true,
};

const userSchema = mongoose.Schema({
    '_id': requiredString,
    'ROBLOX_ID': requiredString,
    'products': Object,
});

//---------------------------------------------------------------------------------------------------------------//

module.exports = mongoose.model('users', userSchema);
