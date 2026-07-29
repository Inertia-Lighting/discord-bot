/* -------------------------------------------------------------------------- */
/*            Copyright (c) Inertia Lighting, Some Rights Reserved            */
/* -------------------------------------------------------------------------- */

/* ------------------------------ Dependencies ------------------------------ */

import EventEmitter from 'node:events'
import http from 'node:http';
import https from 'node:https';

import got from 'got';

import create_db_handler from './create_db_handler.js'

/* ------------------------------- Definition ------------------------------- */


export class UserUpdateEmitter extends EventEmitter { }

export const event_map = new Map<string, UserUpdateEmitter>();

const httpAgent = new http.Agent({
    keepAlive: true,
    maxSockets: 25,
});

const httpsAgent = new https.Agent({
    keepAlive: true,
    maxSockets: 25,
});

const cache = new Map();


const users_api = got.extend({
    cache: cache,
    prefixUrl: 'https://api.inertia.lighting/',
    timeout: { request: 10_000 },
    headers: { 'Content-Type': 'application/json' },
    retry: { limit: 3 },
    agent: {
        http: httpAgent,
        https: httpsAgent,
    }
});

export type RobloxUsersApiUser = {
    description: string,
    created: string,
    isBanned: boolean,
    externalAppDisplayName: string,
    hasVerifiedBadge: boolean,
    id: number,
    name: string,
    displayName: string
}

/**
 * @async
 *
 * @name getUerUpdates
 * @param {string | number} roblox_id Roblox Id of the user you want to check.
 * @returns {Promise<events.EventEmitter>}
 */
export async function getUserUpdates(roblox_id: string | number): Promise<UserUpdateEmitter> {
    /* -------------------------------------------------------------------------- */


    const code_db = await create_db_handler();

    /* -------------------------------------------------------------------------- */

    const returning_event = new UserUpdateEmitter();
    code_db.event_map.set(roblox_id.toString(), returning_event);
    return returning_event;
}

/* -------------------------------------------------------------------------- */

/**
 * @async
 *
 * @name getUserData
 * @param {string | number } roblox_id
 * @returns {Promise<RobloxUsersApiUser>}
 */
export class UserDataClient<AlwaysReturn extends boolean = boolean> {

    async getUserData(roblox_id: string | number): Promise<AlwaysReturn extends true ? RobloxUsersApiUser : RobloxUsersApiUser | undefined> {
        // console.log(`v1/users/${roblox_id}`);
        console.trace(roblox_id);
        const request = users_api.get<RobloxUsersApiUser>(`v1/users/${roblox_id}`)
        .then(
            (response) => response.body
        );
        try {
            const response = await request;
            const data = response;
            return data as AlwaysReturn extends true ? RobloxUsersApiUser : RobloxUsersApiUser | undefined;
        } catch (error) {
            console.error('Error fetching data:', error);
            if (true as AlwaysReturn) {
                return {
                    id: roblox_id,
                    // Add other default properties as needed
                    name: 'Unknown',
                    displayName: 'Unknown',
                    // ...other default properties...
                } as RobloxUsersApiUser;
            }
            return undefined as AlwaysReturn extends true ? RobloxUsersApiUser : RobloxUsersApiUser | undefined;
        }
    }
}


/* -------------------------------------------------------------------------- */

setInterval(async () => {
    /* -------------------------------------------------------------------------- */


    const code_db = await create_db_handler();

    /* -------------------------------------------------------------------------- */

    code_db.event_map.forEach(async (v, k) => {
        // console.log(k);
        const request = await users_api.get<RobloxUsersApiUser>(`v1/users/${k}`)
        .then(
            // eslint-disable-next-line max-nested-callbacks
            (response) => response.body
        );
        const request_data = request;
        v.emit('Update', request_data);
    });
}, 30000);
