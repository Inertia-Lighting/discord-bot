import prisma from '@/lib/prisma_client.js';

import { FullNote } from '../types.js';

export async function lookupNotesForUser(
    { discordId }: {
        discordId: string,
    }
): Promise<FullNote[]> {

    // const user_notes_find_cursor = await go_mongo_db.find(process.env.MONGO_DATABASE_NAME as string, process.env.MONGO_USER_NOTES_COLLECTION_NAME as string, {
    //     'identity.discord_user_id': discord_user_id,
    // });
    const user = await prisma.user.findFirst({
        where: {
            discordId,
        },
        include: {
            notes: {
                include: {
                    notedUser: true,
                    staffUser: true,
                }
            }
        }
    })

    if (!user) {
        return []
    }

    const user_notes = user.notes;

    return user_notes;
}