// ------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
// ------------------------------------------------------------//

import EventEmitter from 'node:events';

import axios from 'axios';

import create_db_handler from './create_db_handler';

// ------------------------------------------------------------//

export class UserUpdateEmitter extends EventEmitter { }

export const event_map = new Map<string, UserUpdateEmitter>();

const users_api = axios.create({
    baseURL: 'https://users.roblox.com/',
    timeout: 1000000,
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
    // ------------------------------------------------------------//

    const code_db = await create_db_handler();

    // ------------------------------------------------------------//
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
        const request = users_api.get<RobloxUsersApiUser>(`v1/users/${roblox_id}`);
        try {
            const response = await request;
            const data = response.data;
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
    // ------------------------------------------------------------//

    const code_db = await create_db_handler();

    // ------------------------------------------------------------//
    code_db.event_map.forEach(async (v, k) => {
        // console.log(k);
        const request = await users_api.get<RobloxUsersApiUser>(`v1/users/${k}`);
        const request_data = request.data;
        v.emit('Update', request_data);
    });
}, 30000);
