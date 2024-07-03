//------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
//------------------------------------------------------------//

import EventEmitter from 'node:events';

import axios from 'axios';
import create_db_handler from './create_db_handler';

//------------------------------------------------------------//

export class UserUpdateEmitter extends EventEmitter {}

export const event_map = new Map<string, UserUpdateEmitter>();

const users_api = axios.create({
    baseURL: 'https://users.roblox.com',
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
        //------------------------------------------------------------//

        const code_db = await create_db_handler();

        //------------------------------------------------------------//
    const returning_event = new UserUpdateEmitter();
    code_db.data.events.set(roblox_id.toString(), returning_event);
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
export async function getUserData(roblox_id: string | number): Promise<RobloxUsersApiUser> {

    const request = await users_api.get<RobloxUsersApiUser>(`/v1/users/${roblox_id}`);
    const request_data = request.data;
    return request_data;
}
/* -------------------------------------------------------------------------- */

setInterval(async () => {
                //------------------------------------------------------------//

                const code_db = await create_db_handler();

                //------------------------------------------------------------//
    code_db.data.events.forEach(async (v, k) => {
        const request = await users_api.get<RobloxUsersApiUser>(`/v1/users/${k}`);
        const request_data = request.data;
        v.emit('Update', request_data);
    });
}, 10000);
