import got from 'got' 

const cache = new Map();
const api = got.extend({
    cacheOptions: {
        shared: true,
    },
    cache: cache,
    prefixUrl: 'https://api.inertiadev.uk/',
    timeout: { request: 5000 },
    headers: { 'Content-Type': 'application/json' },
    retry: { limit: 2 },
});

export async function fetchUserProducts(discordId?: string, robloxId?: string) {
    try {
        const data = await api.post('v3/user/products/fetch',
            {
                headers: {
                    'Content-Type': 'application/json',
                },
                json: {
                    discordId,
                    robloxId
                    // roblox_user_id: user_id,
                },
            }
        ).json<string[]>();
        return data
    } catch (err) {
        console.trace(err);
        return {};
    }
}