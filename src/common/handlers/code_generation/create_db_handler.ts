import { UserUpdateEmitter } from './user_update';
import { user_db_type } from './types';


// eslint-disable-next-line func-names
export default async function() {
    const { JSONFilePreset } = await import('lowdb/node');
    const db_pre: user_db_type = { codes: [], events: new Map<string, UserUpdateEmitter>() };
    const code_db = await JSONFilePreset('user_data.json', db_pre);
    return code_db;
}
