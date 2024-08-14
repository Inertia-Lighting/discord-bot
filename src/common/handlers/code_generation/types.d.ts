import { UserUpdateEmitter } from './user_update';
export interface verification_code_data {
    interaction: CommandInteraction,
    roblox_id: string,
    code: string,
    expiration: number
    event: events.EventEmitter
    message_object: Message;
}

export type user_db_type = {
    codes: verification_code_data[];
}
