const mongoose = require('mongoose');

const reqString = {
    type: String,
    required: true,
}

const userSchema = mongoose.Schema({
    _id: reqString,
    ROBLOX_ID: reqString,
    products: Object,
});

module.exports = mongoose.model('users', userSchema);
