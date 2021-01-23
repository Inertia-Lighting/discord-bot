require('dotenv').config();

const mongoose = require('mongoose');

module.exports = async () => {
    await mongoose.connect(process.env.MONGO_PATH, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useFindAndModify: false,
        keepAlive: true,
    });
    return mongoose;
};
