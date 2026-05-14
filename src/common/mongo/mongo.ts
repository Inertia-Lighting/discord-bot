// ------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved     //
// ------------------------------------------------------------//

import mongoose from 'mongoose';

// ------------------------------------------------------------//

const db_database_name = `${process.env.MONGO_DATABASE_NAME ?? ''}`;
if (db_database_name.length < 1) throw new Error('Environment variable: MONGO_DATABASE_NAME; is not set correctly.');

const mongo_connection_url = `${process.env.MONGO_CONNECTION_URL ?? ''}`;
if (mongo_connection_url.length < 1) throw new Error('environment variable: MONGO_CONNECTION_URL; was not properly set or is empty');

// ------------------------------------------------------------//

const connection = await mongoose.connect(mongo_connection_url, {
    authSource: 'admin',
    appName: 'Discord Bot',
    dbName: db_database_name,
    readPreference: 'primary',
    ssl: false
}).catch((err) => {
    throw new Error(err)
})

// ------------------------------------------------------------//

export {
    connection as MongoDB,
};
