import { Low } from 'lowdb';

import { event_map } from './user_update.js'
;
interface userData {
    codes: verification_code_data[]
}

export default async function genHandler(): Promise<{ code_db: Low<userData>; event_map: typeof event_map }> {
    const { JSONFilePreset } = await import('lowdb/node');

    const defaultData: userData = {
        codes: [],
    };
    const code_db = await JSONFilePreset<userData>('data.json', defaultData);
    return { code_db, event_map };
}
