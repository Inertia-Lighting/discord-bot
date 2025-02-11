import { event_map } from './user_update';
export default async function genHandler() {
    const { JSONFilePreset } = await import('lowdb/node');
    interface userData {
        codes: verification_code_data[]
    }

    const defaultData: userData = {
        codes: [],
    };
    const code_db = await JSONFilePreset<userData>('data.json', defaultData);
    return { code_db, event_map };
}
