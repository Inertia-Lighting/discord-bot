// ------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
// ------------------------------------------------------------//

import { GoMongoDb } from 'go-mongo-db';

// ------------------------------------------------------------//

const mongo_connection_url = `${process.env.MONGO_CONNECTION_URL ?? ''}`;
if (mongo_connection_url.length < 1) throw new Error('environment variable: MONGO_CONNECTION_URL; was not properly set or is empty');

// ------------------------------------------------------------//

const go_mongo_db = new GoMongoDb(mongo_connection_url);

// ------------------------------------------------------------//

export {
    go_mongo_db,
};
