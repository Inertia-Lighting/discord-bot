import prisma from '@/lib/prisma_client.js';

import { FullNote } from '../types.js';

export async function lookupNotesForUser(
    { discordId }: {
        discordId: string,
    }
): Promise<FullNote[]> {

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