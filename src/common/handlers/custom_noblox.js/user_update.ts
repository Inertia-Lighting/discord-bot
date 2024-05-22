//------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
//------------------------------------------------------------//

import * as events from 'events';

import axios from 'axios';

//------------------------------------------------------------//

export const event_map = new Map<string, events.EventEmitter>();

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
export async function getUserUpdates(roblox_id: string | number): Promise<events.EventEmitter> {
    const returning_event = new events.EventEmitter();
    event_map.set(roblox_id.toString(), returning_event);
    return returning_event;
}

setInterval(() => {
    event_map.forEach(async (v, k) => {
        const request = await users_api.get<RobloxUsersApiUser>(`/v1/users/${k}`);
        const request_data = request.data;
        v.emit('Update', request_data);
    });
}, 10000);
