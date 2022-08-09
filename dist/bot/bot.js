"use strict";
/* Copyright © Inertia Lighting | All Rights Reserved */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
//---------------------------------------------------------------------------------------------------------------//
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const discord_client_js_1 = require("./discord_client.js");
//---------------------------------------------------------------------------------------------------------------//
async function main() {
    const event_files_path = node_path_1.default.join(process.cwd(), './src/bot/events/');
    const event_files = node_fs_1.default.readdirSync(event_files_path).filter(file => file.endsWith('.js'));
    /* register events */
    for (const event_file of event_files) {
        const { default: bot_event } = await Promise.resolve().then(() => __importStar(require(node_path_1.default.join(event_files_path, event_file))));
        discord_client_js_1.client.on(bot_event.name, bot_event.handler);
    }
}
main();
//# sourceMappingURL=bot.js.map