/* -------------------------------------------------------------------------- */
/*            Copyright (c) Inertia Lighting, Some Rights Reserved            */
/* -------------------------------------------------------------------------- */

/* ------------------------------ Dependencies ------------------------------ */

import prisma from '@/lib/prisma_client.js'

/* ------------------------------- Definition ------------------------------- */

export async function purgeNotesFromUser(
    { discordId }: {
        discordId: string,
    }
): Promise<boolean> {
    try {
        await prisma.notes.deleteMany({
            where: {
                notedUser: {
                    discordId
                }
            }
        })
    } catch (error) {
        console.trace('purgeNotesFromUser():', error);
        return false;
    }

    return true;
}