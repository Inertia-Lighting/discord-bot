"use strict";
/* Copyright © Inertia Lighting | All Rights Reserved */
Object.defineProperty(exports, "__esModule", { value: true });
exports.go_mongo_db = void 0;
//---------------------------------------------------------------------------------------------------------------//
const go_mongo_db_1 = require("go-mongo-db");
//---------------------------------------------------------------------------------------------------------------//
const go_mongo_db = new go_mongo_db_1.GoMongoDB(process.env.MONGO_CONNECTION_URL);
exports.go_mongo_db = go_mongo_db;
//# sourceMappingURL=mongo.js.map