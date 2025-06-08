// ------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
// ------------------------------------------------------------//

import { Prisma } from '../../lib/prisma';
import prisma from '../../lib/prisma_client';

// ------------------------------------------------------------//

/**
 * Adds a moderation action to the database
 */
export async function addModerationActionToDatabase(punishedUserId: string, staffUserId: string, data: Omit<Prisma.PunishmentsCreateInput, 'punishedUser' | 'staffUser'>): Promise<boolean> {
    const moderation_action_data: Prisma.PunishmentsCreateInput = {
        // 'identity': {
        //     'discord_user_id': identity.discord_user_id,
        // },
        // 'record': {
        //     'id': uuid_v4(),
        //     'type': record.type,
        //     'epoch': record.epoch,
        //     'reason': record.reason,
        //     'staff_member_id': record.staff_member_id,
        // },
        punishedUser: {
            connect: {
                discordId: punishedUserId
            },
        },
        staffUser: {
            connect: {
                discordId: staffUserId
            }
        },
        ...data

    };

    try {
        await prisma.punishments.create({
            data: moderation_action_data,
        })
    } catch (error) {
        console.trace('addModerationActionToDatabase():', error);

        return false;
    }

    return true;
}
